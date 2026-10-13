import { describe, expect, it } from "bun:test";
import { app } from "../src";
import { formatJakartaDateISO } from "@couple-ledger/shared";

describe("Workspace Date Policy & Partner Confirmation Workflow", () => {
  const timestamp = Date.now();
  const userAEmail = `pol_a_${timestamp}@test.com`;
  const userBEmail = `pol_b_${timestamp}@test.com`;
  const userSoloEmail = `pol_solo_${timestamp}@test.com`;
  const password = "Password123!";

  let tokenA = "";
  let tokenB = "";
  let tokenSolo = "";
  let coupleWsId = "";
  let soloWsId = "";
  let approvalId = "";
  let categoryId = "";

  it("Setup users and workspaces", async () => {
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

    // 3. User A creates couple workspace
    const resWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ name: "Ruang Cinta" }),
      }),
    );
    const bodyWs = (await resWs.json()) as {
      data: { id: string; inviteCode: string; datePolicy: string };
    };
    coupleWsId = bodyWs.data.id;
    // Default harus STRICT_TODAY
    expect(bodyWs.data.datePolicy).toBe("STRICT_TODAY");

    // 4. User B joins couple workspace
    await app.handle(
      new Request("http://localhost:3000/workspaces/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ inviteCode: bodyWs.data.inviteCode }),
      }),
    );

    // 5. Register Solo User & create solo workspace
    const resSolo = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Solo User", email: userSoloEmail, password }),
      }),
    );
    const bodySolo = (await resSolo.json()) as { data: { token: string } };
    tokenSolo = bodySolo.data.token;

    const resSoloWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSolo}`,
        },
        body: JSON.stringify({ name: "Ruang Sendiri" }),
      }),
    );
    const bodySoloWs = (await resSoloWs.json()) as { data: { id: string } };
    soloWsId = bodySoloWs.data.id;

    // Get a category from coupleWsId
    const resCat = await app.handle(
      new Request(`http://localhost:3000/categories?workspaceId=${coupleWsId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    );
    const bodyCat = (await resCat.json()) as { data: Array<{ id: string }> };
    categoryId = bodyCat.data[0]!.id;
  });

  it("Solo user can immediately change datePolicy to FLEXIBLE without approval", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/workspaces/${soloWsId}/date-policy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSolo}`,
        },
        body: JSON.stringify({ datePolicy: "FLEXIBLE" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { datePolicy: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.datePolicy).toBe("FLEXIBLE");
  });

  it("Couple workspace: User A requests datePolicy change to FLEXIBLE triggers partner approval", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/workspaces/${coupleWsId}/date-policy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ datePolicy: "FLEXIBLE" }),
      }),
    );

    // Status 202 Accepted (Pending Partner Approval)
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      success: boolean;
      requiresApproval: boolean;
      approvalId: string;
    };
    expect(body.success).toBe(true);
    expect(body.requiresApproval).toBe(true);
    expect(body.approvalId).toBeDefined();
    approvalId = body.approvalId;

    // Workspace policy should still be STRICT_TODAY
    const resWs = await app.handle(
      new Request(`http://localhost:3000/workspaces/${coupleWsId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { datePolicy: string } };
    expect(bodyWs.data.datePolicy).toBe("STRICT_TODAY");
  });

  it("User A cannot review their own request (Forbidden)", async () => {
    const res = await app.handle(
      new Request(
        `http://localhost:3000/workspaces/policy-approvals/${approvalId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({ action: "APPROVE" }),
        },
      ),
    );

    expect(res.status).toBe(403);
  });

  it("User B lists pending policy approvals and approves the request", async () => {
    const resList = await app.handle(
      new Request(
        `http://localhost:3000/workspaces/${coupleWsId}/policy-approvals`,
        {
          headers: { Authorization: `Bearer ${tokenB}` },
        },
      ),
    );
    expect(resList.status).toBe(200);
    const bodyList = (await resList.json()) as {
      data: Array<{ id: string; targetValue: string; status: string }>;
    };
    expect(bodyList.data.length).toBe(1);
    expect(bodyList.data[0]!.id).toBe(approvalId);
    expect(bodyList.data[0]!.targetValue).toBe("FLEXIBLE");
    expect(bodyList.data[0]!.status).toBe("PENDING");

    // User B approves
    const resReview = await app.handle(
      new Request(
        `http://localhost:3000/workspaces/policy-approvals/${approvalId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenB}`,
          },
          body: JSON.stringify({ action: "APPROVE" }),
        },
      ),
    );
    expect(resReview.status).toBe(200);

    // Verify workspace policy is now FLEXIBLE
    const resWs = await app.handle(
      new Request(`http://localhost:3000/workspaces/${coupleWsId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { datePolicy: string } };
    expect(bodyWs.data.datePolicy).toBe("FLEXIBLE");
  });

  it("Under FLEXIBLE policy, custom past date is preserved on transaction creation", async () => {
    const customPastDate = "2026-01-15";
    const res = await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          workspaceId: coupleWsId,
          categoryId,
          type: "EXPENSE",
          amountIdr: 45000,
          occurredOn: customPastDate,
          note: "Bayar makan lampau",
        }),
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { occurredOn: string } };
    expect(body.data.occurredOn).toBe(customPastDate);
  });

  it("When switched back to STRICT_TODAY, transaction creation enforces today's date", async () => {
    // 1. User B requests switch to STRICT_TODAY
    const resSwitch = await app.handle(
      new Request(`http://localhost:3000/workspaces/${coupleWsId}/date-policy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ datePolicy: "STRICT_TODAY" }),
      }),
    );
    const bodySwitch = (await resSwitch.json()) as { approvalId: string };

    // 2. User A approves
    await app.handle(
      new Request(
        `http://localhost:3000/workspaces/policy-approvals/${bodySwitch.approvalId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenA}`,
          },
          body: JSON.stringify({ action: "APPROVE" }),
        },
      ),
    );

    // 3. User A attempts to create transaction with past date "2025-12-01"
    const todayJakarta = formatJakartaDateISO(new Date());
    const resTx = await app.handle(
      new Request("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          workspaceId: coupleWsId,
          categoryId,
          type: "EXPENSE",
          amountIdr: 25000,
          occurredOn: "2025-12-01",
          note: "Coba tanggal mundur",
        }),
      }),
    );

    expect(resTx.status).toBe(201);
    const bodyTx = (await resTx.json()) as { data: { occurredOn: string } };
    // HARUS di-force menjadi hari ini (Jakarta) karena kebijakan STRICT_TODAY aktif!
    expect(bodyTx.data.occurredOn).toBe(todayJakarta);
  });
});
