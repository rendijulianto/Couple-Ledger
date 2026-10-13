import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Auth API Endpoints", () => {
  const testEmail = `user_${Date.now()}@test.com`;
  const testPassword = "Password123!";
  let sessionCookie = "";

  it("POST /auth/register creates user and returns session cookie", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rendi",
          email: testEmail,
          password: testPassword,
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { user: { email: string; name: string }; token: string };
    };

    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(testEmail);
    expect(body.data.user.name).toBe("Rendi");
    expect(body.data.token).toBeDefined();

    // Check Set-Cookie header contains session_id
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("session_id=");
    if (setCookie) {
      sessionCookie = setCookie.split(";")[0] ?? "";
    }
  });

  it("POST /auth/register rejects duplicate email with 409 Conflict", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rendi Duplicate",
          email: testEmail,
          password: testPassword,
        }),
      }),
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONFLICT");
  });

  it("POST /auth/login rejects invalid password with 401 Unauthorized", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "WrongPassword123!",
        }),
      }),
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /auth/login succeeds with correct password", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { token: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  it("GET /auth/me returns authenticated user details", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/auth/me", {
        method: "GET",
        headers: {
          Cookie: sessionCookie,
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { user: { email: string } };
    };
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(testEmail);
  });

  it("POST /auth/logout revokes session and clears cookie", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/auth/logout", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
        },
      }),
    );

    expect(res.status).toBe(200);

    // After logout, accessing /auth/me should fail with 401
    const checkRes = await app.handle(
      new Request("http://localhost:3000/auth/me", {
        method: "GET",
        headers: {
          Cookie: sessionCookie,
        },
      }),
    );
    expect(checkRes.status).toBe(401);
  });
});

