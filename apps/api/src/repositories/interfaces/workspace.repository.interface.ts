import type {
  Workspace,
  NewWorkspace,
  WorkspaceApproval,
  NewWorkspaceApproval,
} from "../../db/schema";
import type { SafeUser } from "./user.repository.interface";

export type PopulatedWorkspaceApproval = WorkspaceApproval & {
  requester: SafeUser;
  reviewer?: SafeUser | null;
};

export interface IWorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  findByInviteCode(code: string): Promise<Workspace | null>;
  create(workspace: NewWorkspace): Promise<Workspace>;
  update(id: string, data: Partial<NewWorkspace>): Promise<Workspace>;

  // Workspace approvals
  createPolicyApproval(data: NewWorkspaceApproval): Promise<WorkspaceApproval>;
  findPendingPolicyApproval(
    workspaceId: string,
    policyType?: string,
  ): Promise<PopulatedWorkspaceApproval | null>;
  listPolicyApprovalsByWorkspace(
    workspaceId: string,
  ): Promise<PopulatedWorkspaceApproval[]>;
  findPolicyApprovalById(
    id: string,
  ): Promise<PopulatedWorkspaceApproval | null>;
  updatePolicyApprovalStatus(
    id: string,
    status: "APPROVED" | "REJECTED",
    reviewerId: string,
  ): Promise<WorkspaceApproval>;
}

