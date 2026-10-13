import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  workspaces,
  workspaceApprovals,
  users,
  type Workspace,
  type NewWorkspace,
  type WorkspaceApproval,
  type NewWorkspaceApproval,
} from "../../db/schema";
import type {
  IWorkspaceRepository,
  PopulatedWorkspaceApproval,
} from "../interfaces/workspace.repository.interface";

const safeUserSelection = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export class DrizzleWorkspaceRepository implements IWorkspaceRepository {
  async findById(id: string): Promise<Workspace | null> {
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);
    return result ?? null;
  }

  async findByInviteCode(code: string): Promise<Workspace | null> {
    const [result] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.inviteCode, code.toUpperCase()))
      .limit(1);
    return result ?? null;
  }

  async create(workspace: NewWorkspace): Promise<Workspace> {
    const [result] = await db
      .insert(workspaces)
      .values({
        ...workspace,
        inviteCode: workspace.inviteCode.toUpperCase(),
      })
      .returning();

    if (!result) {
      throw new Error("Gagal membuat workspace");
    }
    return result;
  }

  async update(id: string, data: Partial<NewWorkspace>): Promise<Workspace> {
    const [result] = await db
      .update(workspaces)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, id))
      .returning();

    if (!result) {
      throw new Error("Gagal memperbarui workspace");
    }
    return result;
  }

  async createPolicyApproval(
    data: NewWorkspaceApproval,
  ): Promise<WorkspaceApproval> {
    const [result] = await db
      .insert(workspaceApprovals)
      .values(data)
      .returning();

    if (!result) {
      throw new Error("Gagal membuat pengajuan persetujuan kebijakan");
    }
    return result;
  }

  async findPendingPolicyApproval(
    workspaceId: string,
    policyType = "DATE_POLICY",
  ): Promise<PopulatedWorkspaceApproval | null> {
    const rows = await db
      .select({
        approval: workspaceApprovals,
        requester: safeUserSelection,
      })
      .from(workspaceApprovals)
      .innerJoin(users, eq(workspaceApprovals.requesterId, users.id))
      .where(
        and(
          eq(workspaceApprovals.workspaceId, workspaceId),
          eq(workspaceApprovals.policyType, policyType),
          eq(workspaceApprovals.status, "PENDING"),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row.approval,
      requester: row.requester,
    };
  }

  async listPolicyApprovalsByWorkspace(
    workspaceId: string,
  ): Promise<PopulatedWorkspaceApproval[]> {
    const rows = await db
      .select({
        approval: workspaceApprovals,
        requester: safeUserSelection,
      })
      .from(workspaceApprovals)
      .innerJoin(users, eq(workspaceApprovals.requesterId, users.id))
      .where(
        and(
          eq(workspaceApprovals.workspaceId, workspaceId),
          eq(workspaceApprovals.status, "PENDING"),
        ),
      )
      .orderBy(desc(workspaceApprovals.createdAt));

    return rows.map((r) => ({
      ...r.approval,
      requester: r.requester,
    }));
  }

  async findPolicyApprovalById(
    id: string,
  ): Promise<PopulatedWorkspaceApproval | null> {
    const rows = await db
      .select({
        approval: workspaceApprovals,
        requester: safeUserSelection,
      })
      .from(workspaceApprovals)
      .innerJoin(users, eq(workspaceApprovals.requesterId, users.id))
      .where(eq(workspaceApprovals.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row.approval,
      requester: row.requester,
    };
  }

  async updatePolicyApprovalStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    reviewerId: string,
  ): Promise<WorkspaceApproval> {
    const [result] = await db
      .update(workspaceApprovals)
      .set({
        status,
        reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workspaceApprovals.id, id))
      .returning();

    if (!result) {
      throw new Error("Gagal memperbarui status persetujuan kebijakan");
    }
    return result;
  }
}

export const workspaceRepository = new DrizzleWorkspaceRepository();
