import {
  eq,
  and,
  isNull,
  gte,
  lte,
  desc,
  sql,
} from "drizzle-orm";
import { db } from "../../db";
import {
  transactions,
  categories,
  wallets,
  users,
  type Transaction,
  type NewTransaction,
} from "../../db/schema";
import type {
  ITransactionRepository,
  PopulatedTransaction,
} from "../interfaces/transaction.repository.interface";
import { type TransactionFilter, getMonthDateRange } from "@couple-ledger/shared";

export class DrizzleTransactionRepository implements ITransactionRepository {
  async create(transaction: NewTransaction): Promise<Transaction> {
    const [result] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    if (!result) {
      throw new Error("Gagal menyimpan transaksi");
    }
    return result;
  }

  async findById(id: string): Promise<PopulatedTransaction | null> {
    const rows = await db
      .select({
        transaction: transactions,
        category: categories,
        wallet: wallets,
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .innerJoin(users, eq(transactions.createdById, users.id))
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row.transaction,
      category: row.category,
      wallet: row.wallet,
      createdBy: row.createdBy,
    };
  }

  async list(filter: TransactionFilter): Promise<PopulatedTransaction[]> {
    const conditions = [
      eq(transactions.workspaceId, filter.workspaceId),
      isNull(transactions.deletedAt), // Selalu kecualikan transaksi yang di-soft-delete!
    ];

    if (filter.month) {
      // Filter YYYY-MM optimized for B-Tree index scan (no text cast)
      const { startDate, endDate } = getMonthDateRange(filter.month);
      conditions.push(gte(transactions.occurredOn, startDate));
      conditions.push(lte(transactions.occurredOn, endDate));
    }

    if (filter.startDate) {
      conditions.push(gte(transactions.occurredOn, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(transactions.occurredOn, filter.endDate));
    }

    if (filter.categoryId) {
      conditions.push(eq(transactions.categoryId, filter.categoryId));
    }

    if (filter.walletId) {
      conditions.push(eq(transactions.walletId, filter.walletId));
    }

    if (filter.createdById) {
      conditions.push(eq(transactions.createdById, filter.createdById));
    }

    if (filter.type) {
      conditions.push(eq(transactions.type, filter.type));
    }

    const rows = await db
      .select({
        transaction: transactions,
        category: categories,
        wallet: wallets,
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .innerJoin(users, eq(transactions.createdById, users.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
      .limit(filter.limit ?? 20)
      .offset(filter.offset ?? 0);

    return rows.map((r) => ({
      ...r.transaction,
      category: r.category,
      wallet: r.wallet,
      createdBy: r.createdBy,
    }));
  }

  async update(
    id: string,
    data: Partial<NewTransaction>,
  ): Promise<Transaction> {
    const [result] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .returning();

    if (!result) {
      throw new Error("Gagal memperbarui transaksi atau transaksi tidak ditemukan");
    }
    return result;
  }

  async softDelete(id: string): Promise<void> {
    // ATURAN KERAS BAGIAN 13 & A7: Data bisnis TIDAK PERNAH di-hard-delete!
    await db
      .update(transactions)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(transactions.id, id));
  }

  async sumExpensesByMonth(
    workspaceId: string,
    month: string,
    categoryId?: string,
  ): Promise<number> {
    const { startDate, endDate } = getMonthDateRange(month);
    const conditions = [
      eq(transactions.workspaceId, workspaceId),
      eq(transactions.type, "EXPENSE"),
      isNull(transactions.deletedAt),
      gte(transactions.occurredOn, startDate),
      lte(transactions.occurredOn, endDate),
    ];

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amountIdr}), 0)` })
      .from(transactions)
      .where(and(...conditions));

    return result ? Number(result.total) : 0;
  }
}

export const transactionRepository = new DrizzleTransactionRepository();

