import { Type, type Static } from "@sinclair/typebox";

export const SetBudgetInputSchema = Type.Object({
  workspaceId: Type.String(),
  categoryId: Type.Optional(Type.String()),
  month: Type.String({ pattern: "^\\d{4}-\\d{2}$" }), // YYYY-MM e.g. "2026-10"
  amountIdr: Type.Integer({ minimum: 1000 }),
});

export type SetBudgetInput = Static<typeof SetBudgetInputSchema>;

export const BudgetStatusResponseSchema = Type.Object({
  workspaceId: Type.String(),
  month: Type.String(),
  budgetAmountIdr: Type.Integer(),
  spentAmountIdr: Type.Integer(),
  remainingAmountIdr: Type.Integer(),
  percentageUsed: Type.Number(),
  isThreshold80: Type.Boolean(),
  isThreshold100: Type.Boolean(),
});

export type BudgetStatusResponse = Static<typeof BudgetStatusResponseSchema>;

