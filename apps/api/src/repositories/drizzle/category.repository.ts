import { eq, or, isNull, and, sql } from "drizzle-orm";
import { db } from "../../db";
import { categories, type Category, type NewCategory } from "../../db/schema";
import type { ICategoryRepository } from "../interfaces/category.repository.interface";

const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: "EXPENSE" | "INCOME";
  icon: string;
  color: string;
}> = [
  // Pengeluaran (Expense)
  { name: "Makan & Minum", type: "EXPENSE", icon: "utensils", color: "#ff385c" },
  { name: "Belanja Harian", type: "EXPENSE", icon: "shopping-cart", color: "#3b82f6" },
  { name: "Transportasi", type: "EXPENSE", icon: "car", color: "#f59e0b" },
  { name: "Tagihan & Utilitas", type: "EXPENSE", icon: "receipt", color: "#8b5cf6" },
  { name: "Hunian", type: "EXPENSE", icon: "home", color: "#10b981" },
  { name: "Kesehatan", type: "EXPENSE", icon: "activity", color: "#ef4444" },
  { name: "Hiburan & Hobi", type: "EXPENSE", icon: "film", color: "#ec4899" },
  { name: "Belanja Pribadi", type: "EXPENSE", icon: "shopping-bag", color: "#6366f1" },
  { name: "Sosial & Hadiah", type: "EXPENSE", icon: "gift", color: "#14b8a6" },
  { name: "Pendidikan", type: "EXPENSE", icon: "book", color: "#f97316" },
  { name: "Cicilan & Hutang", type: "EXPENSE", icon: "credit-card", color: "#64748b" },
  { name: "Tabungan & Investasi", type: "EXPENSE", icon: "trending-up", color: "#059669" },
  { name: "Lainnya", type: "EXPENSE", icon: "more-horizontal", color: "#6b7280" },

  // Pemasukan (Income)
  { name: "Gaji", type: "INCOME", icon: "wallet", color: "#10b981" },
  { name: "Bonus", type: "INCOME", icon: "award", color: "#059669" },
  { name: "Usaha & Freelance", type: "INCOME", icon: "briefcase", color: "#3b82f6" },
  { name: "Hadiah Masuk", type: "INCOME", icon: "gift", color: "#8b5cf6" },
  { name: "Pemasukan Lainnya", type: "INCOME", icon: "plus-circle", color: "#6b7280" },
];

export class DrizzleCategoryRepository implements ICategoryRepository {
  private async ensureSystemCategoriesExist(): Promise<void> {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(isNull(categories.workspaceId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(categories).values(
        DEFAULT_CATEGORIES.map((c) => ({
          workspaceId: null,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
          isArchived: false,
        })),
      );
    }
  }

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
    let result = await db
      .select()
      .from(categories)
      .where(
        and(
          or(isNull(categories.workspaceId), eq(categories.workspaceId, workspaceId)),
          eq(categories.isArchived, false),
        ),
      );

    if (result.length === 0) {
      await this.ensureSystemCategoriesExist();
      result = await db
        .select()
        .from(categories)
        .where(
          and(
            or(isNull(categories.workspaceId), eq(categories.workspaceId, workspaceId)),
            eq(categories.isArchived, false),
          ),
        );
    }

    return result;
  }

  async archive(id: string): Promise<void> {
    await db
      .update(categories)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(categories.id, id));
  }

  async findSubcategoryByName(
    workspaceId: string,
    parentId: string,
    name: string,
  ): Promise<Category | null> {
    const cleanName = name.trim();
    if (!cleanName) return null;

    const [result] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.workspaceId, workspaceId),
          eq(categories.parentId, parentId),
          sql`lower(${categories.name}) = lower(${cleanName})`,
          eq(categories.isArchived, false),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  async findOrCreateSubcategory(
    workspaceId: string,
    parentId: string,
    name: string,
  ): Promise<Category> {
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error("Nama subkategori tidak boleh kosong");
    }

    const existing = await this.findSubcategoryByName(workspaceId, parentId, cleanName);
    if (existing) {
      return existing;
    }

    // Ambil kategori induk untuk mewarisi tipe & tema visual
    const parent = await this.findById(parentId);
    if (!parent) {
      throw new Error("Kategori induk tidak ditemukan");
    }

    try {
      const [created] = await db
        .insert(categories)
        .values({
          workspaceId,
          parentId,
          name: cleanName,
          type: parent.type,
          icon: parent.icon,
          color: parent.color,
          isArchived: false,
        })
        .returning();

      return created!;
    } catch {
      // Jika terjadi race condition (insert bersamaan oleh pasangan), gunakan yang berhasil tersimpan
      const raceExisting = await this.findSubcategoryByName(workspaceId, parentId, cleanName);
      if (raceExisting) {
        return raceExisting;
      }
      throw new Error("Gagal membuat subkategori");
    }
  }
}

export const categoryRepository = new DrizzleCategoryRepository();

