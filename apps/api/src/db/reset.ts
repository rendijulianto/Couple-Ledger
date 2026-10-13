import { sql } from "./index";

export async function resetDatabase() {
  // HARD GUARD: Dilarang keras berjalan di production (project.md Bagian 13)
  if (
    process.env.NODE_ENV === "production" ||
    process.env.APP_ENV === "production"
  ) {
    throw new Error("🚨 RESET DATABASE DILARANG DI ENVIRONMENT PRODUCTION!");
  }

  console.log("⚠️ Mengosongkan data database lokal (CASCADE)...");

  await sql`
    TRUNCATE TABLE
      audit_logs,
      notification_logs,
      notification_prefs,
      link_tokens,
      telegram_links,
      budgets,
      transactions,
      categories,
      wallets,
      members,
      workspaces,
      sessions,
      users
    CASCADE;
  `;

  console.log("✅ Database lokal berhasil di-reset bersih.");
}

if (import.meta.main) {
  resetDatabase()
    .then(async () => {
      await sql.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Reset gagal:", err);
      await sql.end();
      process.exit(1);
    });
}

