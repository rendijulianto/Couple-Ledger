import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  budgets,
  categories,
  type Budget,
  type NewBudget,
} from "../../db/schema";
import type {
  IBudgetRepository,
  PopulatedBudget,
} from "../interfaces/budget.repository.interface";

export class DrizzleBudgetRepository implements IBudgetRepository {
  async setBudget(budget: NewBudget): Promise<Budget> {
    const existing = await this.findByMonth(
      budget.workspaceId,
      budget.month,
      budget.categoryId ?? undefined,
    );

    if (existing) {
      const [updated] = await db
        .update(budgets)
        .set({
          amountIdr: budget.amountIdr,
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, existing.id))
        .returning();

      if (!updated) throw new Error("Gagal memperbarui budget");
      return updated;
    }

    const [created] = await db.insert(budgets).values(budget).returning();
    if (!created) throw new Error("Gagal membuat budget");
    return created;
  }

  async findByMonth(
    workspaceId: string,
    month: string,
    categoryId?: string,
  ): Promise<Budget | null> {
    const conditions = [
      eq(budgets.workspaceId, workspaceId),
      eq(budgets.month, month),
    ];

    if (categoryId) {
      conditions.push(eq(budgets.categoryId, categoryId));
    } else {
      conditions.push(isNull(budgets.categoryId));
    }

    const [result] = await db
      .select()
      .from(budgets)
      .where(and(...conditions))
      .limit(1);

    return result ?? null;
  }

  async listByMonth(
    workspaceId: string,
    month: string,
  ): Promise<PopulatedBudget[]> {
    const rows = await db
      .select({
        budget: budgets,
        category: categories,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(and(eq(budgets.workspaceId, workspaceId), eq(budgets.month, month)));

    return rows.map((r) => ({
      ...r.budget,
      category: r.category,
    }));
  }
}

export const budgetRepository = new DrizzleBudgetRepository();

