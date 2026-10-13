import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./index";
import path from "path";

export async function runMigrations() {
  console.log("⏳ Running database migrations...");
  const migrationsFolder = path.resolve(__dirname, "./migrations");
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

