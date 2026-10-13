import type { Session, NewSession } from "../../db/schema";

export interface ISessionRepository {
  create(session: NewSession): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  revoke(id: string): Promise<void>;
  revokeByUser(userId: string): Promise<void>;
}

