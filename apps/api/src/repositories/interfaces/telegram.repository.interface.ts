import type {
  TelegramLink,
  NewTelegramLink,
  LinkToken,
  NewLinkToken,
} from "../../db/schema";

export interface ITelegramRepository {
  createLink(data: NewTelegramLink): Promise<TelegramLink>;
  findLinkByChatId(chatId: string): Promise<TelegramLink | null>;
  findLinksByWorkspace(workspaceId: string): Promise<TelegramLink[]>;
  updateLinkStatus(chatId: string, isActive: boolean): Promise<void>;
  createLinkToken(data: NewLinkToken): Promise<LinkToken>;
  findValidLinkToken(tokenHash: string): Promise<LinkToken | null>;
  markTokenUsed(id: string): Promise<void>;
}

