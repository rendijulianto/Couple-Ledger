import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  transactionApprovals,
  users,
  type TransactionApproval,
  type NewTransactionApproval,
} from "../../db/schema";
import type {
  IApprovalRepository,
  PopulatedApproval,
} from "../interfaces/approval.repository.interface";

const safeUserSelection = {
  id: users.id,
  name: users.name,
  email: users.email,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export class DrizzleApprovalRepository implements IApprovalRepository {
  async create(data: NewTransactionApproval): Promise<TransactionApproval> {
    const [result] = await db
      .insert(transactionApprovals)
      .values(data)
      .returning();
    if (!result) {
      throw new Error("Gagal membuat pengajuan persetujuan transaksi");
    }
    return result;
  }

  async findById(id: string): Promise<PopulatedApproval | null> {
    const rows = await db
      .select({
        approval: transactionApprovals,
        requester: safeUserSelection,
      })
      .from(transactionApprovals)
      .innerJoin(users, eq(transactionApprovals.requesterId, users.id))
      .where(eq(transactionApprovals.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row.approval,
      requester: row.requester,
    };
  }

  async findPendingByTransaction(
    transactionId: string,
  ): Promise<TransactionApproval | null> {
    const [result] = await db
      .select()
      .from(transactionApprovals)
      .where(
        and(
          eq(transactionApprovals.transactionId, transactionId),
          eq(transactionApprovals.status, "PENDING"),
        ),
      )
      .limit(1);

    return result ?? null;
  }

  async listPendingByWorkspace(
    workspaceId: string,
  ): Promise<PopulatedApproval[]> {
    const rows = await db
      .select({
        approval: transactionApprovals,
        requester: safeUserSelection,
      })
      .from(transactionApprovals)
      .innerJoin(users, eq(transactionApprovals.requesterId, users.id))
      .where(
        and(
          eq(transactionApprovals.workspaceId, workspaceId),
          eq(transactionApprovals.status, "PENDING"),
        ),
      )
      .orderBy(desc(transactionApprovals.createdAt));

    return rows.map((r) => ({
      ...r.approval,
      requester: r.requester,
    }));
  }

  async updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    reviewerId: string,
  ): Promise<TransactionApproval> {
    const [result] = await db
      .update(transactionApprovals)
      .set({
        status,
        reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactionApprovals.id, id))
      .returning();

    if (!result) {
      throw new Error("Gagal memperbarui status persetujuan transaksi");
    }

    return result;
  }
}

export const approvalRepository = new DrizzleApprovalRepository();

