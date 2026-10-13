import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Workspace API Endpoints & 2-Member Enforcement", () => {
  const user1Email = `owner_${Date.now()}@test.com`;
  const user2Email = `partner_${Date.now()}@test.com`;
  const user3Email = `third_${Date.now()}@test.com`;
  const password = "Password123!";

  let token1 = "";
  let token2 = "";
  let token3 = "";
  let inviteCode = "";
  let createdWorkspaceId = "";

  it("Registers 3 test users", async () => {
    // Register User 1
    const res1 = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User 1", email: user1Email, password }),
      }),
    );
    const body1 = (await res1.json()) as { data: { token: string } };
    token1 = body1.data.token;

    // Register User 2
    const res2 = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User 2", email: user2Email, password }),
      }),
    );
    const body2 = (await res2.json()) as { data: { token: string } };
    token2 = body2.data.token;

    // Register User 3
    const res3 = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User 3", email: user3Email, password }),
      }),
    );
    const body3 = (await res3.json()) as { data: { token: string } };
    token3 = body3.data.token;

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token3).toBeDefined();
  });

  it("POST /workspaces creates workspace with OWNER role", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token1}`,
        },
        body: JSON.stringify({ name: "Dompet Berdua" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { id: string; name: string; inviteCode: string; role: string; members: Array<{ role: string }> };
    };

    expect(body.success).toBe(true);
    createdWorkspaceId = body.data.id;
    inviteCode = body.data.inviteCode;
    expect(body.data.name).toBe("Dompet Berdua");
    expect(body.data.role).toBe("OWNER");
    expect(body.data.members.length).toBe(1);
    expect(body.data.inviteCode).toBeDefined();

    inviteCode = body.data.inviteCode;
  });

  it("POST /workspaces/join allows second member (partner) to join", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/workspaces/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token2}`,
        },
        body: JSON.stringify({ inviteCode }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { role: string; members: Array<{ role: string }> };
    };

    expect(body.success).toBe(true);
    expect(body.data.role).toBe("MEMBER");
    expect(body.data.members.length).toBe(2);
  });

  it("POST /workspaces/join REJECTS third member (Strict rule max 2 members)", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/workspaces/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token3}`,
        },
        body: JSON.stringify({ inviteCode }),
      }),
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };

    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.message).toContain("maksimal 2 anggota");
  });

  it("GET /workspaces returns user workspaces list", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ name: string; members: Array<{ name: string }> }>;
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0]?.members.length).toBe(2);
  });

  it("GET /workspaces/:id/audit-logs returns workspace audit trail", async () => {
    const res = await app.handle(
      new Request(`http://localhost:3000/workspaces/${createdWorkspaceId}/audit-logs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: Array<{ action: string; workspaceId: string }>;
    };

    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.some((l) => l.action === "WORKSPACE_CREATED")).toBe(true);
  });
});

