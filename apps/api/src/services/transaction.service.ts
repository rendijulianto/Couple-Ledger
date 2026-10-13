import type { ITransactionRepository } from "../repositories/interfaces/transaction.repository.interface";
import type { ICategoryRepository } from "../repositories/interfaces/category.repository.interface";
import type { IWalletRepository } from "../repositories/interfaces/wallet.repository.interface";
import type { IMemberRepository } from "../repositories/interfaces/member.repository.interface";
import type { IAuditLogRepository } from "../repositories/interfaces/audit.repository.interface";
import type {
  IApprovalRepository,
  PopulatedApproval,
} from "../repositories/interfaces/approval.repository.interface";
import type { Category } from "../db/schema";
import { transactionRepository } from "../repositories/drizzle/transaction.repository";
import { categoryRepository } from "../repositories/drizzle/category.repository";
import { walletRepository } from "../repositories/drizzle/wallet.repository";
import { memberRepository } from "../repositories/drizzle/member.repository";
import { auditLogRepository } from "../repositories/drizzle/audit.repository";
import { approvalRepository } from "../repositories/drizzle/approval.repository";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from "../domain/errors";
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from "@couple-ledger/shared";
import { notifierService, NotifierService } from "./notifier.service";
import type { PopulatedTransaction } from "../repositories/interfaces/transaction.repository.interface";
import type { IWorkspaceRepository } from "../repositories/interfaces/workspace.repository.interface";
import { workspaceRepository } from "../repositories/drizzle/workspace.repository";
import { formatJakartaDateISO } from "@couple-ledger/shared";
import type { RequestMeta } from "./auth.service";

export class TransactionService {
  constructor(
    private readonly transactions: ITransactionRepository = transactionRepository,
    private readonly categories: ICategoryRepository = categoryRepository,
    private readonly wallets: IWalletRepository = walletRepository,
    private readonly members: IMemberRepository = memberRepository,
    private readonly workspaces: IWorkspaceRepository = workspaceRepository,
    private readonly audit: IAuditLogRepository = auditLogRepository,
    private readonly approvals: IApprovalRepository = approvalRepository,
    private readonly notifier: NotifierService = notifierService,
  ) {}

