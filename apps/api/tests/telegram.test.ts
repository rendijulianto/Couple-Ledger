import { describe, expect, it } from "bun:test";
import { app } from "../src";
import { config } from "../src/config/env";

describe("Telegram Webhook & Bot Commands", () => {
  const userEmail = `tele_user_${Date.now()}@test.com`;
  const password = "Password123!";

  let token = "";
  let workspaceId = "";
  let inviteCode = "";
  let linkToken = "";

  it("Setup user and workspace", async () => {
    // 1. Register
    const resAuth = await app.handle(
      new Request("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Rendi Tele", email: userEmail, password }),
      }),
    );
    const bodyAuth = (await resAuth.json()) as { data: { token: string } };
    token = bodyAuth.data.token;

    // 2. Create Workspace
    const resWs = await app.handle(
      new Request("http://localhost:3000/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Ruang Telegram" }),
      }),
    );
    const bodyWs = (await resWs.json()) as { data: { id: string; inviteCode: string } };
    workspaceId = bodyWs.data.id;
    inviteCode = bodyWs.data.inviteCode;

    expect(token).toBeDefined();
    expect(workspaceId).toBeDefined();
    expect(inviteCode).toBeDefined();
  });

  it("POST /telegram/link-token generates a valid one-time link token", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/telegram/link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceId }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { token: string; expiresAt: string };
    };

    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.expiresAt).toBeDefined();
    linkToken = body.data.token;
  });

  it("POST /telegram/webhook rejects request with invalid secret token header", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": "wrong_secret",
        },
        body: JSON.stringify({
          update_id: 1,
          message: {
            message_id: 1,
            chat: { id: 12345, type: "private" },
            date: Date.now(),
            text: "/start",
          },
        }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("POST /telegram/webhook handles /start <token> and links private chat", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": config.telegram.webhookSecret,
        },
        body: JSON.stringify({
          update_id: 2,
          message: {
            message_id: 2,
            chat: { id: 987654321, type: "private", first_name: "Rendi" },
            date: Date.now(),
            text: `/start ${linkToken}`,
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      result: { handled: boolean; reply: string };
    };

    expect(body.ok).toBe(true);
    expect(body.result.handled).toBe(true);
    expect(body.result.reply).toContain("Akun berhasil ditautkan");
  });

  it("POST /telegram/webhook rejects reused token", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": config.telegram.webhookSecret,
        },
        body: JSON.stringify({
          update_id: 3,
          message: {
            message_id: 3,
            chat: { id: 987654321, type: "private" },
            date: Date.now(),
            text: `/start ${linkToken}`,
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      result: { handled: boolean; reply: string };
    };

    expect(body.ok).toBe(true);
    expect(body.result.reply).toContain("tidak valid atau telah kedaluwarsa");
  });

  it("POST /telegram/webhook handles /link <kode_ruang> for group chats", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": config.telegram.webhookSecret,
        },
        body: JSON.stringify({
          update_id: 4,
          message: {
            message_id: 4,
            chat: { id: -100123456789, type: "group", title: "Grup Keuangan Berdua" },
            date: Date.now(),
            text: `/link ${inviteCode}`,
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      result: { handled: boolean; reply: string };
    };

    expect(body.ok).toBe(true);
    expect(body.result.handled).toBe(true);
    expect(body.result.reply).toContain("Ruang Telegram");
  });

  it("POST /telegram/webhook handles /status, /mute, and /unmute", async () => {
    // /status
    const resStatus = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": config.telegram.webhookSecret,
        },
        body: JSON.stringify({
          update_id: 5,
          message: {
            message_id: 5,
            chat: { id: 987654321, type: "private" },
            date: Date.now(),
            text: "/status",
          },
        }),
      }),
    );
    const bodyStatus = (await resStatus.json()) as { result: { reply: string } };
    expect(bodyStatus.result.reply).toContain("Ruang Telegram");

    // /mute
    const resMute = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": config.telegram.webhookSecret,
        },
        body: JSON.stringify({
          update_id: 6,
          message: {
            message_id: 6,
            chat: { id: 987654321, type: "private" },
            date: Date.now(),
            text: "/mute",
          },
        }),
      }),
    );
    const bodyMute = (await resMute.json()) as { result: { reply: string } };
    expect(bodyMute.result.reply).toContain("dimatikan");

    // /unmute
    const resUnmute = await app.handle(
      new Request("http://localhost:3000/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-bot-api-secret-token": config.telegram.webhookSecret,
        },
        body: JSON.stringify({
          update_id: 7,
          message: {
            message_id: 7,
            chat: { id: 987654321, type: "private" },
            date: Date.now(),
            text: "/unmute",
          },
        }),
      }),
    );
    const bodyUnmute = (await resUnmute.json()) as { result: { reply: string } };
    expect(bodyUnmute.result.reply).toContain("diaktifkan kembali");
  });
});

