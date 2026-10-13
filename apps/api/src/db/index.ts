import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config/env";

const connectionString = config.databaseUrl;

// Setup client with max 10 connections for development
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
  onnotice: () => {}, // silence notices in dev
});

export const db = drizzle(sql);

/**
 * Check if the database connection is alive.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

