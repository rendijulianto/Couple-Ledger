import type {
  TransactionApproval,
  NewTransactionApproval,
} from "../../db/schema";
import type { SafeUser } from "./user.repository.interface";

export type PopulatedApproval = TransactionApproval & {
  requester: SafeUser;
  reviewer?: SafeUser | null;
};

export interface IApprovalRepository {
  create(data: NewTransactionApproval): Promise<TransactionApproval>;
  findById(id: string): Promise<PopulatedApproval | null>;
  findPendingByTransaction(
    transactionId: string,
  ): Promise<TransactionApproval | null>;
  listPendingByWorkspace(
    workspaceId: string,
  ): Promise<PopulatedApproval[]>;
  updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    reviewerId: string,
  ): Promise<TransactionApproval>;
}

