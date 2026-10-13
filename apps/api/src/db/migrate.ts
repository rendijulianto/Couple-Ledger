import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./index";
import path from "path";
import fs from "fs";

export async function runMigrations() {
  console.log("⏳ Running database migrations...");
  const candidatePaths = [
    process.env.MIGRATIONS_FOLDER,
    path.resolve(__dirname, "./migrations"),
    path.resolve(__dirname, "./src/db/migrations"),
    path.resolve(__dirname, "../src/db/migrations"),
    path.resolve(process.cwd(), "apps/api/src/db/migrations"),
    path.resolve(process.cwd(), "src/db/migrations"),
  ].filter(Boolean) as string[];

  const migrationsFolder = candidatePaths.find((p) => fs.existsSync(p));
  if (!migrationsFolder) {
    throw new Error(
      `Folder migrasi tidak ditemukan! Kandidat path: ${candidatePaths.join(", ")}`,
    );
  }

  console.log(`📁 Menggunakan folder migrasi: ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("✅ Database migrations applied successfully!");
}

if (import.meta.main) {
  runMigrations()
    .then(async () => {
      await sql.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Migration failed:", err);
      await sql.end();
      process.exit(1);
    });
}

