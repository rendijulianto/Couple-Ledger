import { Elysia } from "elysia";
import { authService, type RequestMeta } from "../services/auth.service";
import { UnauthorizedError } from "../domain/errors";
import type { User } from "../db/schema";

export const getRequestMeta = (request: Request): RequestMeta => {
  return {
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1",
    userAgent: request.headers.get("user-agent") || undefined,
    requestId: request.headers.get("x-request-id") || undefined,
  };
};

export const authGuard = new Elysia({ name: "auth-guard" }).derive(
  { as: "scoped" },
  async ({ cookie, headers }): Promise<{ user: User }> => {
    // 1. Check httpOnly cookie session_id
    let token = cookie.session_id?.value;

    // 2. Fallback to Authorization header Bearer <token>
    if (!token) {
      const authHeader = headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token || typeof token !== "string") {
      throw new UnauthorizedError("Silakan login terlebih dahulu");
    }

    const user = await authService.validateSession(token);
    if (!user) {
      throw new UnauthorizedError("Sesi telah berakhir atau tidak valid");
    }

    return { user };
  },
);

