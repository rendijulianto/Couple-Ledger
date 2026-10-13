import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { healthController } from "./controllers/health.controller";
import { authController } from "./controllers/auth.controller";
import { workspaceController } from "./controllers/workspace.controller";
import { walletController } from "./controllers/wallet.controller";
import { categoryController } from "./controllers/category.controller";
import { transactionController } from "./controllers/transaction.controller";
import { budgetController } from "./controllers/budget.controller";
import { telegramController } from "./controllers/telegram.controller";

import { existsSync, statSync } from "fs";
import { resolve } from "path";

export const app = new Elysia()
  .onRequest(({ set }) => {
    // Security Headers (Hardening)
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
  })
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "Couple Ledger API",
          version: "0.1.0",
          description: "API for Couple Ledger Expense Tracker",
        },
      },
    }),
  )
  .use(errorMiddleware)
  .use(healthController)
  .use(authController)
  .use(workspaceController)
  .use(walletController)
  .use(categoryController)
  .use(transactionController)
  .use(budgetController)
  .use(telegramController);

// Monolith Production Static SPA Serving
const possibleStaticDirs = [
  resolve(process.cwd(), "apps/web/dist"),
  resolve(process.cwd(), "dist/client"),
  resolve(__dirname, "../../web/dist"),
  resolve(__dirname, "../web/dist"),
];
const staticDir = possibleStaticDirs.find((dir) => existsSync(dir));

if (staticDir) {
  app.get("*", ({ path, set }) => {
    if (
      path.startsWith("/auth") ||
      path.startsWith("/workspaces") ||
      path.startsWith("/transactions") ||
      path.startsWith("/wallets") ||
      path.startsWith("/categories") ||
      path.startsWith("/budgets") ||
      path.startsWith("/telegram") ||
      path.startsWith("/health") ||
      path.startsWith("/swagger")
    ) {
      set.status = 404;
      return { success: false, error: { message: "Endpoint tidak ditemukan" } };
    }

    const requestedPath = path.replace(/^\//, "");
    if (requestedPath) {
      const targetFile = resolve(staticDir, requestedPath);
      if (existsSync(targetFile)) {
        try {
          const stat = statSync(targetFile);
          if (stat.isFile()) {
            return Bun.file(targetFile);
          }
        } catch {
          // ignore error and fallback to index.html
        }
      }
    }

    const indexHtml = resolve(staticDir, "index.html");
    if (existsSync(indexHtml)) {
      set.headers["Content-Type"] = "text/html; charset=utf-8";
      return Bun.file(indexHtml);
    }

    return "Couple Ledger API is running";
  });
}

// Only listen if this file is executed directly (not when imported in tests)
if (process.env.NODE_ENV !== "test") {
  app.listen(
    {
      port: config.port,
      hostname: "0.0.0.0",
    },
    () => {
      console.log(
        `🦊 Couple Ledger API is running at http://0.0.0.0:${config.port}`,
      );
      console.log(
        `📚 Swagger documentation at http://0.0.0.0:${config.port}/swagger`,
      );
    },
  );
}

export type App = typeof app;
