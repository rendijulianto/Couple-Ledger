import { randomBytes } from "crypto";
import type { IWorkspaceRepository, PopulatedWorkspaceApproval } from "../repositories/interfaces/workspace.repository.interface";
import type { IMemberRepository } from "../repositories/interfaces/member.repository.interface";
import type { SafeUser, IUserRepository } from "../repositories/interfaces/user.repository.interface";
import type { IAuditLogRepository } from "../repositories/interfaces/audit.repository.interface";
import { workspaceRepository } from "../repositories/drizzle/workspace.repository";
import { memberRepository } from "../repositories/drizzle/member.repository";
import { auditLogRepository } from "../repositories/drizzle/audit.repository";
import { userRepository } from "../repositories/drizzle/user.repository";
import { notifierService, NotifierService } from "./notifier.service";
import { realtimeService, RealtimeService } from "./realtime.service";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../domain/errors";
import type {
  CreateWorkspaceInput,
  JoinWorkspaceInput,
} from "@couple-ledger/shared";
import type { Workspace, Member } from "../db/schema";
import type { RequestMeta } from "./auth.service";

export class WorkspaceService {
  constructor(
    private readonly workspaces: IWorkspaceRepository = workspaceRepository,
    private readonly members: IMemberRepository = memberRepository,
    private readonly users: IUserRepository = userRepository,
    private readonly audit: IAuditLogRepository = auditLogRepository,
    private readonly notifier: NotifierService = notifierService,
    private readonly realtime: RealtimeService = realtimeService,
  ) {}

  async createWorkspace(
    userId: string,
    input: CreateWorkspaceInput,
    meta?: RequestMeta,
  ): Promise<Workspace & { members: Array<Member & { user: SafeUser }>; role: string }> {
    const inviteCode = await this.generateUniqueInviteCode();

    const workspace = await this.workspaces.create({
      name: input.name,
      inviteCode,
    });

    const member = await this.members.addMember({
      workspaceId: workspace.id,
      userId,
      role: "OWNER",
    });

    await this.audit.record({
      workspaceId: workspace.id,
      actorId: userId,
      action: "WORKSPACE_CREATED",
      entityType: "WORKSPACE",
      entityId: workspace.id,
      after: { name: workspace.name, inviteCode: workspace.inviteCode },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    const memberList = await this.members.listByWorkspace(workspace.id);

    return {
      ...workspace,
      role: member.role,
      members: memberList,
    };
  }

  async joinWorkspace(
    userId: string,
    input: JoinWorkspaceInput,
    meta?: RequestMeta,
  ): Promise<Workspace & { members: Array<Member & { user: SafeUser }>; role: string }> {
    const cleanCode = input.inviteCode.trim().toUpperCase();
    const workspace = await this.workspaces.findByInviteCode(cleanCode);
    if (!workspace) {
      throw new NotFoundError("Kode undangan tidak valid atau ruang tidak ditemukan");
    }

    const isMember = await this.members.findByWorkspaceAndUser(
      workspace.id,
      userId,
    );
    if (isMember) {
      throw new ConflictError("Anda sudah bergabung di ruang ini");
    }

    // STRICT ATURAN A3: Maksimal 2 anggota per household/workspace!
    const currentMemberCount = await this.members.countMembers(workspace.id);
    if (currentMemberCount >= 2) {
      throw new ConflictError("Ruang sudah penuh (maksimal 2 anggota)");
    }

    const newMember = await this.members.addMember({
      workspaceId: workspace.id,
      userId,
      role: "MEMBER",
    });

    await this.audit.record({
      workspaceId: workspace.id,
      actorId: userId,
      action: "WORKSPACE_JOINED",
      entityType: "WORKSPACE",
      entityId: workspace.id,
      after: { joinedUserId: userId, role: newMember.role },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    const memberList = await this.members.listByWorkspace(workspace.id);

    return {
      ...workspace,
      role: newMember.role,
      members: memberList,
    };
  }

  async getUserWorkspaces(
    userId: string,
  ): Promise<Array<Workspace & { role: string; members: Array<Member & { user: SafeUser }> }>> {
    const memberships = await this.members.listByUser(userId);
    if (memberships.length === 0) {
      return [];
    }

    const workspaceIds = memberships.map((m) => m.workspace.id);
    const allMembers = await this.members.listByWorkspaces(workspaceIds);

    const membersByWorkspace = new Map<string, Array<Member & { user: SafeUser }>>();
    for (const member of allMembers) {
      const list = membersByWorkspace.get(member.workspaceId) ?? [];
      list.push(member);
      membersByWorkspace.set(member.workspaceId, list);
    }

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      members: membersByWorkspace.get(m.workspace.id) ?? [],
    }));
  }

  async getWorkspaceDetails(
    workspaceId: string,
    userId: string,
  ): Promise<Workspace & { role: string; members: Array<Member & { user: SafeUser }> }> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Ruang tidak ditemukan");
    }

