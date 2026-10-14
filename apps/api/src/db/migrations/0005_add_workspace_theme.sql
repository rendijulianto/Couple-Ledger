ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "theme" varchar(32) DEFAULT 'rausch' NOT NULL;

