import { Elysia } from "elysia";
import { HealthCheckResponseSchema } from "@couple-ledger/shared";
import { healthService } from "../services/health.service";

export const healthController = new Elysia({ prefix: "/health" }).get(
  "/",
  async () => {
    return await healthService.getHealth();
  },
  {
    response: HealthCheckResponseSchema,
    detail: {
      tags: ["System"],
      summary: "System and database health check",
    },
  },
);

