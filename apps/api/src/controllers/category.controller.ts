import { Elysia, t } from "elysia";
import { CreateCategoryInputSchema } from "@couple-ledger/shared";
import { categoryService } from "../services/category.service";
import { authGuard, getRequestMeta } from "../middlewares/auth.middleware";

export const categoryController = new Elysia({ prefix: "/categories" })
  .use(authGuard)
  .post(
    "/",
    async ({ body, user, request }) => {
      const meta = getRequestMeta(request);
      const category = await categoryService.createCategory(
        user.id,
        body,
        meta,
      );
      return { success: true, data: category };
    },
    {
      body: CreateCategoryInputSchema,
      detail: { tags: ["Category"], summary: "Buat kategori baru di workspace" },
    },
  )
  .get(
    "/",
    async ({ query: { workspaceId }, user }) => {
      const categories = await categoryService.listCategories(
        user.id,
        workspaceId,
      );
      return { success: true, data: categories };
    },
    {
      query: t.Object({ workspaceId: t.String() }),
      detail: {
        tags: ["Category"],
        summary: "Daftar kategori bawaan + kustom untuk workspace",
      },
    },
  )
  .patch(
    "/:id/archive",
    async ({ params: { id }, user, request }) => {
      const meta = getRequestMeta(request);
      await categoryService.archiveCategory(user.id, id, meta);
      return { success: true, message: "Kategori berhasil diarsipkan" };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ["Category"], summary: "Arsipkan kategori kustom" },
    },
  );

