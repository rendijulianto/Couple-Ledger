import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Health API", () => {
  it("GET /health returns 200 OK with expected status", async () => {
    const response = await app.handle(
      new Request("http://localhost:3000/health"),
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      service: string;
      version: string;
      environment: string;
    };

    expect(body.status).toBe("ok");
    expect(body.service).toBe("couple-ledger-api");
    expect(body.version).toBe("0.1.0");
  });
});

