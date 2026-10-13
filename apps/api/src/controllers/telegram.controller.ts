import { Elysia, t } from "elysia";
import { config } from "../config/env";
import { telegramService, type TelegramWebhookUpdate } from "../services/telegram.service";
import { telegramRepository } from "../repositories/drizzle/telegram.repository";
import { authGuard } from "../middlewares/auth.middleware";
import { UnauthorizedError } from "../domain/errors";

export const telegramController = new Elysia({ prefix: "/telegram" })
  .post(
    "/webhook",
    async ({ headers, body, set }) => {
      // Validate webhook secret token if configured
      const secretHeader = headers["x-telegram-bot-api-secret-token"];
      if (
        config.telegram.webhookSecret &&
        secretHeader !== config.telegram.webhookSecret
      ) {
        set.status = 401;
        throw new UnauthorizedError("Invalid Telegram webhook secret token");
      }

      const result = await telegramService.handleWebhookUpdate(
        body as TelegramWebhookUpdate,
      );

      return { ok: true, result };
    },
    {
      detail: {
        tags: ["Telegram"],
        summary: "Telegram Webhook receiver for bot commands",
      },
    },
  )
  .use(authGuard)
  .post(
    "/link-token",
    async ({ body, user }) => {
      const result = await telegramService.generateLinkToken(
        user.id,
        body.workspaceId,
      );
      return { success: true, data: result };
    },
    {
      body: t.Object({ workspaceId: t.String() }),
      detail: {
        tags: ["Telegram"],
        summary: "Generate one-time deep link token (valid 10 mins)",
      },
    },
  )
  .get(
    "/links",
    async ({ query: { workspaceId } }) => {
      const links = await telegramRepository.findLinksByWorkspace(workspaceId);
      return { success: true, data: links };
    },
    {
      query: t.Object({ workspaceId: t.String() }),
      detail: {
        tags: ["Telegram"],
        summary: "Daftar koneksi Telegram di workspace",
      },
    },
  );

