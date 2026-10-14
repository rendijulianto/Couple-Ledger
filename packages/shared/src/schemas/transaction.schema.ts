import { Type, type Static } from "@sinclair/typebox";

export const CreateTransactionInputSchema = Type.Object({
  workspaceId: Type.String(),
  categoryId: Type.String(),
  subcategoryId: Type.Optional(Type.String()),
  subcategoryName: Type.Optional(Type.String({ maxLength: 100 })),
  walletId: Type.Optional(Type.String()),
  type: Type.Union([Type.Literal("EXPENSE"), Type.Literal("INCOME")]),
  amountIdr: Type.Integer({ minimum: 1 }),
  note: Type.Optional(Type.String({ maxLength: 500 })),
  occurredOn: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }), // YYYY-MM-DD
});

export type CreateTransactionInput = Static<
  typeof CreateTransactionInputSchema
>;

export const UpdateTransactionInputSchema = Type.Object({
  categoryId: Type.Optional(Type.String()),
  subcategoryId: Type.Optional(Type.String()),
  subcategoryName: Type.Optional(Type.String({ maxLength: 100 })),
  walletId: Type.Optional(Type.String()),
  type: Type.Optional(
    Type.Union([Type.Literal("EXPENSE"), Type.Literal("INCOME")]),
  ),
  amountIdr: Type.Optional(Type.Integer({ minimum: 1 })),
  note: Type.Optional(Type.String({ maxLength: 500 })),
  occurredOn: Type.Optional(
    Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
  ),
});

export type UpdateTransactionInput = Static<
  typeof UpdateTransactionInputSchema
>;

export const TransactionFilterSchema = Type.Object({
  workspaceId: Type.String(),
  month: Type.Optional(Type.String({ pattern: "^\\d{4}-\\d{2}$" })), // YYYY-MM
  startDate: Type.Optional(
    Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
  ),
  endDate: Type.Optional(Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
  categoryId: Type.Optional(Type.String()),
  walletId: Type.Optional(Type.String()),
  createdById: Type.Optional(Type.String()),
  type: Type.Optional(
    Type.Union([Type.Literal("EXPENSE"), Type.Literal("INCOME")]),
  ),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
});

export type TransactionFilter = Static<typeof TransactionFilterSchema>;

export const ReviewApprovalInputSchema = Type.Object({
  action: Type.Union([Type.Literal("APPROVE"), Type.Literal("REJECT")]),
});

export type ReviewApprovalInput = Static<typeof ReviewApprovalInputSchema>;

