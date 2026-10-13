import { eq, or, isNull, and } from "drizzle-orm";
import { db } from "../../db";
import { categories, type Category, type NewCategory } from "../../db/schema";
import type { ICategoryRepository } from "../interfaces/category.repository.interface";

export class DrizzleCategoryRepository implements ICategoryRepository {
  async create(category: NewCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    if (!result) {
      throw new Error("Gagal membuat kategori");
    }
    return result;
  }

  async findById(id: string): Promise<Category | null> {
    const [result] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return result ?? null;
  }

  async listAvailableForWorkspace(workspaceId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(
        and(
          or(isNull(categories.workspaceId), eq(categories.workspaceId, workspaceId)),
          eq(categories.isArchived, false),
        ),
      );
  }

  async archive(id: string): Promise<void> {
    await db
      .update(categories)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(categories.id, id));
  }
}

export const categoryRepository = new DrizzleCategoryRepository();

