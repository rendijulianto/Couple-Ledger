import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./users";
import { categories } from "./categories";
import { wallets } from "./wallets";

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdById: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id").references(() => wallets.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    type: varchar("type", { length: 20 }).notNull(), // 'EXPENSE' | 'INCOME'
    amountIdr: integer("amount_idr").notNull(), // Integer Rupiah without decimals
    note: text("note"),
    occurredOn: date("occurred_on").notNull(), // YYYY-MM-DD
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Nullable for Soft Delete
  },
  (table) => [
    index("transactions_workspace_date_idx").on(
      table.workspaceId,
      table.occurredOn,
    ),
    index("transactions_workspace_cat_date_idx").on(
      table.workspaceId,
      table.categoryId,
      table.occurredOn,
    ),
    index("transactions_created_by_idx").on(table.createdById),
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

