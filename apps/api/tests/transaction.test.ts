import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Transaction API Endpoints & Soft Delete", () => {
  const userEmail = `tx_user_${Date.now()}@test.com`;
  const intruderEmail = `intruder_${Date.now()}@test.com`;
  const password = "Password123!";

  let token = "";
  let intruderToken = "";
  let workspaceId = "";
  let categoryId = "";
  let walletId = "";
  let transactionId = "";

  it("Setup user, workspace, wallet, and categories", async () => {
    // 1. Register main user
    const resAuth = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Pencatat", email: userEmail, password }),
      }),
    );
    const bodyAuth = (await resAuth.json()) as { data: { token: string } };
    token = bodyAuth.data.token;

    // 2. Register intruder user (different workspace)
    const resIntruder = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Intruder", email: intruderEmail, password }),
      }),
    );
    const bodyIntruder = (await resIntruder.json()) as { data: { token: string } };
    intruderToken = bodyIntruder.data.token;

    // 3. Create workspace
    const resWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Workspace Transaksi" }),
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { id: string } };
    workspaceId = bodyWs.data.id;

    // 4. Create wallet
    const resWl = await app.handle(
      new Request("http://localhost:3000/wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          name: "Dompet Tunai",
          type: "CASH",
        }),
      }),
    );
    const bodyWl = (await resWl.json()) as { data: { id: string } };
    walletId = bodyWl.data.id;

    // 5. Get available categories
    const resCat = await app.handle(
      new Request(`http://localhost:3000/categories?workspaceId=${workspaceId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const bodyCat = (await resCat.json()) as { data: Array<{ id: string; name: string }> };
    const foodCat = bodyCat.data.find((c) => c.name === "Makan & Minum");
    categoryId = foodCat ? foodCat.id : bodyCat.data[0]!.id;

    expect(token).toBeDefined();
    expect(workspaceId).toBeDefined();
    expect(categoryId).toBeDefined();
    expect(walletId).toBeDefined();
  });

  it("POST /transactions creates expense with integer Rupiah", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          categoryId,
          walletId,
          type: "EXPENSE",
          amountIdr: 45000, // Rp 45.000
          note: "Makan siang bakso",
          occurredOn: "2026-10-12",
        }),
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      success: boolean;
      data: { id: string; amountIdr: number; note: string; category: { name: string } };
    };

    expect(body.success).toBe(true);
    expect(body.data.amountIdr).toBe(45000);
    expect(body.data.note).toBe("Makan siang bakso");
    expect(body.data.category.name).toBeDefined();
    // Security check: passwordHash MUST NOT be exposed!
    expect(
      (body.data as unknown as { createdBy?: { passwordHash?: string } }).createdBy?.passwordHash,
    ).toBeUndefined();
    transactionId = body.data.id;
  });

  it("GET /transactions filters by month and returns populated transaction", async () => {
    const res = await app.handle(
      new Request(
        `http://localhost:3000/transactions?workspaceId=${workspaceId}&month=2026-10`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ id: string; amountIdr: number; createdBy?: { passwordHash?: string } }>;
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.some((t) => t.id === transactionId)).toBe(true);
    // Security check: every transaction must NOT leak passwordHash
    for (const t of body.data) {
      expect(t.createdBy?.passwordHash).toBeUndefined();
    }
  });

  it("PATCH /transactions/:id updates transaction notes and amount", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountIdr: 50000,
          note: "Makan siang bakso + es teh",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { amountIdr: number; note: string };
    };

    expect(body.success).toBe(true);
    expect(body.data.amountIdr).toBe(50000);
    expect(body.data.note).toBe("Makan siang bakso + es teh");
  });

  it("GET /transactions isolates data (intruder cannot access other workspace transactions)", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${intruderToken}` },
      }),
    );

    expect(res.status).toBe(403);
  });

  it("DELETE /transactions/:id performs SOFT DELETE (not accessible via GET)", async () => {
    const resDelete = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect(resDelete.status).toBe(200);

    // After soft delete, querying by ID should return 404 Not Found
    const resGet = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect(resGet.status).toBe(404);

    // And it should not appear in the active transaction list
    const resList = await app.handle(
      new Request(
        `http://localhost:3000/transactions?workspaceId=${workspaceId}&month=2026-10`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    );
    const bodyList = (await resList.json()) as { data: Array<{ id: string }> };
    expect(bodyList.data.some((t) => t.id === transactionId)).toBe(false);
  });
});

