ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parent_id" uuid REFERENCES "categories"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories"("parent_id");
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subcategory_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_subcategory_idx" ON "transactions"("subcategory_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_ws_parent_name_unique" ON "categories" ("workspace_id", "parent_id", lower("name")) WHERE "is_archived" = false AND "parent_id" IS NOT NULL AND "workspace_id" IS NOT NULL;
