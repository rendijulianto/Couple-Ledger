import type { IUserRepository } from "../repositories/interfaces/user.repository.interface";
import type { ISessionRepository } from "../repositories/interfaces/session.repository.interface";
import type { IAuditLogRepository } from "../repositories/interfaces/audit.repository.interface";
import { userRepository } from "../repositories/drizzle/user.repository";
import { sessionRepository } from "../repositories/drizzle/session.repository";
import { auditLogRepository } from "../repositories/drizzle/audit.repository";
import { ConflictError, UnauthorizedError } from "../domain/errors";
import { generateToken, hashToken } from "../utils/crypto";
import type { RegisterInput, LoginInput } from "@couple-ledger/shared";
import type { User } from "../db/schema";

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository = userRepository,
    private readonly sessions: ISessionRepository = sessionRepository,
    private readonly audit: IAuditLogRepository = auditLogRepository,
  ) {}

  async register(
    input: RegisterInput,
    meta?: RequestMeta,
  ): Promise<{ user: User; sessionToken: string }> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email sudah terdaftar");
    }

    const passwordHash = await Bun.password.hash(input.password, {
      algorithm: "argon2id",
    });

    const user = await this.users.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const sessionToken = await this.createSession(user.id, meta);

    await this.audit.record({
      actorId: user.id,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
      after: { email: user.email, name: user.name },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return { user, sessionToken };
  }

  async login(
    input: LoginInput,
    meta?: RequestMeta,
  ): Promise<{ user: User; sessionToken: string }> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Email atau password tidak sesuai");
    }

    const isValid = await Bun.password.verify(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError("Email atau password tidak sesuai");
    }

    const sessionToken = await this.createSession(user.id, meta);

    await this.audit.record({
      actorId: user.id,
      action: "USER_LOGGED_IN",
      entityType: "USER",
      entityId: user.id,
      after: { email: user.email },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return { user, sessionToken };
  }

  async logout(sessionToken: string, meta?: RequestMeta): Promise<void> {
    const tokenH = hashToken(sessionToken);
    const session = await this.sessions.findByTokenHash(tokenH);
    if (session) {
      await this.sessions.revoke(session.id);

      await this.audit.record({
        actorId: session.userId,
        action: "USER_LOGGED_OUT",
        entityType: "SESSION",
        entityId: session.id,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        requestId: meta?.requestId,
      });
    }
  }

  async validateSession(sessionToken: string): Promise<User | null> {
    const tokenH = hashToken(sessionToken);
    const session = await this.sessions.findByTokenHash(tokenH);
    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.sessions.revoke(session.id);
      return null;
    }

    return await this.users.findById(session.userId);
  }

  private async createSession(
    userId: string,
    meta?: RequestMeta,
  ): Promise<string> {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessions.create({
      userId,
      tokenHash,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      expiresAt,
    });

    return rawToken;
  }
}

export const authService = new AuthService();

