export * from "./auth.schema";
export * from "./workspace.schema";
export * from "./transaction.schema";
export * from "./wallet.schema";
export * from "./category.schema";
export * from "./budget.schema";
import { Type, type Static } from "@sinclair/typebox";

export const HealthCheckResponseSchema = Type.Object({
  status: Type.Union([Type.Literal("ok"), Type.Literal("error")]),
  service: Type.String(),
  version: Type.String(),
  timestamp: Type.String(),
  environment: Type.String(),
  database: Type.Optional(
    Type.Object({
      status: Type.Union([Type.Literal("connected"), Type.Literal("disconnected")]),
    }),
  ),
});

export type HealthCheckResponseDto = Static<typeof HealthCheckResponseSchema>;
