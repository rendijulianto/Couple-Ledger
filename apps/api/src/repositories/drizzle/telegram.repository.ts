import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../../db";
import {
  telegramLinks,
  linkTokens,
  type TelegramLink,
  type NewTelegramLink,
  type LinkToken,
  type NewLinkToken,
} from "../../db/schema";
import type { ITelegramRepository } from "../interfaces/telegram.repository.interface";

export class DrizzleTelegramRepository implements ITelegramRepository {
  async createLink(data: NewTelegramLink): Promise<TelegramLink> {
    const existing = await this.findLinkByChatId(data.chatId);
    if (existing) {
      const [updated] = await db
        .update(telegramLinks)
        .set({
          workspaceId: data.workspaceId,
          userId: data.userId,
          chatType: data.chatType,
          chatTitle: data.chatTitle,
          isActive: true,
          linkedAt: new Date(),
        })
        .where(eq(telegramLinks.id, existing.id))
        .returning();
      if (!updated) throw new Error("Gagal mengupdate telegram link");
      return updated;
    }

    const [created] = await db
      .insert(telegramLinks)
      .values(data)
      .returning();
    if (!created) throw new Error("Gagal membuat telegram link");
    return created;
  }

  async findLinkByChatId(chatId: string): Promise<TelegramLink | null> {
    const [result] = await db
      .select()
      .from(telegramLinks)
      .where(eq(telegramLinks.chatId, chatId))
      .limit(1);
    return result ?? null;
  }

  async findLinksByWorkspace(workspaceId: string): Promise<TelegramLink[]> {
    return await db
      .select()
      .from(telegramLinks)
      .where(
        and(
          eq(telegramLinks.workspaceId, workspaceId),
          eq(telegramLinks.isActive, true),
        ),
      );
  }

  async updateLinkStatus(chatId: string, isActive: boolean): Promise<void> {
    await db
      .update(telegramLinks)
      .set({ isActive })
      .where(eq(telegramLinks.chatId, chatId));
  }

  async createLinkToken(data: NewLinkToken): Promise<LinkToken> {
    const [result] = await db.insert(linkTokens).values(data).returning();
    if (!result) throw new Error("Gagal membuat link token");
    return result;
  }

  async findValidLinkToken(tokenHash: string): Promise<LinkToken | null> {
    const [result] = await db
      .select()
      .from(linkTokens)
      .where(
        and(
          eq(linkTokens.tokenHash, tokenHash),
          isNull(linkTokens.usedAt),
          gt(linkTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  async markTokenUsed(id: string): Promise<void> {
    await db
      .update(linkTokens)
      .set({ usedAt: new Date() })
      .where(eq(linkTokens.id, id));
  }
}

export const telegramRepository = new DrizzleTelegramRepository();

