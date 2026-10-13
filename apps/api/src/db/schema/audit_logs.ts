import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(), // 'TRANSACTION_CREATED', 'TRANSACTION_UPDATED', etc.
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'TRANSACTION', 'CATEGORY', etc.
    entityId: uuid("entity_id").notNull(),
    before: jsonb("before"), // JSON snapshot before change
    after: jsonb("after"), // JSON snapshot after change
    requestId: varchar("request_id", { length: 64 }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_workspace_created_at_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("audit_logs_actor_id_idx").on(table.actorId),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

