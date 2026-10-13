import type { Member, NewMember, Workspace } from "../../db/schema";
import type { SafeUser } from "./user.repository.interface";

export interface IMemberRepository {
  addMember(member: NewMember): Promise<Member>;
  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<Member | null>;
  countMembers(workspaceId: string): Promise<number>;
  listByWorkspace(
    workspaceId: string,
  ): Promise<Array<Member & { user: SafeUser }>>;
  listByWorkspaces(
    workspaceIds: string[],
  ): Promise<Array<Member & { user: SafeUser }>>;
  listByUser(
    userId: string,
  ): Promise<Array<Member & { workspace: Workspace }>>;
}

