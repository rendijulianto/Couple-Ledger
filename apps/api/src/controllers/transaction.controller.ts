import { Elysia, t } from "elysia";
import {
  CreateTransactionInputSchema,
  UpdateTransactionInputSchema,
  ReviewApprovalInputSchema,
} from "@couple-ledger/shared";
import { transactionService } from "../services/transaction.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const transactionController = new Elysia({ prefix: "/transactions" })
  .use(authGuard)
  .post(
    "/",
    async ({ body, user, request, set }) => {
      const meta = getRequestMeta(request);
      const transaction = await transactionService.createTransaction(
        user.id,
        body,
        meta,
      );
      set.status = 201;
      return { success: true, data: transaction };
    },
    {
      body: CreateTransactionInputSchema,
      detail: {
        tags: ["Transaction"],
        summary: "Buat transaksi baru di workspace",
      },
    },
  )
  .get(
    "/",
    async ({ query, user }) => {
      const transactions = await transactionService.listTransactions(user.id, {
        workspaceId: query.workspaceId,
        month: query.month,
        startDate: query.startDate,
        endDate: query.endDate,
        categoryId: query.categoryId,
        walletId: query.walletId,
        createdById: query.createdById,
        type: query.type,
        limit: query.limit ? Number(query.limit) : 20,
        offset: query.offset ? Number(query.offset) : 0,
      });

      return { success: true, data: transactions };
    },
    {
      query: t.Object({
        workspaceId: t.String(),
        month: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        categoryId: t.Optional(t.String()),
        walletId: t.Optional(t.String()),
        createdById: t.Optional(t.String()),
        type: t.Optional(
          t.Union([t.Literal("EXPENSE"), t.Literal("INCOME")]),
        ),
        limit: t.Optional(t.Numeric()),
        offset: t.Optional(t.Numeric()),
      }),
      detail: {
        tags: ["Transaction"],
        summary: "Ambil daftar riwayat transaksi dengan filter & paginasi",
      },
    },
  )
  .get(
    "/summary",
    async ({ query, user }) => {
      const summary = await transactionService.getMonthlySummary(
        user.id,
        query.workspaceId,
        query.month,
      );
      return { success: true, data: summary };
    },
    {
      query: t.Object({
        workspaceId: t.String(),
        month: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
      }),
      detail: {
        tags: ["Transaction"],
        summary: "Ringkasan total pemasukan & pengeluaran bulanan (aggregasi server-side)",
      },
    },
  )
  .get(
    "/approvals",
    async ({ query, user }) => {
      const approvals = await transactionService.listPendingApprovals(
        user.id,
        query.workspaceId,
      );
      return { success: true, data: approvals };
    },
    {
      query: t.Object({
        workspaceId: t.String(),
      }),
      detail: {
        tags: ["Transaction"],
        summary: "Daftar pengajuan persetujuan transaksi yang masih pending di workspace",
      },
    },
  )
  .post(
    "/approvals/:id/review",
    async ({ params: { id }, body, user, request }) => {
      const meta = getRequestMeta(request);
      const result = await transactionService.reviewApproval(
        user.id,
        id,
        body.action,
        meta,
      );
      return { success: true, ...result };
    },
    {
      params: t.Object({ id: t.String() }),
      body: ReviewApprovalInputSchema,
      detail: {
        tags: ["Transaction"],
        summary: "Setujui atau tolak pengajuan transaksi oleh pasangan",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, user }) => {
      const transaction = await transactionService.getTransactionById(
        user.id,
        id,
      );
      return { success: true, data: transaction };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Transaction"],
        summary: "Detail satu transaksi",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, request, set }) => {
      const meta = getRequestMeta(request);
      const updated = await transactionService.updateTransaction(
        user.id,
        id,
        body,
        meta,
      );
      if (updated.approvalId) {
        set.status = 202;
        return {
          success: true,
          requiresApproval: true,
          approvalId: updated.approvalId,
          message: updated.message,
          data: updated,
        };
      }
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateTransactionInputSchema,
      detail: {
        tags: ["Transaction"],
        summary: "Update data transaksi (butuh persetujuan pasangan jika ada 2 anggota)",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, request, set }) => {
      const meta = getRequestMeta(request);
      const result = await transactionService.deleteTransaction(user.id, id, meta);
      if ("pendingApproval" in result && result.pendingApproval) {
        set.status = 202;
        return {
          success: true,
          requiresApproval: true,
          approvalId: result.approvalId,
          message: result.message,
          data: result,
        };
      }
      return {
        success: true,
        message: result.message,
        data: result,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Transaction"],
        summary: "Soft delete transaksi (butuh persetujuan pasangan jika ada 2 anggota)",
      },
    },
  );

