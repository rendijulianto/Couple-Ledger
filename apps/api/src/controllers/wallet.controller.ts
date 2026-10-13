import { Elysia, t } from "elysia";
import {
  CreateWalletInputSchema,
  UpdateWalletInputSchema,
} from "@couple-ledger/shared";
import { walletService } from "../services/wallet.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const walletController = new Elysia({ prefix: "/wallets" })
  .use(authGuard)
  .post(
    "/",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const wallet = await walletService.createWallet(user.id, body, meta);
      return { success: true, data: wallet };
    },
    {
      body: CreateWalletInputSchema,
      detail: { tags: ["Wallet"], summary: "Buat dompet baru di workspace" },
    },
  )
  .get(
    "/",
    async ({ query: { workspaceId }, user }) => {
      const wallets = await walletService.listWallets(user.id, workspaceId);
      return { success: true, data: wallets };
    },
    {
      query: t.Object({ workspaceId: t.String() }),
      detail: { tags: ["Wallet"], summary: "Daftar dompet aktif di workspace" },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, request }) => {
      const meta = getRequestMeta(request);
      const updated = await walletService.updateWallet(
        user.id,
        id,
        body,
        meta,
      );
      return { success: true, data: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateWalletInputSchema,
      detail: { tags: ["Wallet"], summary: "Update dompet" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, request }) => {
      const meta = getRequestMeta(request);
      await walletService.archiveWallet(user.id, id, meta);
      return { success: true, message: "Dompet berhasil diarsipkan" };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Wallet"], summary: "Arsipkan dompet" },
    },
  );

