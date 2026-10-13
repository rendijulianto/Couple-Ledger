import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import { sessions, type Session, type NewSession } from "../../db/schema";
import type { ISessionRepository } from "../interfaces/session.repository.interface";

export class DrizzleSessionRepository implements ISessionRepository {
  async create(session: NewSession): Promise<Session> {
    const [result] = await db.insert(sessions).values(session).returning();
    if (!result) {
      throw new Error("Gagal membuat sesi");
    }
    return result;
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const [result] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
      .limit(1);
    return result ?? null;
  }

  async revoke(id: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id));
  }

  async revokeByUser(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}

export const sessionRepository = new DrizzleSessionRepository();

