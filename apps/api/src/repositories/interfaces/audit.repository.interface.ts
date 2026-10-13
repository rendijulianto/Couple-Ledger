import type { AuditLog, NewAuditLog } from "../../db/schema";

export interface IAuditLogRepository {
  record(log: NewAuditLog): Promise<AuditLog>;
  listByWorkspace(
    workspaceId: string,
    limit?: number,
  ): Promise<AuditLog[]>;
}

