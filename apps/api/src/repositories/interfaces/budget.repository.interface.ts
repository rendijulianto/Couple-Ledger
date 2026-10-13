import type { Budget, NewBudget, Category } from "../../db/schema";

export type PopulatedBudget = Budget & {
  category: Category | null;
};

export interface IBudgetRepository {
  setBudget(budget: NewBudget): Promise<Budget>;
  findByMonth(
    workspaceId: string,
    month: string,
    categoryId?: string,
  ): Promise<Budget | null>;
  listByMonth(
    workspaceId: string,
    month: string,
  ): Promise<PopulatedBudget[]>;
}

