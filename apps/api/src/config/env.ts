export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || process.env.API_PORT || 3000),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://ledger_dev:ledger_dev_password@localhost:5436/couple_ledger_dev",
  appSecret:
    process.env.APP_SECRET || "dev_super_secret_key_at_least_32_characters_long",
  webUrl: process.env.WEB_URL || "http://localhost:5174",
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "dev_secret",
  },
};

