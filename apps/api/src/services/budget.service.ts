import type { IBudgetRepository } from "../repositories/interfaces/budget.repository.interface";
import type { ITransactionRepository } from "../repositories/interfaces/transaction.repository.interface";
import type { IMemberRepository } from "../repositories/interfaces/member.repository.interface";
import type { IAuditLogRepository } from "../repositories/interfaces/audit.repository.interface";
import { budgetRepository } from "../repositories/drizzle/budget.repository";
import { transactionRepository } from "../repositories/drizzle/transaction.repository";
import { memberRepository } from "../repositories/drizzle/member.repository";
import { auditLogRepository } from "../repositories/drizzle/audit.repository";
import { ForbiddenError } from "../domain/errors";
import type {
  SetBudgetInput,
  BudgetStatusResponse,
} from "@couple-ledger/shared";
import type { RequestMeta } from "./auth.service";

export class BudgetService {
  constructor(
    private readonly budgets: IBudgetRepository = budgetRepository,
    private readonly transactions: ITransactionRepository = transactionRepository,
    private readonly members: IMemberRepository = memberRepository,
    private readonly audit: IAuditLogRepository = auditLogRepository,
  ) {}

  async setBudget(
    userId: string,
    input: SetBudgetInput,
    meta?: RequestMeta,
  ): Promise<BudgetStatusResponse> {
    await this.ensureWorkspaceMembership(input.workspaceId, userId);

    const budget = await this.budgets.setBudget({
      workspaceId: input.workspaceId,
      categoryId: input.categoryId ?? null,
      month: input.month,
      amountIdr: input.amountIdr,
    });

    await this.audit.record({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "BUDGET_SET",
      entityType: "BUDGET",
      entityId: budget.id,
      after: {
        month: budget.month,
        amountIdr: budget.amountIdr,
        categoryId: budget.categoryId,
      },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return await this.getBudgetStatus(
      userId,
      input.workspaceId,
      input.month,
      input.categoryId,
    );
  }

  async getBudgetStatus(
    userId: string,
    workspaceId: string,
    month: string,
    categoryId?: string,
  ): Promise<BudgetStatusResponse> {
    await this.ensureWorkspaceMembership(workspaceId, userId);

    const budget = await this.budgets.findByMonth(
      workspaceId,
      month,
      categoryId,
    );
    const budgetAmountIdr = budget ? budget.amountIdr : 0;

    const spentAmountIdr = await this.transactions.sumExpensesByMonth(
      workspaceId,
      month,
      categoryId,
    );

    const remainingAmountIdr = budgetAmountIdr - spentAmountIdr;
    const percentageUsed =
      budgetAmountIdr > 0
        ? Math.round((spentAmountIdr / budgetAmountIdr) * 1000) / 10
        : 0;

    const isThreshold80 = percentageUsed >= 80 && percentageUsed < 100;
    const isThreshold100 = percentageUsed >= 100;

    return {
      workspaceId,
      month,
      budgetAmountIdr,
      spentAmountIdr,
      remainingAmountIdr,
      percentageUsed,
      isThreshold80,
      isThreshold100,
    };
  }

  private async ensureWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota dari ruang ini");
    }
  }
}

export const budgetService = new BudgetService();

