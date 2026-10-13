import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    isMuted: boolean("is_muted").notNull().default(false),
    minAmountIdr: integer("min_amount_idr").notNull().default(0),
    quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // e.g. '22:00'
    quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // e.g. '07:00'
    notifyExpense: boolean("notify_expense").notNull().default(true),
    notifyIncome: boolean("notify_income").notNull().default(true),
    notifyBudgetAlert: boolean("notify_budget_alert").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("notification_prefs_user_workspace_unique").on(
      table.userId,
      table.workspaceId,
    ),
  ],
);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    recipientChatId: varchar("recipient_chat_id", { length: 64 }).notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(), // 'TRANSACTION_CREATED' | 'BUDGET_WARNING_80' | 'BUDGET_WARNING_100'
    payload: jsonb("payload").notNull().default({}),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"), // 'PENDING' | 'SENT' | 'FAILED'
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notification_logs_workspace_id_idx").on(table.workspaceId),
    index("notification_logs_status_idx").on(table.status),
    index("notification_logs_created_at_idx").on(table.createdAt),
  ],
);

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type NewNotificationPref = typeof notificationPrefs.$inferInsert;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;

