import { Type, type Static } from "@sinclair/typebox";

export const CreateWalletInputSchema = Type.Object({
  workspaceId: Type.String(),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  type: Type.Union([
    Type.Literal("CASH"),
    Type.Literal("BANK"),
    Type.Literal("EWALLET"),
  ]),
});

export type CreateWalletInput = Static<typeof CreateWalletInputSchema>;

export const UpdateWalletInputSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2, maxLength: 50 })),
  type: Type.Optional(
    Type.Union([
      Type.Literal("CASH"),
      Type.Literal("BANK"),
      Type.Literal("EWALLET"),
    ]),
  ),
});

export type UpdateWalletInput = Static<typeof UpdateWalletInputSchema>;

