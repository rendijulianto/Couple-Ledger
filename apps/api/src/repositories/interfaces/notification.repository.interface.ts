import type {
  NotificationPref,
  NewNotificationPref,
  NotificationLog,
  NewNotificationLog,
} from "../../db/schema";

export interface INotificationRepository {
  getPreferences(
    userId: string,
    workspaceId: string,
  ): Promise<NotificationPref | null>;
  upsertPreferences(
    data: Partial<NewNotificationPref> & {
      userId: string;
      workspaceId: string;
    },
  ): Promise<NotificationPref>;
  createLog(data: NewNotificationLog): Promise<NotificationLog>;
  updateLogStatus(
    id: string,
    status: "SENT" | "FAILED",
    errorMessage?: string,
  ): Promise<void>;
  listLogsByWorkspace(
    workspaceId: string,
    limit?: number,
  ): Promise<NotificationLog[]>;
}

