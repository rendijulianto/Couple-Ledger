import { Elysia, t } from "elysia";
import { SetBudgetInputSchema } from "@couple-ledger/shared";
import { budgetService } from "../services/budget.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const budgetController = new Elysia({ prefix: "/budgets" })
  .use(authGuard)
  .post(
    "/",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const budget = await budgetService.setBudget(user.id, body, meta);
      return { success: true, data: budget };
    },
    {
      body: SetBudgetInputSchema,
      detail: { tags: ["Budget"], summary: "Atur budget bulanan workspace" },
    },
  )
  .get(
    "/",
    async ({ query: { workspaceId, month, categoryId }, user }) => {
      const status = await budgetService.getBudgetStatus(
        user.id,
        workspaceId,
        month,
        categoryId,
      );
      return { success: true, data: status };
    },
    {
      query: t.Object({
        workspaceId: t.String(),
        month: t.String(), // YYYY-MM
        categoryId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Budget"],
        summary: "Ambil status budget, realisasi pengeluaran & deteksi batas 80%/100%",
      },
    },
  );

