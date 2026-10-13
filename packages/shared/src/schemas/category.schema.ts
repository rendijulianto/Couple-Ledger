import { Type, type Static } from "@sinclair/typebox";

export const CreateCategoryInputSchema = Type.Object({
  workspaceId: Type.String(),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  type: Type.Union([Type.Literal("EXPENSE"), Type.Literal("INCOME")]),
  icon: Type.Optional(Type.String({ maxLength: 50, default: "circle" })),
  color: Type.Optional(Type.String({ maxLength: 20, default: "#222222" })),
});

export type CreateCategoryInput = Static<typeof CreateCategoryInputSchema>;

