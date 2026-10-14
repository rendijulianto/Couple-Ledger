import { Elysia } from "elysia";
import { RegisterInputSchema, LoginInputSchema } from "@couple-ledger/shared";
import { authService } from "../services/auth.service";
import { workspaceService } from "../services/workspace.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const authController = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, cookie, request }) => {
      const meta = getRequestMeta(request);
      const { user, sessionToken } = await authService.register(body, meta);

      cookie.session_id?.set({
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
          },
          token: sessionToken,
        },
      };
    },
    {
      body: RegisterInputSchema,
      detail: {
        tags: ["Auth"],
        summary: "Register user baru",
      },
    },
  )
  .post(
    "/login",
    async ({ body, cookie, request }) => {
      const meta = getRequestMeta(request);
      const { user, sessionToken } = await authService.login(body, meta);

      cookie.session_id?.set({
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
          },
          token: sessionToken,
        },
      };
    },
    {
      body: LoginInputSchema,
      detail: {
        tags: ["Auth"],
        summary: "Login dengan email dan password",
      },
    },
  )
  .post(
    "/logout",
    async ({ cookie, headers, request }) => {
      let token = cookie.session_id?.value;
      if (!token) {
        const authHeader = headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      if (token && typeof token === "string") {
        const meta = getRequestMeta(request);
        await authService.logout(token, meta);
      }

      cookie.session_id?.remove();

      return {
        success: true,
        message: "Berhasil logout",
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Logout dan revokasi sesi",
      },
    },
  )
  .use(authGuard)
  .get(
    "/me",
    async ({ user }) => {
      const workspaces = await workspaceService.getUserWorkspaces(user.id);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString(),
          },
          workspaces: workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            inviteCode: w.inviteCode,
            datePolicy: w.datePolicy,
            theme: w.theme,
            role: w.role,
            createdAt: w.createdAt.toISOString(),
            members: w.members.map((m) => ({
              id: m.id,
              userId: m.userId,
              name: m.user.name,
              email: m.user.email,
              role: m.role,
              joinedAt: m.joinedAt.toISOString(),
            })),
          })),
        },
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Ambil data user yang sedang login dan daftar workspace-nya",
      },
    },
  );

