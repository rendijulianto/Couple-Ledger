import { Elysia, t } from "elysia";
import {
  CreateWorkspaceInputSchema,
  JoinWorkspaceInputSchema,
  UpdateWorkspaceDatePolicyInputSchema,
  ReviewPolicyApprovalInputSchema,
} from "@couple-ledger/shared";
import { workspaceService } from "../services/workspace.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const workspaceController = new Elysia({ prefix: "/workspaces" })
  .use(authGuard)
  .post(
    "/",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const workspace = await workspaceService.createWorkspace(
        user.id,
        body,
        meta,
      );

      return {
        success: true,
        data: {
          id: workspace.id,
          name: workspace.name,
          inviteCode: workspace.inviteCode,
          datePolicy: workspace.datePolicy,
          role: workspace.role,
          createdAt: workspace.createdAt.toISOString(),
          members: workspace.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        },
      };
    },
    {
      body: CreateWorkspaceInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Buat ruang / workspace keuangan baru",
      },
    },
  )
  .post(
    "/join",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const workspace = await workspaceService.joinWorkspace(
        user.id,
        body,
        meta,
      );

      return {
        success: true,
        data: {
          id: workspace.id,
          name: workspace.name,
          inviteCode: workspace.inviteCode,
          datePolicy: workspace.datePolicy,
          role: workspace.role,
          createdAt: workspace.createdAt.toISOString(),
          members: workspace.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        },
      };
    },
    {
      body: JoinWorkspaceInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Gabung ke ruang bersama menggunakan kode undangan",
      },
    },
  )
  .get(
    "/",
    async ({ user }) => {
      const workspaces = await workspaceService.getUserWorkspaces(user.id);

      return {
        success: true,
        data: workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          inviteCode: w.inviteCode,
          datePolicy: w.datePolicy,
          role: w.role,
          createdAt: w.createdAt.toISOString(),
          members: w.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        })),
      };
    },
    {
      detail: {
        tags: ["Workspace"],
        summary: "Ambil daftar semua workspace milik pengguna",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, user }) => {
      const workspace = await workspaceService.getWorkspaceDetails(id, user.id);

      return {
        success: true,
        data: {
          id: workspace.id,
          name: workspace.name,
          inviteCode: workspace.inviteCode,
          datePolicy: workspace.datePolicy,
          role: workspace.role,
          createdAt: workspace.createdAt.toISOString(),
          members: workspace.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Workspace"],
        summary: "Ambil detail ruang bersama beserta anggotanya",
      },
    },
  )
  .patch(
    "/:id/date-policy",
    async ({ params: { id }, body, user, request, set }) => {
      const meta = getRequestMeta(request);
      const result = await workspaceService.updateDatePolicy(
        user.id,
        id,
        body.datePolicy as "STRICT_TODAY" | "FLEXIBLE",
        meta,
      );

      if (result.pendingApproval) {
        set.status = 202;
        return {
          success: true,
          requiresApproval: true,
          pendingApproval: true,
          approvalId: result.approvalId,
          message: result.message,
        };
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateWorkspaceDatePolicyInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Update kebijakan tanggal pencatatan transaksi di ruang (butuh persetujuan jika ada 2 anggota)",
      },
    },
  )
  .get(
    "/:id/policy-approvals",
    async ({ params: { id }, user }) => {
      const approvals = await workspaceService.listPendingPolicyApprovals(
        user.id,
        id,
      );

      return {
        success: true,
        data: approvals.map((a) => ({
          id: a.id,
          workspaceId: a.workspaceId,
          requesterId: a.requesterId,
          requesterName: a.requester.name,
          policyType: a.policyType,
          targetValue: a.targetValue,
          currentValue: a.currentValue,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Workspace"],
        summary: "Daftar pengajuan persetujuan kebijakan di workspace yang pending",
      },
    },
  )
  .post(
    "/policy-approvals/:id/review",
    async ({ params: { id }, body, user, request }) => {
      const meta = getRequestMeta(request);
      const result = await workspaceService.reviewPolicyApproval(
        user.id,
        id,
        body.action,
        meta,
      );

      return {
        success: true,
        message: result.message,
        data: result.approval,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: ReviewPolicyApprovalInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Setujui atau tolak pengajuan perubahan kebijakan ruang oleh pasangan",
      },
    },
  )
  .get(
    "/:id/audit-logs",
    async ({ params: { id }, user }) => {
      const logs = await workspaceService.getAuditLogs(id, user.id);
      return { success: true, data: logs };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Workspace"],
        summary: "Ambil jejak audit log di workspace",
      },
    },
  );
