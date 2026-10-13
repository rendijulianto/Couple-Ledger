import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Transaction Approval Workflow & Partner Confirmation", () => {
  const userAEmail = `user_a_${Date.now()}@test.com`;
  const userBEmail = `user_b_${Date.now()}@test.com`;
  const userSoloEmail = `user_solo_${Date.now()}@test.com`;
  const password = "Password123!";

  let tokenA = "";
  let tokenB = "";
  let tokenSolo = "";
  let workspaceId = "";
  let inviteCode = "";
  let categoryId = "";
  let transactionId = "";
  let updateApprovalId = "";
  let deleteApprovalId = "";

  it("Setup 2 users in the same workspace (Couple)", async () => {
    // 1. Register User A
    const resA = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User A", email: userAEmail, password }),
      }),
    );
    const bodyA = (await resA.json()) as { data: { token: string } };
    tokenA = bodyA.data.token;

    // 2. Register User B
    const resB = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User B", email: userBEmail, password }),
      }),
    );
    const bodyB = (await resB.json()) as { data: { token: string } };
    tokenB = bodyB.data.token;

    // 3. User A creates workspace
    const resWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ name: "Dompet Berdua" }),
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { id: string; inviteCode: string } };
    workspaceId = bodyWs.data.id;
    inviteCode = bodyWs.data.inviteCode;

    // 4. User B joins workspace via invite code
    const resJoin = await app.handle(
      new Request("http://localhost:3000/workspaces/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ inviteCode }),
      }),
    );
    expect(resJoin.status).toBe(200);

    // 5. Get Category
    const resCat = await app.handle(
      new Request(`http://localhost:3000/categories?workspaceId=${workspaceId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    );
    const bodyCat = (await resCat.json()) as { data: Array<{ id: string }> };
    categoryId = bodyCat.data[0]!.id;
  });

  it("User A creates an expense transaction of Rp 100.000", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          workspaceId,
          categoryId,
          type: "EXPENSE",
          amountIdr: 100000,
          occurredOn: "2026-10-13",
          note: "Makan Siang",
        }),
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string; amountIdr: number } };
    transactionId = body.data.id;
    expect(body.data.amountIdr).toBe(100000);
  });

  it("User A edits transaction: triggers partner approval and keeps old amount", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          amountIdr: 250000,
          note: "Makan Siang Mewah",
        }),
      }),
    );

    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      success: boolean;
      requiresApproval: boolean;
      approvalId: string;
      message: string;
    };
    expect(body.requiresApproval).toBe(true);
    expect(body.approvalId).toBeDefined();
    updateApprovalId = body.approvalId;

    // Verify original transaction is UNTOUCHED
    const resGet = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    );
    const bodyGet = (await resGet.json()) as { data: { amountIdr: number; note: string } };
    expect(bodyGet.data.amountIdr).toBe(100000);
    expect(bodyGet.data.note).toBe("Makan Siang");
  });

  it("User A cannot approve their own request (Forbidden)", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/transactions/approvals/${updateApprovalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          action: "APPROVE",
        }),
      }),
    );

    expect(res.status).toBe(403);
  });

  it("User B lists pending approvals and rejects User A's update", async () => {
    // 1. Get approvals list
    const resList = await app.handle(
      new Request(`http://localhost:3000/transactions/approvals?workspaceId=${workspaceId}&status=PENDING`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    );
    expect(resList.status).toBe(200);
    const bodyList = (await resList.json()) as { data: Array<{ id: string; actionType: string }> };
    expect(bodyList.data.length).toBe(1);
    expect(bodyList.data[0]!.id).toBe(updateApprovalId);
    expect(bodyList.data[0]!.actionType).toBe("UPDATE");

    // 2. Reject approval
    const resReview = await app.handle(
      new Request(`http://localhost:3000/transactions/approvals/${updateApprovalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          action: "REJECT",
        }),
      }),
    );
    expect(resReview.status).toBe(200);

    // 3. Verify transaction STILL retains original values
    const resGet = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    );
    const bodyGet = (await resGet.json()) as { data: { amountIdr: number; note: string } };
    expect(bodyGet.data.amountIdr).toBe(100000);
    expect(bodyGet.data.note).toBe("Makan Siang");
  });

  it("User A requests transaction deletion: requires approval and remains visible", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    );

    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      success: boolean;
      requiresApproval: boolean;
      approvalId: string;
    };
    expect(body.requiresApproval).toBe(true);
    deleteApprovalId = body.approvalId;

    // Transaction is STILL NOT deleted
    const resGet = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    );
    expect(resGet.status).toBe(200);
  });

  it("User B approves deletion: transaction is soft deleted", async () => {
    const resReview = await app.handle(
      new Request(`http://localhost:3000/transactions/approvals/${deleteApprovalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          action: "APPROVE",
        }),
      }),
    );
    expect(resReview.status).toBe(200);

    // Now transaction is soft deleted and returns 404
    const resGet = await app.handle(
      new Request(`http://localhost:3000/transactions/${transactionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    );
    expect(resGet.status).toBe(404);
  });

  it("Solo user (1 member) bypasses approval workflow directly", async () => {
    // 1. Register solo user
    const resAuth = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Solo User", email: userSoloEmail, password }),
      }),
    );
    const bodyAuth = (await resAuth.json()) as { data: { token: string } };
    tokenSolo = bodyAuth.data.token;

    // 2. Create solo workspace
    const resWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSolo}`,
        },
        body: JSON.stringify({ name: "Workspace Sendirian" }),
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { id: string } };
    const soloWsId = bodyWs.data.id;

    // 3. Create transaction
    const resTx = await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSolo}`,
        },
        body: JSON.stringify({
          workspaceId: soloWsId,
          categoryId,
          type: "EXPENSE",
          amountIdr: 50000,
          occurredOn: "2026-10-13",
          note: "Beli Bensin",
        }),
      }),
    );
    const bodyTx = (await resTx.json()) as { data: { id: string } };
    const soloTxId = bodyTx.data.id;

    // 4. Update transaction: should execute directly with 200 OK
    const resUpdate = await app.handle(
      new Request(`http://localhost:3000/transactions/${soloTxId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSolo}`,
        },
        body: JSON.stringify({
          amountIdr: 75000,
        }),
      }),
    );
    expect(resUpdate.status).toBe(200);
    const bodyUpdate = (await resUpdate.json()) as {
      data: { amountIdr: number };
      requiresApproval?: boolean;
    };
    expect(bodyUpdate.data.amountIdr).toBe(75000);
    expect(bodyUpdate.requiresApproval).toBeUndefined();
  });
});
