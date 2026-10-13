import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Budget API & Threshold Detection (80% and 100%)", () => {
  const userEmail = `budget_user_${Date.now()}@test.com`;
  const password = "Password123!";

  let token = "";
  let workspaceId = "";
  let categoryId = "";

  it("Setup workspace and categories", async () => {
    // 1. Register
    const resAuth = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Pengatur Budget", email: userEmail, password }),
      }),
    );
    const bodyAuth = (await resAuth.json()) as { data: { token: string } };
    token = bodyAuth.data.token;

    // 2. Create workspace
    const resWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Ruang Budget" }),
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { id: string } };
    workspaceId = bodyWs.data.id;

    // 3. Category
    // Set workspace datePolicy to FLEXIBLE to allow testing future/custom month transactions
    await app.handle(
      new Request(`http://localhost:3000/workspaces/${workspaceId}/date-policy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ datePolicy: "FLEXIBLE" }),
      }),
    );

    const resCat = await app.handle(
      new Request(`http://localhost:3000/categories?workspaceId=${workspaceId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const bodyCat = (await resCat.json()) as { data: Array<{ id: string }> };
    categoryId = bodyCat.data[0]!.id;

    expect(token).toBeDefined();
    expect(workspaceId).toBeDefined();
  });

  it("POST /budgets sets monthly budget of Rp 1.000.000", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          month: "2026-11",
          amountIdr: 1000000, // Rp 1.000.000
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: {
        budgetAmountIdr: number;
        spentAmountIdr: number;
        percentageUsed: number;
        isThreshold80: boolean;
        isThreshold100: boolean;
      };
    };

    expect(body.success).toBe(true);
    expect(body.data.budgetAmountIdr).toBe(1000000);
    expect(body.data.spentAmountIdr).toBe(0);
    expect(body.data.percentageUsed).toBe(0);
    expect(body.data.isThreshold80).toBe(false);
    expect(body.data.isThreshold100).toBe(false);
  });

  it("Detects 80% threshold when expenses reach 85% (Rp 850.000)", async () => {
    // Add transaction of Rp 850.000
    await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          categoryId,
          type: "EXPENSE",
          amountIdr: 850000,
          occurredOn: "2026-11-05",
          note: "Belanja awal bulan",
        }),
      }),
    );

    const res = await app.handle(
      new Request(`http://localhost:3000/budgets?workspaceId=${workspaceId}&month=2026-11`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        spentAmountIdr: number;
        remainingAmountIdr: number;
        percentageUsed: number;
        isThreshold80: boolean;
        isThreshold100: boolean;
      };
    };

    expect(body.data.spentAmountIdr).toBe(850000);
    expect(body.data.remainingAmountIdr).toBe(150000);
    expect(body.data.percentageUsed).toBe(85);
    expect(body.data.isThreshold80).toBe(true);
    expect(body.data.isThreshold100).toBe(false);
  });

  it("Detects 100% threshold when expenses exceed 100% (Rp 1.050.000)", async () => {
    // Add transaction of Rp 200.000
    await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          categoryId,
          type: "EXPENSE",
          amountIdr: 200000,
          occurredOn: "2026-11-10",
          note: "Tambahan belanja",
        }),
      }),
    );

    const res = await app.handle(
      new Request(`http://localhost:3000/budgets?workspaceId=${workspaceId}&month=2026-11`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        spentAmountIdr: number;
        remainingAmountIdr: number;
        percentageUsed: number;
        isThreshold80: boolean;
        isThreshold100: boolean;
      };
    };

    expect(body.data.spentAmountIdr).toBe(1050000);
    expect(body.data.remainingAmountIdr).toBe(-50000);
    expect(body.data.percentageUsed).toBe(105);
    expect(body.data.isThreshold80).toBe(false);
    expect(body.data.isThreshold100).toBe(true);
  });
});

