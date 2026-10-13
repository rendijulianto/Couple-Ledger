import { checkDatabaseHealth } from "../db";
import { config } from "../config/env";
import type { HealthCheckResponse } from "@couple-ledger/shared";

export class HealthService {
  async getHealth(): Promise<HealthCheckResponse> {
    const isDbConnected = await checkDatabaseHealth();

    return {
      status: "ok",
      service: "couple-ledger-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      environment: config.env,
      database: {
        status: isDbConnected ? "connected" : "disconnected",
      },
    };
  }
}

export const healthService = new HealthService();

