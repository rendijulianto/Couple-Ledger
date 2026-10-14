import { Elysia, t } from "elysia";
import {
  CreateWorkspaceInputSchema,
  JoinWorkspaceInputSchema,
  UpdateWorkspaceDatePolicyInputSchema,
  UpdateWorkspaceThemeInputSchema,
  ReviewPolicyApprovalInputSchema,
} from "@couple-ledger/shared";
import { workspaceService } from "../services/workspace.service";
import { realtimeService } from "../services/realtime.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const workspaceController = new Elysia({ prefix: "/workspaces" })
  .use(authGuard)
  .post(
    "/",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const workspace = await workspaceService.createWorkspace(
        user.id,
        body,
        meta,
      );

      return {
        success: true,
        data: {
          id: workspace.id,
          name: workspace.name,
          inviteCode: workspace.inviteCode,
          datePolicy: workspace.datePolicy,
          theme: workspace.theme,
          role: workspace.role,
          createdAt: workspace.createdAt.toISOString(),
          members: workspace.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        },
      };
    },
    {
      body: CreateWorkspaceInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Buat ruang / workspace keuangan baru",
      },
    },
  )
  .post(
    "/join",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const workspace = await workspaceService.joinWorkspace(
        user.id,
        body,
        meta,
      );

      return {
        success: true,
        data: {
          id: workspace.id,
          name: workspace.name,
          inviteCode: workspace.inviteCode,
          datePolicy: workspace.datePolicy,
          theme: workspace.theme,
          role: workspace.role,
          createdAt: workspace.createdAt.toISOString(),
          members: workspace.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        },
      };
    },
    {
      body: JoinWorkspaceInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Gabung ke ruang bersama menggunakan kode undangan",
      },
    },
  )
  .get(
    "/",
    async ({ user }) => {
      const workspaces = await workspaceService.getUserWorkspaces(user.id);

      return {
        success: true,
        data: workspaces.map((w) => ({
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
      };
    },
    {
      detail: {
        tags: ["Workspace"],
        summary: "Ambil daftar semua workspace milik pengguna",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, user }) => {
      const workspace = await workspaceService.getWorkspaceDetails(id, user.id);

      return {
        success: true,
        data: {
          id: workspace.id,
          name: workspace.name,
          inviteCode: workspace.inviteCode,
          datePolicy: workspace.datePolicy,
          theme: workspace.theme,
          role: workspace.role,
          createdAt: workspace.createdAt.toISOString(),
          members: workspace.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          })),
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Workspace"],
        summary: "Ambil detail ruang bersama beserta anggotanya",
      },
    },
  )
  .patch(
    "/:id/date-policy",
    async ({ params: { id }, body, user, request, set }) => {
      const meta = getRequestMeta(request);
      const result = await workspaceService.updateDatePolicy(
        user.id,
        id,
        body.datePolicy as "STRICT_TODAY" | "FLEXIBLE",
        meta,
      );

      if (result.pendingApproval) {
        set.status = 202;
        return {
          success: true,
          requiresApproval: true,
          pendingApproval: true,
          approvalId: result.approvalId,
          message: result.message,
        };
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateWorkspaceDatePolicyInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Update kebijakan tanggal pencatatan transaksi di ruang (butuh persetujuan jika ada 2 anggota)",
      },
    },
  )
  .patch(
    "/:id/theme",
    async ({ params: { id }, body, user, request }) => {
      const meta = getRequestMeta(request);
      const updated = await workspaceService.updateTheme(
        user.id,
        id,
        body.theme,
        meta,
      );

      return {
        success: true,
        message: "Tema ruang berhasil diperbarui",
        data: {
          id: updated.id,
          theme: updated.theme,
        },
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateWorkspaceThemeInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Update tema warna visual ruang catatan berdua",
      },
    },
  )
  .get(
    "/:id/policy-approvals",
    async ({ params: { id }, user }) => {
      const approvals = await workspaceService.listPendingPolicyApprovals(
        user.id,
        id,
      );

      return {
        success: true,
        data: approvals.map((a) => ({
          id: a.id,
          workspaceId: a.workspaceId,
          requesterId: a.requesterId,
          requesterName: a.requester.name,
          policyType: a.policyType,
          targetValue: a.targetValue,
          currentValue: a.currentValue,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Workspace"],
        summary: "Daftar pengajuan persetujuan kebijakan di workspace yang pending",
      },
    },
  )
  .post(
    "/policy-approvals/:id/review",
    async ({ params: { id }, body, user, request }) => {
      const meta = getRequestMeta(request);
      const result = await workspaceService.reviewPolicyApproval(
        user.id,
        id,
        body.action,
        meta,
      );

      return {
        success: true,
        message: result.message,
        data: result.approval,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: ReviewPolicyApprovalInputSchema,
      detail: {
        tags: ["Workspace"],
        summary: "Setujui atau tolak pengajuan perubahan kebijakan ruang oleh pasangan",
      },
    },
  )
  .get(
    "/:id/audit-logs",
    async ({ params: { id }, user }) => {
      const logs = await workspaceService.getAuditLogs(id, user.id);
      return { success: true, data: logs };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Workspace"],
        summary: "Ambil jejak audit log di workspace",
      },
    },
  )
  .get(
    "/:id/events",
    async ({ params: { id }, user }) => {
      // 1. Validasi keanggotaan pengguna di ruang
      await workspaceService.ensureMembership(id, user.id);

      let unsubscribe: (() => void) | null = null;
      let pingInterval: ReturnType<typeof setInterval> | null = null;

      const stream = new ReadableStream({
        start(controller) {
          // Kirim initial connection comment
          controller.enqueue(new TextEncoder().encode(": connected\n\n"));

          // Langganan event realtime untuk ruang ini
          unsubscribe = realtimeService.subscribe(id, (event) => {
            try {
              const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(new TextEncoder().encode(payload));
            } catch {
              // Jika stream sudah ditutup oleh client
            }
          });

          // Heartbeat ping setiap 25 detik agar koneksi tetap hidup (anti-timeout proxy)
          pingInterval = setInterval(() => {
            try {
              controller.enqueue(new TextEncoder().encode(": ping\n\n"));
            } catch {
              if (pingInterval) clearInterval(pingInterval);
            }
          }, 25000);
        },
        cancel() {
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
          if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["Workspace"],
        summary: "Server-Sent Events (SSE) stream untuk update real-time workspace",
      },
    },
  );
