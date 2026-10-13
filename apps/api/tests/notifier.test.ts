import { describe, expect, it } from "bun:test";
import { isInQuietHours, NotifierService } from "../src/services/notifier.service";
import type { ITelegramRepository } from "../src/repositories/interfaces/telegram.repository.interface";
import type { INotificationRepository } from "../src/repositories/interfaces/notification.repository.interface";
import type { PopulatedTransaction } from "../src/repositories/interfaces/transaction.repository.interface";
import type {
  TelegramLink,
  NotificationPref,
  User,
  NewNotificationLog,
  NotificationLog,
} from "../src/db/schema";

describe("Notifier Engine Rules & Quiet Hours", () => {
  it("isInQuietHours handles overnight window (e.g. 22:00 - 07:00)", () => {
    // 23:30 Jakarta time (16:30 UTC)
    const lateNight = new Date("2026-10-12T16:30:00Z");
    expect(isInQuietHours(lateNight, "22:00", "07:00")).toBe(true);

    // 03:00 Jakarta time (20:00 UTC previous day)
    const earlyMorning = new Date("2026-10-11T20:00:00Z");
    expect(isInQuietHours(earlyMorning, "22:00", "07:00")).toBe(true);

    // 12:00 Jakarta time (05:00 UTC)
    const noon = new Date("2026-10-12T05:00:00Z");
    expect(isInQuietHours(noon, "22:00", "07:00")).toBe(false);
  });

  it("isInQuietHours handles daytime window (e.g. 13:00 - 15:00)", () => {
    // 14:00 Jakarta time (07:00 UTC)
    const napTime = new Date("2026-10-12T07:00:00Z");
    expect(isInQuietHours(napTime, "13:00", "15:00")).toBe(true);

    // 16:00 Jakarta time (09:00 UTC)
    const afternoon = new Date("2026-10-12T09:00:00Z");
    expect(isInQuietHours(afternoon, "13:00", "15:00")).toBe(false);
  });

  it("NotifierService excludes author from receiving private notification of their own input", async () => {
    const sentMessages: string[] = [];

    const mockTelegram: ITelegramRepository = {
      async findLinksByWorkspace(wsId: string): Promise<TelegramLink[]> {
        return [
          {
            id: "1",
            workspaceId: wsId,
            userId: "author_id",
            chatId: "111",
            chatType: "PRIVATE",
            chatTitle: "Author",
            isActive: true,
            linkedAt: new Date(),
          },
          {
            id: "2",
            workspaceId: wsId,
            userId: "partner_id",
            chatId: "222",
            chatType: "PRIVATE",
            chatTitle: "Partner",
            isActive: true,
            linkedAt: new Date(),
          },
        ];
      },
      createLink: async () => ({ id: "1" } as unknown as TelegramLink),
      findLinkByChatId: async () => null,
      updateLinkStatus: async () => {},
      createLinkToken: async () => ({} as unknown as any),
      findValidLinkToken: async () => null,
      markTokenUsed: async () => {},
    };

    const mockNotifications: INotificationRepository = {
      async getPreferences(): Promise<NotificationPref | null> {
        return null;
      },
      async createLog(data: NewNotificationLog): Promise<NotificationLog> {
        sentMessages.push(data.recipientChatId);
        return { id: "log_1" } as unknown as NotificationLog;
      },
      upsertPreferences: async () => ({} as unknown as NotificationPref),
      updateLogStatus: async () => {},
      listLogsByWorkspace: async () => [],
    };

    const notifier = new NotifierService(mockTelegram, mockNotifications);

    const dummyAuthor: User = {
      id: "author_id",
      name: "Rendi",
      email: "rendi@test.com",
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dummyTx: PopulatedTransaction = {
      id: "tx_1",
      workspaceId: "ws_1",
      createdById: "author_id",
      categoryId: "cat_1",
      walletId: null,
      type: "EXPENSE",
      amountIdr: 50000,
      note: "Kopi",
      occurredOn: "2026-10-12",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      category: {
        id: "cat_1",
        workspaceId: null,
        name: "Makan & Minum",
        type: "EXPENSE",
        icon: "utensils",
        color: "#ff385c",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      wallet: null,
      createdBy: dummyAuthor,
    };

    // Trigger notification
    notifier.notifyTransactionCreated(dummyTx, dummyAuthor);

    // Allow microtask to process
    await new Promise((r) => setTimeout(r, 50));

    // Partner chat "222" must receive notification, but Author chat "111" must NOT!
    expect(sentMessages).toContain("222");
    expect(sentMessages).not.toContain("111");
  });
});

