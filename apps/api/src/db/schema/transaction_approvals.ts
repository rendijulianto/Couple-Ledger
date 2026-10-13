import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { transactions } from "./transactions";

export const transactionApprovals = pgTable(
  "transaction_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionType: varchar("action_type", { length: 20 }).notNull(), // 'UPDATE' | 'DELETE'
    payload: jsonb("payload"), // Partial<NewTransaction> (for update)
    previousSnapshot: jsonb("previous_snapshot").notNull(), // Snapshot of transaction before request
    status: varchar("status", { length: 20 }).default("PENDING").notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED'
    reviewerId: uuid("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("approvals_workspace_status_idx").on(
      table.workspaceId,
      table.status,
    ),
    index("approvals_tx_idx").on(table.transactionId),
    index("approvals_requester_idx").on(table.requesterId),
  ],
);

export type TransactionApproval = typeof transactionApprovals.$inferSelect;
export type NewTransactionApproval = typeof transactionApprovals.$inferInsert;

