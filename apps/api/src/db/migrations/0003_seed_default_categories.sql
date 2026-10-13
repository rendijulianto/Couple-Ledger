-- Seed 18 System Default Categories (workspace_id IS NULL)
INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Makan & Minum', 'EXPENSE', 'utensils', '#ff385c', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Makan & Minum' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Belanja Harian', 'EXPENSE', 'shopping-cart', '#3b82f6', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Belanja Harian' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Transportasi', 'EXPENSE', 'car', '#f59e0b', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Transportasi' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Tagihan & Utilitas', 'EXPENSE', 'receipt', '#8b5cf6', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Tagihan & Utilitas' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Hunian', 'EXPENSE', 'home', '#10b981', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Hunian' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Kesehatan', 'EXPENSE', 'activity', '#ef4444', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Kesehatan' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Hiburan & Hobi', 'EXPENSE', 'film', '#ec4899', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Hiburan & Hobi' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Belanja Pribadi', 'EXPENSE', 'shopping-bag', '#6366f1', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Belanja Pribadi' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Sosial & Hadiah', 'EXPENSE', 'gift', '#14b8a6', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Sosial & Hadiah' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Pendidikan', 'EXPENSE', 'book', '#f97316', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Pendidikan' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Cicilan & Hutang', 'EXPENSE', 'credit-card', '#64748b', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Cicilan & Hutang' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Tabungan & Investasi', 'EXPENSE', 'trending-up', '#059669', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Tabungan & Investasi' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Lainnya', 'EXPENSE', 'more-horizontal', '#6b7280', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Lainnya' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Gaji', 'INCOME', 'wallet', '#10b981', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Gaji' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Bonus', 'INCOME', 'award', '#059669', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Bonus' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Usaha & Freelance', 'INCOME', 'briefcase', '#3b82f6', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Usaha & Freelance' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Hadiah Masuk', 'INCOME', 'gift', '#8b5cf6', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Hadiah Masuk' AND "workspace_id" IS NULL);

INSERT INTO "categories" ("name", "type", "icon", "color", "workspace_id", "is_archived")
SELECT 'Pemasukan Lainnya', 'INCOME', 'plus-circle', '#6b7280', NULL, false
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "name" = 'Pemasukan Lainnya' AND "workspace_id" IS NULL);

