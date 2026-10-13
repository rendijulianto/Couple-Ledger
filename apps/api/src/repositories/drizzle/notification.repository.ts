import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  notificationPrefs,
  notificationLogs,
  type NotificationPref,
  type NewNotificationPref,
  type NotificationLog,
  type NewNotificationLog,
} from "../../db/schema";
import type { INotificationRepository } from "../interfaces/notification.repository.interface";

export class DrizzleNotificationRepository implements INotificationRepository {
  async getPreferences(
    userId: string,
    workspaceId: string,
  ): Promise<NotificationPref | null> {
    const [result] = await db
      .select()
      .from(notificationPrefs)
      .where(
        and(
          eq(notificationPrefs.userId, userId),
          eq(notificationPrefs.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  async upsertPreferences(
    data: Partial<NewNotificationPref> & {
      userId: string;
      workspaceId: string;
    },
  ): Promise<NotificationPref> {
    const existing = await this.getPreferences(data.userId, data.workspaceId);
    if (existing) {
      const [updated] = await db
        .update(notificationPrefs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(notificationPrefs.id, existing.id))
        .returning();
      if (!updated) throw new Error("Gagal mengupdate preferensi notifikasi");
      return updated;
    }

    const [created] = await db
      .insert(notificationPrefs)
      .values({
        userId: data.userId,
        workspaceId: data.workspaceId,
        isMuted: data.isMuted ?? false,
        minAmountIdr: data.minAmountIdr ?? 0,
        quietHoursStart: data.quietHoursStart ?? null,
        quietHoursEnd: data.quietHoursEnd ?? null,
        notifyExpense: data.notifyExpense ?? true,
        notifyIncome: data.notifyIncome ?? true,
        notifyBudgetAlert: data.notifyBudgetAlert ?? true,
      })
      .returning();
    if (!created) throw new Error("Gagal membuat preferensi notifikasi");
    return created;
  }

  async createLog(data: NewNotificationLog): Promise<NotificationLog> {
    const [result] = await db
      .insert(notificationLogs)
      .values(data)
      .returning();
    if (!result) throw new Error("Gagal membuat log notifikasi");
    return result;
  }

  async updateLogStatus(
    id: string,
    status: "SENT" | "FAILED",
    errorMessage?: string,
  ): Promise<void> {
    await db
      .update(notificationLogs)
      .set({
        status,
        errorMessage: errorMessage ?? null,
        sentAt: status === "SENT" ? new Date() : null,
      })
      .where(eq(notificationLogs.id, id));
  }

  async listLogsByWorkspace(
    workspaceId: string,
    limit = 50,
  ): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.workspaceId, workspaceId))
      .orderBy(desc(notificationLogs.createdAt))
      .limit(limit);
  }
}

export const notificationRepository = new DrizzleNotificationRepository();