    const memberList = await this.members.listByWorkspace(workspaceId);

    return {
      ...workspace,
      role: member.role,
      members: memberList,
    };
  }

  async ensureMembership(workspaceId: string, userId: string): Promise<Member> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }
    return member;
  }

  async updateDatePolicy(
    userId: string,
    workspaceId: string,
    targetPolicy: "STRICT_TODAY" | "FLEXIBLE",
    meta?: RequestMeta,
  ): Promise<{
    pendingApproval: boolean;
    approvalId?: string;
    message: string;
    data?: Workspace;
  }> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Ruang tidak ditemukan");
    }

    if (workspace.datePolicy === targetPolicy) {
      throw new ConflictError(
        `Kebijakan tanggal '${targetPolicy === "STRICT_TODAY" ? "Wajib Hari Ini" : "Bebas/Dinamis"}' sudah aktif pada ruang ini`,
      );
    }

    const memberCount = await this.members.countMembers(workspaceId);

    // Jika sudah ada 2 anggota (pasangan), WAJIB konfirmasi/persetujuan pasangan!
    if (memberCount >= 2) {
      const pending = await this.workspaces.findPendingPolicyApproval(
        workspaceId,
        "DATE_POLICY",
      );
      if (pending) {
        throw new ConflictError(
          "Masih ada pengajuan perubahan kebijakan tanggal yang menunggu persetujuan pasangan",
        );
      }

      const approval = await this.workspaces.createPolicyApproval({
        workspaceId,
        requesterId: userId,
        policyType: "DATE_POLICY",
        targetValue: targetPolicy,
        currentValue: workspace.datePolicy,
        status: "PENDING",
      });

      await this.audit.record({
        workspaceId,
        actorId: userId,
        action: "WORKSPACE_DATE_POLICY_REQUESTED",
        entityType: "WORKSPACE",
        entityId: workspaceId,
        before: { datePolicy: workspace.datePolicy },
        after: { datePolicy: targetPolicy },
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      const user = await this.users.findById(userId);
      if (user) {
        this.notifier.notifyPolicyApprovalRequested(
          workspaceId,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          targetPolicy,
        );
      }

      this.realtime.emit(workspaceId, {
        type: "APPROVAL_REQUESTED",
        actorId: userId,
        data: { policyType: "DATE_POLICY", targetValue: targetPolicy },
      });

      return {
        pendingApproval: true,
        approvalId: approval.id,
        message:
          "Pengajuan perubahan kebijakan tanggal telah dikirim dan menunggu persetujuan pasangan kamu.",
      };
    }

    // Solo user (1 member) langsung diperbarui tanpa menunggu approval
    const updated = await this.workspaces.update(workspaceId, {
      datePolicy: targetPolicy,
    });

    await this.audit.record({
      workspaceId,
      actorId: userId,
      action: "WORKSPACE_DATE_POLICY_UPDATED",
      entityType: "WORKSPACE",
      entityId: workspaceId,
      before: { datePolicy: workspace.datePolicy },
      after: { datePolicy: targetPolicy },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    this.realtime.emit(workspaceId, {
      type: "DATE_POLICY_CHANGED",
      actorId: userId,
      data: { datePolicy: targetPolicy },
    });

    return {
      pendingApproval: false,
      message: "Kebijakan tanggal pencatatan berhasil diubah",
      data: updated,
    };
  }

  async updateTheme(
    userId: string,
    workspaceId: string,
    theme: string,
    meta?: RequestMeta,
  ): Promise<Workspace> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    const workspace = await this.workspaces.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Ruang tidak ditemukan");
    }

    const validThemes = [
      "rausch",
      "rose",
      "emerald",
      "ocean",
      "violet",
      "amber",
      "slate",
    ];
    const targetTheme = theme.toLowerCase().trim();
    if (!validThemes.includes(targetTheme)) {
      throw new ConflictError("Tema warna tidak valid");
    }

    const updated = await this.workspaces.update(workspaceId, {
      theme: targetTheme,
    });

    await this.audit.record({
      workspaceId,
      actorId: userId,
      action: "WORKSPACE_THEME_UPDATED",
      entityType: "WORKSPACE",
      entityId: workspaceId,
      before: { theme: workspace.theme },
      after: { theme: targetTheme },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    this.realtime.emit(workspaceId, {
      type: "THEME_CHANGED",
      actorId: userId,
      data: { theme: targetTheme },
    });

    return updated;
  }

  async listPendingPolicyApprovals(
    userId: string,
    workspaceId: string,
  ): Promise<PopulatedWorkspaceApproval[]> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    return await this.workspaces.listPolicyApprovalsByWorkspace(workspaceId);
  }

  async reviewPolicyApproval(
    userId: string,
    approvalId: string,
    action: "APPROVE" | "REJECT",
    meta?: RequestMeta,
  ): Promise<{ message: string; approval: PopulatedWorkspaceApproval }> {
    const approval = await this.workspaces.findPolicyApprovalById(approvalId);
    if (!approval) {
      throw new NotFoundError("Pengajuan persetujuan kebijakan tidak ditemukan");
    }

    const member = await this.members.findByWorkspaceAndUser(
      approval.workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    // STRICT: Pengaju tidak boleh menyetujui atau menolak permintaannya sendiri!
    if (approval.requesterId === userId) {
      throw new ForbiddenError(
        "Anda tidak dapat mengonfirmasi pengajuan Anda sendiri. Hanya pasangan yang dapat menyetujui atau menolak.",
      );
    }

    if (approval.status !== "PENDING") {
      throw new ConflictError(
        "Pengajuan persetujuan ini sudah pernah diproses sebelumnya",
      );
    }

    const reviewer = await this.users.findById(userId);
    const safeReviewer: SafeUser = reviewer
      ? {
          id: reviewer.id,
          name: reviewer.name,
          email: reviewer.email,
          createdAt: reviewer.createdAt,
          updatedAt: reviewer.updatedAt,
        }
      : {
          id: userId,
          name: "Pasangan",
          email: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    if (action === "APPROVE") {
      await this.workspaces.update(approval.workspaceId, {
        datePolicy: approval.targetValue,
      });

      await this.workspaces.updatePolicyApprovalStatus(
        approvalId,
        "APPROVED",
        userId,
      );

      await this.audit.record({
        workspaceId: approval.workspaceId,
        actorId: userId,
        action: "WORKSPACE_DATE_POLICY_APPROVED",
        entityType: "WORKSPACE",
        entityId: approval.workspaceId,
        before: { datePolicy: approval.currentValue },
        after: { datePolicy: approval.targetValue },
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      this.notifier.notifyPolicyApprovalReviewed(
        approval.workspaceId,
        safeReviewer,
        "APPROVED",
        approval.requesterId,
        approval.targetValue,
      );

      this.realtime.emit(approval.workspaceId, {
        type: "APPROVAL_RESOLVED",
        actorId: userId,
        data: { approvalId, action: "APPROVED" },
      });
      this.realtime.emit(approval.workspaceId, {
        type: "DATE_POLICY_CHANGED",
        actorId: userId,
        data: { datePolicy: approval.targetValue },
      });

      const updated = await this.workspaces.findPolicyApprovalById(approvalId);
      return {
        message: `Perubahan kebijakan tanggal pencatatan telah disetujui`,
        approval: updated!,
      };
    } else {
      await this.workspaces.updatePolicyApprovalStatus(
        approvalId,
        "REJECTED",
        userId,
      );

      await this.audit.record({
        workspaceId: approval.workspaceId,
        actorId: userId,
        action: "WORKSPACE_DATE_POLICY_REJECTED",
        entityType: "WORKSPACE",
        entityId: approval.workspaceId,
        before: { datePolicy: approval.currentValue },
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      this.notifier.notifyPolicyApprovalReviewed(
        approval.workspaceId,
        safeReviewer,
        "REJECTED",
        approval.requesterId,
        approval.targetValue,
      );

      this.realtime.emit(approval.workspaceId, {
        type: "APPROVAL_RESOLVED",
        actorId: userId,
        data: { approvalId, action: "REJECTED" },
      });

      const updated = await this.workspaces.findPolicyApprovalById(approvalId);
      return {
        message: `Pengajuan perubahan kebijakan tanggal pencatatan telah ditolak. Kebijakan lama tetap berlaku.`,
        approval: updated!,
      };
    }
  }

  async getAuditLogs(
    workspaceId: string,
    userId: string,
    limit = 50,
  ) {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    return await this.audit.listByWorkspace(workspaceId, limit);
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString("hex").toUpperCase();
      const existing = await this.workspaces.findByInviteCode(code);
      if (!existing) {
        return code;
      }
    }
    return randomBytes(6).toString("hex").toUpperCase();
  }
}

export const workspaceService = new WorkspaceService();
