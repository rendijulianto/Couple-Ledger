import { db, sql } from "./index";
import { categories } from "./schema/categories";
import { isNull } from "drizzle-orm";

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

export async function seed() {
  // HARD GUARD: Dilarang keras berjalan di production (project.md Bagian 13)
  if (
    process.env.NODE_ENV === "production" ||
    process.env.APP_ENV === "production"
  ) {
    throw new Error("🚨 SEEDING DILARANG DI ENVIRONMENT PRODUCTION!");
  }

  console.log("🌱 Menjalankan database seed...");

  // Cek kategori default (workspaceId is null)
  const existing = await db
    .select()
    .from(categories)
    .where(isNull(categories.workspaceId));

  if (existing.length === 0) {
    console.log(`📦 Menambahkan ${DEFAULT_CATEGORIES.length} kategori default...`);
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
    console.log("✅ Kategori default berhasil ditambahkan!");
  } else {
    console.log(`ℹ️ Kategori default sudah ada (${existing.length} item), melewati insert.`);
  }

  console.log("🎉 Seed selesai!");
}

if (import.meta.main) {
  seed()
    .then(async () => {
      await sql.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Seed gagal:", err);
      await sql.end();
      process.exit(1);
    });
}

