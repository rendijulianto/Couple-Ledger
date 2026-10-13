import { describe, expect, it } from "bun:test";
import { db } from "../src/db";
import { categories, transactions } from "../src/db/schema";
import { isNull } from "drizzle-orm";

describe("Database Schema & Seed Verification", () => {
  it("has default seeded categories in categories table", async () => {
    const defaultCategories = await db
      .select()
      .from(categories)
      .where(isNull(categories.workspaceId));

    expect(defaultCategories.length).toBe(18);

    const expenseCategories = defaultCategories.filter(
      (c) => c.type === "EXPENSE",
    );
    const incomeCategories = defaultCategories.filter(
      (c) => c.type === "INCOME",
    );

    expect(expenseCategories.length).toBe(13);
    expect(incomeCategories.length).toBe(5);

    // Verify key categories exist
    const names = defaultCategories.map((c) => c.name);
    expect(names).toContain("Makan & Minum");
    expect(names).toContain("Gaji");
  });

  it("verifies transactions table definition has deleted_at for soft delete", () => {
    // Structural verification of schema fields
    expect(transactions.deletedAt).toBeDefined();
    expect(transactions.amountIdr).toBeDefined();
    expect(transactions.workspaceId).toBeDefined();
  });
});

