import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { auditLogs, type AuditLog, type NewAuditLog } from "../../db/schema";
import type { IAuditLogRepository } from "../interfaces/audit.repository.interface";

export class DrizzleAuditLogRepository implements IAuditLogRepository {
  async record(log: NewAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    if (!result) {
      throw new Error("Gagal menyimpan audit log");
    }
    return result;
  }

  async listByWorkspace(
    workspaceId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.workspaceId, workspaceId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const auditLogRepository = new DrizzleAuditLogRepository();

