import type {
  Transaction,
  NewTransaction,
  Category,
  Wallet,
} from "../../db/schema";
import type { TransactionFilter } from "@couple-ledger/shared";
import type { SafeUser } from "./user.repository.interface";

export type PopulatedTransaction = Transaction & {
  category: Category;
  subcategory?: { id: string; name: string } | null;
  wallet: Wallet | null;
  createdBy: SafeUser;
  pendingApproval?: {
    id: string;
    actionType: "UPDATE" | "DELETE";
    requesterId: string;
    requesterName?: string;
  } | null;
};

export interface ITransactionRepository {
  create(transaction: NewTransaction): Promise<Transaction>;
  findById(id: string): Promise<PopulatedTransaction | null>;
  list(filter: TransactionFilter): Promise<PopulatedTransaction[]>;
  update(id: string, data: Partial<NewTransaction>): Promise<Transaction>;
  softDelete(id: string): Promise<void>;
  sumExpensesByMonth(
    workspaceId: string,
    month: string,
    categoryId?: string,
  ): Promise<number>;
  findRecentDuplicate(
    workspaceId: string,
    createdById: string,
    amountIdr: number,
    categoryId: string,
    occurredOn: string,
    windowSeconds?: number,
  ): Promise<PopulatedTransaction | null>;
}