  async createTransaction(
    userId: string,
    input: CreateTransactionInput,
    meta?: RequestMeta,
  ): Promise<PopulatedTransaction> {
    await this.ensureWorkspaceMembership(input.workspaceId, userId);
    await this.ensureCategoryAccessible(input.categoryId, input.workspaceId);

    if (input.walletId) {
      await this.ensureWalletValid(input.walletId, input.workspaceId);
    }

    const ws = await this.workspaces.findById(input.workspaceId);
    let resolvedDate = input.occurredOn;
    // Jika aturan ruang STRICT_TODAY (default), tanggal wajib hari ini (Jakarta)
    if (ws && ws.datePolicy !== "FLEXIBLE") {
      resolvedDate = formatJakartaDateISO(new Date());
    }

    const transaction = await this.transactions.create({
      workspaceId: input.workspaceId,
      createdById: userId,
      categoryId: input.categoryId,
      walletId: input.walletId ?? null,
      type: input.type,
      amountIdr: input.amountIdr,
      note: input.note ?? null,
      occurredOn: resolvedDate,
    });

    await this.audit.record({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "TRANSACTION_CREATED",
      entityType: "TRANSACTION",
      entityId: transaction.id,
      after: {
        amountIdr: transaction.amountIdr,
        type: transaction.type,
        occurredOn: transaction.occurredOn,
        note: transaction.note,
      },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    const populated = await this.transactions.findById(transaction.id);
    if (!populated) {
      throw new Error("Gagal mengambil data transaksi setelah dibuat");
    }

    // Trigger non-blocking async Telegram notification (excludes creator)
    this.notifier.notifyTransactionCreated(populated, populated.createdBy);

    return populated;
  }

  async listTransactions(
    userId: string,
    filter: TransactionFilter,
  ): Promise<PopulatedTransaction[]> {
    await this.ensureWorkspaceMembership(filter.workspaceId, userId);
    const txList = await this.transactions.list(filter);
    if (txList.length === 0) return [];

    const pendingApprovals = await this.approvals.listPendingByWorkspace(filter.workspaceId);
    if (pendingApprovals.length === 0) {
      return txList;
    }

    const approvalMap = new Map<
      string,
      {
        id: string;
        actionType: "UPDATE" | "DELETE";
        requesterId: string;
        requesterName: string;
      }
    >();

    for (const app of pendingApprovals) {
      approvalMap.set(app.transactionId, {
        id: app.id,
        actionType: app.actionType as "UPDATE" | "DELETE",
        requesterId: app.requesterId,
        requesterName: app.requester.name,
      });
    }

    return txList.map((tx) => ({
      ...tx,
      pendingApproval: approvalMap.get(tx.id) ?? null,
    }));
  }

  async getTransactionById(
    userId: string,
    id: string,
  ): Promise<PopulatedTransaction> {
    const transaction = await this.transactions.findById(id);
    if (!transaction) {
      throw new NotFoundError("Transaksi tidak ditemukan");
    }

    await this.ensureWorkspaceMembership(transaction.workspaceId, userId);
    const pending = await this.approvals.findPendingByTransaction(id);
    return {
      ...transaction,
      pendingApproval: pending
        ? {
            id: pending.id,
            actionType: pending.actionType as "UPDATE" | "DELETE",
            requesterId: pending.requesterId,
          }
        : null,
    };
  }

  async updateTransaction(
    userId: string,
    id: string,
    input: UpdateTransactionInput,
    meta?: RequestMeta,
  ): Promise<
    PopulatedTransaction & {
      approvalId?: string;
      message?: string;
    }
  > {
    const existing = await this.transactions.findById(id);
    if (!existing) {
      throw new NotFoundError("Transaksi tidak ditemukan");
    }

    await this.ensureWorkspaceMembership(existing.workspaceId, userId);

    let resolvedType: "EXPENSE" | "INCOME" = (input.type || existing.type) as "EXPENSE" | "INCOME";
    if (input.categoryId) {
      const cat = await this.ensureCategoryAccessible(input.categoryId, existing.workspaceId);
      resolvedType = cat.type as "EXPENSE" | "INCOME";
    }

    if (input.walletId) {
      await this.ensureWalletValid(input.walletId, existing.workspaceId);
    }

    // Tanggal transaksi lama tidak bisa diubah (integritas catatan & audit)
    const sanitizedInput: UpdateTransactionInput = {
      ...input,
      type: resolvedType,
      occurredOn: existing.occurredOn,
    };

    const memberCount = await this.members.countMembers(existing.workspaceId);

    // KEBUTUHAN APPROVAL PASANGAN (Jika pasangan sudah bergabung / anggota >= 2)
    if (memberCount >= 2) {
      const pending = await this.approvals.findPendingByTransaction(id);
      if (pending) {
        throw new ConflictError("Transaksi ini sudah memiliki pengajuan yang menunggu persetujuan pasangan");
      }

      const approval = await this.approvals.create({
        workspaceId: existing.workspaceId,
        transactionId: id,
        requesterId: userId,
        actionType: "UPDATE",
        payload: sanitizedInput,
        previousSnapshot: {
          id: existing.id,
          amountIdr: existing.amountIdr,
          type: existing.type,
          categoryId: existing.categoryId,
          categoryName: existing.category.name,
          walletId: existing.walletId,
          walletName: existing.wallet?.name ?? null,
          note: existing.note,
          occurredOn: String(existing.occurredOn),
        },
        status: "PENDING",
      });

      await this.audit.record({
        workspaceId: existing.workspaceId,
        actorId: userId,
        action: "TRANSACTION_UPDATE_REQUESTED",
        entityType: "TRANSACTION",
        entityId: id,
        before: existing,
        after: { approvalId: approval.id, payload: sanitizedInput },
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      this.notifier.notifyApprovalRequested(
        existing.workspaceId,
        existing.createdBy,
        "UPDATE",
        existing,
      );

      return {
        ...existing,
        pendingApproval: {
          id: approval.id,
          actionType: "UPDATE",
          requesterId: userId,
          requesterName: existing.createdBy?.name,
        },
        approvalId: approval.id,
        message: "Perubahan transaksi diajukan dan menunggu persetujuan pasangan",
      };
    }

    // Bypass jika masih 1 anggota (belum ada pasangan)
    const beforeSnapshot = {
      amountIdr: existing.amountIdr,
      type: existing.type,
      categoryId: existing.categoryId,
      walletId: existing.walletId,
      note: existing.note,
      occurredOn: existing.occurredOn,
    };

    await this.transactions.update(id, sanitizedInput);

    const updated = await this.transactions.findById(id);
    if (!updated) {
      throw new Error("Gagal mengambil data transaksi setelah diupdate");
    }

    const afterSnapshot = {
      amountIdr: updated.amountIdr,
      type: updated.type,
      categoryId: updated.categoryId,
      walletId: updated.walletId,
      note: updated.note,
      occurredOn: updated.occurredOn,
    };

    await this.audit.record({
      workspaceId: existing.workspaceId,
      actorId: userId,
      action: "TRANSACTION_UPDATED",
      entityType: "TRANSACTION",
      entityId: id,
      before: beforeSnapshot,
      after: afterSnapshot,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return updated;
  }

  async deleteTransaction(
    userId: string,
    id: string,
    meta?: RequestMeta,
  ): Promise<{ pendingApproval?: boolean; approvalId?: string; message: string }> {
    const existing = await this.transactions.findById(id);
    if (!existing) {
      throw new NotFoundError("Transaksi tidak ditemukan");
    }

    await this.ensureWorkspaceMembership(existing.workspaceId, userId);

    const memberCount = await this.members.countMembers(existing.workspaceId);

    // KEBUTUHAN APPROVAL PASANGAN (Jika pasangan sudah bergabung / anggota >= 2)
    if (memberCount >= 2) {
      const pending = await this.approvals.findPendingByTransaction(id);
      if (pending) {
        throw new ConflictError("Transaksi ini sudah memiliki pengajuan yang menunggu persetujuan pasangan");
      }

      const approval = await this.approvals.create({
        workspaceId: existing.workspaceId,
        transactionId: id,
        requesterId: userId,
        actionType: "DELETE",
        previousSnapshot: {
          id: existing.id,
          amountIdr: existing.amountIdr,
          type: existing.type,
          categoryId: existing.categoryId,
          categoryName: existing.category.name,
          walletId: existing.walletId,
          walletName: existing.wallet?.name ?? null,
          note: existing.note,
          occurredOn: String(existing.occurredOn),
        },
        status: "PENDING",
      });

      await this.audit.record({
        workspaceId: existing.workspaceId,
        actorId: userId,
        action: "TRANSACTION_DELETE_REQUESTED",
        entityType: "TRANSACTION",
        entityId: id,
        before: {
          amountIdr: existing.amountIdr,
          type: existing.type,
          occurredOn: existing.occurredOn,
          note: existing.note,
        },
        after: { approvalId: approval.id },
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      this.notifier.notifyApprovalRequested(
        existing.workspaceId,
        existing.createdBy,
        "DELETE",
        existing,
      );

      return {
        pendingApproval: true,
        approvalId: approval.id,
        message: "Penghapusan transaksi diajukan dan menunggu persetujuan pasangan",
      };
    }

    // Bypass jika masih 1 anggota
    await this.transactions.softDelete(id);

    await this.audit.record({
      workspaceId: existing.workspaceId,
      actorId: userId,
      action: "TRANSACTION_DELETED",
      entityType: "TRANSACTION",
      entityId: id,
      before: {
        amountIdr: existing.amountIdr,
        type: existing.type,
        occurredOn: existing.occurredOn,
        note: existing.note,
      },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return {
      pendingApproval: false,
      message: "Transaksi berhasil dihapus",
    };
  }

  async listPendingApprovals(
    userId: string,
    workspaceId: string,
  ): Promise<PopulatedApproval[]> {
    await this.ensureWorkspaceMembership(workspaceId, userId);
    return await this.approvals.listPendingByWorkspace(workspaceId);
  }

  async reviewApproval(
    userId: string,
    approvalId: string,
    action: "APPROVE" | "REJECT",
    meta?: RequestMeta,
  ): Promise<{ message: string; approval: PopulatedApproval }> {
    const approval = await this.approvals.findById(approvalId);
    if (!approval) {
      throw new NotFoundError("Permintaan persetujuan tidak ditemukan");
    }

    await this.ensureWorkspaceMembership(approval.workspaceId, userId);

    // ATURAN KERAS: Pengaju DILARANG menyetujui permintaannya sendiri!
    if (approval.requesterId === userId) {
      throw new ForbiddenError(
        "Anda tidak dapat mengonfirmasi pengajuan Anda sendiri. Hanya pasangan yang dapat menyetujui atau menolak.",
      );
    }

    if (approval.status !== "PENDING") {
      throw new ConflictError("Permintaan persetujuan ini sudah pernah diproses sebelumnya");
    }

    if (action === "APPROVE") {
      if (approval.actionType === "UPDATE" && approval.payload) {
        await this.transactions.update(
          approval.transactionId,
          approval.payload as Partial<UpdateTransactionInput>,
        );

        await this.audit.record({
          workspaceId: approval.workspaceId,
          actorId: userId,
          action: "TRANSACTION_UPDATE_APPROVED",
          entityType: "TRANSACTION",
          entityId: approval.transactionId,
          before: approval.previousSnapshot,
          after: approval.payload,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
          requestId: meta?.requestId,
        });
      } else if (approval.actionType === "DELETE") {
        await this.transactions.softDelete(approval.transactionId);

        await this.audit.record({
          workspaceId: approval.workspaceId,
          actorId: userId,
          action: "TRANSACTION_DELETE_APPROVED",
          entityType: "TRANSACTION",
          entityId: approval.transactionId,
          before: approval.previousSnapshot,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
          requestId: meta?.requestId,
        });
      }

      await this.approvals.updateStatus(approvalId, "APPROVED", userId);

      this.notifier.notifyApprovalReviewed(
        approval.workspaceId,
        {
          id: userId,
          name: "Pasangan",
          email: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        approval.actionType as "UPDATE" | "DELETE",
        "APPROVED",
        approval.requesterId,
      );

      const updated = await this.approvals.findById(approvalId);
      return {
        message: `Pengajuan ${approval.actionType === "UPDATE" ? "perubahan" : "penghapusan"} transaksi telah disetujui`,
        approval: updated!,
      };
    } else {
      // REJECT -> Data transaksi tetap utuh tanpa perubahan!
      await this.approvals.updateStatus(approvalId, "REJECTED", userId);

      await this.audit.record({
        workspaceId: approval.workspaceId,
        actorId: userId,
        action: "TRANSACTION_APPROVAL_REJECTED",
        entityType: "TRANSACTION",
        entityId: approval.transactionId,
        before: approval.previousSnapshot,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });

      this.notifier.notifyApprovalReviewed(
        approval.workspaceId,
        {
          id: userId,
          name: "Pasangan",
          email: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        approval.actionType as "UPDATE" | "DELETE",
        "REJECTED",
        approval.requesterId,
      );

      const updated = await this.approvals.findById(approvalId);
      return {
        message: `Pengajuan ${approval.actionType === "UPDATE" ? "perubahan" : "penghapusan"} transaksi telah ditolak. Data kembali ke posisi semula.`,
        approval: updated!,
      };
    }
  }

  private async ensureWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota dari ruang ini");
    }
  }

  private async ensureCategoryAccessible(
    categoryId: string,
    workspaceId: string,
  ): Promise<Category> {
    const category = await this.categories.findById(categoryId);
    if (!category || category.isArchived) {
      throw new ValidationError("Kategori tidak valid atau telah diarsipkan");
    }

    if (category.workspaceId && category.workspaceId !== workspaceId) {
      throw new ForbiddenError("Kategori tidak sesuai dengan ruang ini");
    }

    return category;
  }

  private async ensureWalletValid(
    walletId: string,
    workspaceId: string,
  ): Promise<void> {
    const wallet = await this.wallets.findById(walletId);
    if (!wallet || wallet.isArchived || wallet.workspaceId !== workspaceId) {
      throw new ValidationError("Dompet tidak valid atau telah diarsipkan");
    }
  }
}

export const transactionService = new TransactionService();

