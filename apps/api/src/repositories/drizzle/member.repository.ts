import { eq, and, count, inArray } from "drizzle-orm";
import { db } from "../../db";
import {
  members,
  users,
  workspaces,
  type Member,
  type NewMember,
  type Workspace,
} from "../../db/schema";
import type { IMemberRepository } from "../interfaces/member.repository.interface";
import type { SafeUser } from "../interfaces/user.repository.interface";

export class DrizzleMemberRepository implements IMemberRepository {
  async addMember(member: NewMember): Promise<Member> {
    const [result] = await db.insert(members).values(member).returning();
    if (!result) {
      throw new Error("Gagal menambahkan anggota workspace");
    }
    return result;
  }

  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<Member | null> {
    const [result] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.workspaceId, workspaceId), eq(members.userId, userId)),
      )
      .limit(1);
    return result ?? null;
  }

  async countMembers(workspaceId: string): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(members)
      .where(eq(members.workspaceId, workspaceId));
    return result ? Number(result.total) : 0;
  }

  async listByWorkspace(
    workspaceId: string,
  ): Promise<Array<Member & { user: SafeUser }>> {
    const rows = await db
      .select({
        member: members,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.workspaceId, workspaceId));

    return rows.map((r) => ({
      ...r.member,
      user: r.user,
    }));
  }

  async listByWorkspaces(
    workspaceIds: string[],
  ): Promise<Array<Member & { user: SafeUser }>> {
    if (workspaceIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({
        member: members,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(inArray(members.workspaceId, workspaceIds));

    return rows.map((r) => ({
      ...r.member,
      user: r.user,
    }));
  }

  async listByUser(
    userId: string,
  ): Promise<Array<Member & { workspace: Workspace }>> {
    const rows = await db
      .select({
        member: members,
        workspace: workspaces,
      })
      .from(members)
      .innerJoin(workspaces, eq(members.workspaceId, workspaces.id))
      .where(eq(members.userId, userId));

    return rows.map((r) => ({
      ...r.member,
      workspace: r.workspace,
    }));
  }
}

export const memberRepository = new DrizzleMemberRepository();

