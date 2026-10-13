import { relations } from "drizzle-orm";
import { users } from "./users";
import { sessions } from "./sessions";
import { workspaces } from "./workspaces";
import { members } from "./members";
import { wallets } from "./wallets";
import { categories } from "./categories";
import { transactions } from "./transactions";
import { budgets } from "./budgets";
import { telegramLinks, linkTokens } from "./telegram";
import { notificationPrefs, notificationLogs } from "./notifications";
import { auditLogs } from "./audit_logs";
import { transactionApprovals } from "./transaction_approvals";
import { workspaceApprovals } from "./workspace_approvals";

export * from "./users";
export * from "./sessions";
export * from "./workspaces";
export * from "./members";
export * from "./wallets";
export * from "./categories";
export * from "./transactions";
export * from "./budgets";
export * from "./telegram";
export * from "./notifications";
export * from "./audit_logs";
export * from "./transaction_approvals";
export * from "./workspace_approvals";

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  memberships: many(members),
  transactions: many(transactions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(members),
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  telegramLinks: many(telegramLinks),
}));

export const membersRelations = relations(members, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [members.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [wallets.workspaceId],
    references: [workspaces.id],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [categories.workspaceId],
    references: [workspaces.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [transactions.workspaceId],
    references: [workspaces.id],
  }),
  createdBy: one(users, {
    fields: [transactions.createdById],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [budgets.workspaceId],
    references: [workspaces.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const telegramLinksRelations = relations(telegramLinks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [telegramLinks.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [telegramLinks.userId],
    references: [users.id],
  }),
}));

export const notificationPrefsRelations = relations(
  notificationPrefs,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPrefs.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [notificationPrefs.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

export const linkTokensRelations = relations(linkTokens, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [linkTokens.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [linkTokens.userId],
    references: [users.id],
  }),
}));

export const notificationLogsRelations = relations(
  notificationLogs,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [notificationLogs.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [auditLogs.workspaceId],
    references: [workspaces.id],
  }),
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export const transactionApprovalsRelations = relations(
  transactionApprovals,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [transactionApprovals.workspaceId],
      references: [workspaces.id],
    }),
    transaction: one(transactions, {
      fields: [transactionApprovals.transactionId],
      references: [transactions.id],
    }),
    requester: one(users, {
      fields: [transactionApprovals.requesterId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [transactionApprovals.reviewerId],
      references: [users.id],
    }),
  }),
);

export const workspaceApprovalsRelations = relations(
  workspaceApprovals,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceApprovals.workspaceId],
      references: [workspaces.id],
    }),
    requester: one(users, {
      fields: [workspaceApprovals.requesterId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [workspaceApprovals.reviewerId],
      references: [users.id],
    }),
  }),
);
