import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const telegramLinks = pgTable(
  "telegram_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    chatId: varchar("chat_id", { length: 64 }).notNull(), // Group ID or private user chat ID
    chatType: varchar("chat_type", { length: 20 }).notNull().default("PRIVATE"), // 'PRIVATE' | 'GROUP'
    chatTitle: varchar("chat_title", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    linkedAt: timestamp("linked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("telegram_links_workspace_id_idx").on(table.workspaceId),
    index("telegram_links_chat_id_idx").on(table.chatId),
    index("telegram_links_user_id_idx").on(table.userId),
  ],
);

export const linkTokens = pgTable(
  "link_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("link_tokens_token_hash_idx").on(table.tokenHash)],
);

export type TelegramLink = typeof telegramLinks.$inferSelect;
export type NewTelegramLink = typeof telegramLinks.$inferInsert;
export type LinkToken = typeof linkTokens.$inferSelect;
export type NewLinkToken = typeof linkTokens.$inferInsert;

