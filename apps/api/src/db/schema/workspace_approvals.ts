import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const workspaceApprovals = pgTable(
  "workspace_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    policyType: varchar("policy_type", { length: 30 })
      .default("DATE_POLICY")
      .notNull(),
    targetValue: varchar("target_value", { length: 30 }).notNull(),
    currentValue: varchar("current_value", { length: 30 }).notNull(),
    status: varchar("status", { length: 20 }).default("PENDING").notNull(),
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
    index("workspace_approvals_ws_status_idx").on(
      table.workspaceId,
      table.status,
    ),
    index("workspace_approvals_req_idx").on(table.requesterId),
  ],
);

export type WorkspaceApproval = typeof workspaceApprovals.$inferSelect;
export type NewWorkspaceApproval = typeof workspaceApprovals.$inferInsert;

