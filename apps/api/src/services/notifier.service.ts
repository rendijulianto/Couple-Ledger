import { Bot } from "grammy";
import { config } from "../config/env";
import type { ITelegramRepository } from "../repositories/interfaces/telegram.repository.interface";
import type { INotificationRepository } from "../repositories/interfaces/notification.repository.interface";
import { telegramRepository } from "../repositories/drizzle/telegram.repository";
import { notificationRepository } from "../repositories/drizzle/notification.repository";
import { formatRupiah, escapeTelegramHtml } from "@couple-ledger/shared";
import type { PopulatedTransaction } from "../repositories/interfaces/transaction.repository.interface";
import type { SafeUser } from "../repositories/interfaces/user.repository.interface";

/**
 * Pure helper to check if a specific date in Asia/Jakarta timezone falls within quiet hours.
 */
export function isInQuietHours(
  now: Date,
  start: string, // "HH:mm"
  end: string, // "HH:mm"
): boolean {
  if (!start || !end) return false;

  // Convert to HH:mm in Asia/Jakarta
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  if (start <= end) {
    // Normal day interval, e.g. 13:00 - 15:00
    return timeStr >= start && timeStr < end;
  } else {
    // Overnight interval, e.g. 22:00 - 07:00
    return timeStr >= start || timeStr < end;
  }
}

export class NotifierService {
  private bot: Bot | null = null;

  constructor(
    private readonly telegram: ITelegramRepository = telegramRepository,
    private readonly notifications: INotificationRepository = notificationRepository,
    botInstance?: Bot,
  ) {
    if (botInstance) {
      this.bot = botInstance;
    } else if (config.telegram.botToken) {
      try {
        this.bot = new Bot(config.telegram.botToken);
      } catch (err) {
        console.warn("⚠️ Telegram bot token invalid, running in mock mode:", err);
      }
    }
  }

  /**
   * Non-blocking async notification for new transaction.
   * STRICT RULE: Never sends to the author who created the transaction.
   */
  notifyTransactionCreated(
    transaction: PopulatedTransaction,
    author: SafeUser,
  ): void {
    // Fire and forget (non-blocking)
    queueMicrotask(async () => {
      try {
        await this.dispatchTransactionNotification(transaction, author);
      } catch (err) {
        console.error("❌ Gagal mengirim notifikasi transaksi:", err);
      }
    });
  }

  /**
   * Non-blocking async notification for budget alert (80% or 100%).
   * Budget alerts are sent to all members in the workspace.
   */
  notifyBudgetAlert(
    workspaceId: string,
    month: string,
    threshold: 80 | 100,
    spent: number,
    budget: number,
  ): void {
    queueMicrotask(async () => {
      try {
        await this.dispatchBudgetNotification(
          workspaceId,
          month,
          threshold,
          spent,
          budget,
        );
      } catch (err) {
        console.error("❌ Gagal mengirim peringatan budget:", err);
      }
    });
  }

  notifyApprovalRequested(
    workspaceId: string,
    requester: SafeUser,
    actionType: "UPDATE" | "DELETE",
    tx: PopulatedTransaction,
  ): void {
    queueMicrotask(async () => {
      try {
        const links = await this.telegram.findLinksByWorkspace(workspaceId);
        if (links.length === 0) return;

        const actionText = actionType === "UPDATE" ? "mengubah" : "menghapus";
        const messageHtml =
          `⚠️ <b>Permintaan Konfirmasi dari ${escapeTelegramHtml(requester.name)}</b>\n\n` +
          `Pasanganmu mengajukan untuk <b>${actionText}</b> transaksi:\n` +
          `📌 <b>Kategori:</b> ${escapeTelegramHtml(tx.category.name)}\n` +
          `💵 <b>Nominal:</b> ${formatRupiah(tx.amountIdr)}\n` +
          (tx.note ? `📝 <b>Catatan:</b> ${escapeTelegramHtml(tx.note)}\n` : "") +
          `\n<i>Perubahan ini belum diterapkan sampai kamu menyetujuinya di web.</i>\n\n` +
          `🔗 <a href="${config.webUrl}">Buka Couple Ledger untuk Konfirmasi</a>`;

        for (const link of links) {
          if (link.chatType === "PRIVATE" && link.userId === requester.id) {
            continue;
          }
          await this.sendMessageWithRetry(
            workspaceId,
            link.chatId,
            "APPROVAL_REQUESTED",
            messageHtml,
            { transactionId: tx.id, actionType },
          );
        }
      } catch (err) {
        console.error("❌ Gagal mengirim notifikasi approval request:", err);
      }
    });
  }

  notifyApprovalReviewed(
    workspaceId: string,
    reviewer: SafeUser,
    actionType: "UPDATE" | "DELETE",
    decision: "APPROVED" | "REJECTED",
    targetUserId: string,
  ): void {
    queueMicrotask(async () => {
      try {
        const links = await this.telegram.findLinksByWorkspace(workspaceId);
        if (links.length === 0) return;

        const actionText = actionType === "UPDATE" ? "perubahan" : "penghapusan";
        const decisionText = decision === "APPROVED" ? "✅ DISETUJUI" : "❌ DITOLAK";
        const descText =
          decision === "APPROVED"
            ? `Permintaan ${actionText} transaksimu telah diterapkan.`
            : `Permintaan ${actionText} transaksimu dibatalkan dan nilai transaksi tetap utuh seperti semula.`;

        const messageHtml =
          `🔔 <b>Status Konfirmasi Pasangan: ${decisionText}</b>\n\n` +
          `Pasanganmu (${escapeTelegramHtml(reviewer.name)}) telah <b>${decision === "APPROVED" ? "menyetujui" : "menolak"}</b> pengajuan ${actionText} transaksi.\n\n` +
          `${descText}\n\n` +
          `🔗 <a href="${config.webUrl}">Buka Couple Ledger</a>`;

        for (const link of links) {
          if (link.userId === targetUserId) {
            await this.sendMessageWithRetry(
              workspaceId,
              link.chatId,
              "APPROVAL_REVIEWED",
              messageHtml,
              { actionType, decision },
            );
          }
        }
      } catch (err) {
        console.error("❌ Gagal mengirim notifikasi review approval:", err);
      }
    });
  }

  notifyPolicyApprovalRequested(
    workspaceId: string,
    requester: SafeUser,
    targetPolicy: string,
  ): void {
    queueMicrotask(async () => {
      try {
        const links = await this.telegram.findLinksByWorkspace(workspaceId);
        if (links.length === 0) return;

        const policyLabel =
          targetPolicy === "STRICT_TODAY"
            ? "Wajib Hari Ini (Disiplin)"
            : "Bebas / Dinamis";

        const messageHtml =
          `⚠️ <b>Permintaan Ubah Kebijakan Tanggal dari ${escapeTelegramHtml(requester.name)}</b>\n\n` +
          `Pasanganmu mengajukan perubahan kebijakan pencatatan tanggal transaksi menjadi:\n` +
          `📌 <b>${policyLabel}</b>\n\n` +
          `<i>Perubahan ini butuh persetujuan darimu sebelum aktif di ruang bersama.</i>\n\n` +
          `🔗 <a href="${config.webUrl}">Buka Couple Ledger untuk Konfirmasi</a>`;

        for (const link of links) {
          if (link.chatType === "PRIVATE" && link.userId === requester.id) {
            continue;
          }
          await this.sendMessageWithRetry(
            workspaceId,
            link.chatId,
            "POLICY_APPROVAL_REQUESTED",
            messageHtml,
            { policyType: "DATE_POLICY", targetPolicy },
          );
        }
      } catch (err) {
        console.error("❌ Gagal mengirim notifikasi policy approval request:", err);
      }
    });
  }

  notifyPolicyApprovalReviewed(
    workspaceId: string,
    reviewer: SafeUser,
    decision: "APPROVED" | "REJECTED",
    targetUserId: string,
    targetPolicy: string,
  ): void {
    queueMicrotask(async () => {
      try {
        const links = await this.telegram.findLinksByWorkspace(workspaceId);
        if (links.length === 0) return;

        const decisionText = decision === "APPROVED" ? "✅ DISETUJUI" : "❌ DITOLAK";
        const policyLabel =
          targetPolicy === "STRICT_TODAY"
            ? "Wajib Hari Ini (Disiplin)"
            : "Bebas / Dinamis";

        const descText =
          decision === "APPROVED"
            ? `Kebijakan tanggal sekarang telah resmi diubah menjadi: ${policyLabel}.`
            : `Pengajuan perubahan kebijakan tanggal ditolak oleh pasanganmu. Kebijakan lama tetap berlaku.`;

        const messageHtml =
          `🔔 <b>Status Kebijakan Tanggal: ${decisionText}</b>\n\n` +
          `Pasanganmu (${escapeTelegramHtml(reviewer.name)}) telah <b>${decision === "APPROVED" ? "menyetujui" : "menolak"}</b> perubahan kebijakan tanggal pencatatan.\n\n` +
          `${descText}\n\n` +
          `🔗 <a href="${config.webUrl}">Buka Couple Ledger</a>`;

        for (const link of links) {
          if (link.userId === targetUserId) {
            await this.sendMessageWithRetry(
              workspaceId,
              link.chatId,
              "POLICY_APPROVAL_REVIEWED",
              messageHtml,
              { decision, targetPolicy },
            );
          }
        }
      } catch (err) {
        console.error("❌ Gagal mengirim notifikasi policy approval review:", err);
      }
    });
  }

  private async dispatchTransactionNotification(
    tx: PopulatedTransaction,
    author: SafeUser,
  ): Promise<void> {
    const links = await this.telegram.findLinksByWorkspace(tx.workspaceId);
    if (links.length === 0) return;

    const emoji = tx.type === "EXPENSE" ? "💸" : "💰";
    const typeLabel = tx.type === "EXPENSE" ? "Pengeluaran" : "Pemasukan";
    const walletLabel = tx.wallet?.name ? `\n💳 <b>Dompet:</b> ${escapeTelegramHtml(tx.wallet.name)}` : "";
    const noteLabel = tx.note ? `\n📝 <b>Catatan:</b> ${escapeTelegramHtml(tx.note)}` : "";

    const messageHtml =
      `${emoji} <b>${typeLabel} Baru dari ${escapeTelegramHtml(author.name)}</b>\n\n` +
      `📌 <b>Kategori:</b> ${escapeTelegramHtml(tx.category.name)}\n` +
      `💵 <b>Nominal:</b> <b>${formatRupiah(tx.amountIdr)}</b>\n` +
      `📅 <b>Tanggal:</b> ${tx.occurredOn}` +
      walletLabel +
      noteLabel +
      `\n\n🔗 <a href="${config.webUrl}">Buka di Couple Ledger</a>`;

    for (const link of links) {
      // RULE: Do NOT send to author's private chat!
      if (link.chatType === "PRIVATE" && link.userId === author.id) {
        continue;
      }

      // Check user preferences if link belongs to private user
      if (link.userId) {
        const prefs = await this.notifications.getPreferences(
          link.userId,
          tx.workspaceId,
        );

        if (prefs) {
          if (prefs.isMuted) continue;
          if (tx.amountIdr < prefs.minAmountIdr) continue;
          if (tx.type === "EXPENSE" && !prefs.notifyExpense) continue;
          if (tx.type === "INCOME" && !prefs.notifyIncome) continue;
          if (
            prefs.quietHoursStart &&
            prefs.quietHoursEnd &&
            isInQuietHours(new Date(), prefs.quietHoursStart, prefs.quietHoursEnd)
          ) {
            continue;
          }
        }
      }

      await this.sendMessageWithRetry(
        tx.workspaceId,
        link.chatId,
        "TRANSACTION_CREATED",
        messageHtml,
        { transactionId: tx.id, amountIdr: tx.amountIdr },
      );
    }
  }

  private async dispatchBudgetNotification(
    workspaceId: string,
    month: string,
    threshold: 80 | 100,
    spent: number,
    budget: number,
  ): Promise<void> {
    const links = await this.telegram.findLinksByWorkspace(workspaceId);
    if (links.length === 0) return;

    const percent = Math.round((spent / budget) * 100);
    const alertEmoji = threshold >= 100 ? "🚨" : "⚠️";

    const messageHtml =
      `${alertEmoji} <b>Peringatan Batas Budget (${threshold}%)</b>\n\n` +
      `Pengeluaran bulan <b>${month}</b> telah mencapai <b>${formatRupiah(spent)}</b> dari anggaran <b>${formatRupiah(budget)}</b> (${percent}%).\n\n` +
      `🔗 <a href="${config.webUrl}">Cek Dashboard Anggaran</a>`;

    const eventType =
      threshold >= 100 ? "BUDGET_WARNING_100" : "BUDGET_WARNING_80";

    for (const link of links) {
      if (link.userId) {
        const prefs = await this.notifications.getPreferences(
          link.userId,
          workspaceId,
        );
        if (prefs && (!prefs.notifyBudgetAlert || prefs.isMuted)) {
          continue;
        }
      }

      await this.sendMessageWithRetry(
        workspaceId,
        link.chatId,
        eventType,
        messageHtml,
        { month, threshold, spent, budget },
      );
    }
  }

  private async sendMessageWithRetry(
    workspaceId: string,
    chatId: string,
    eventType: string,
    text: string,
    payload: Record<string, unknown>,
    maxRetries = 2,
  ): Promise<void> {
    const log = await this.notifications.createLog({
      workspaceId,
      recipientChatId: chatId,
      eventType,
      payload,
      status: "PENDING",
      retryCount: 0,
    });

    if (!this.bot) {
      // Mock mode / dev without token
      console.log(`[TELEGRAM MOCK] Send to ${chatId}: ${text}`);
      await this.notifications.updateLogStatus(log.id, "SENT");
      return;
    }

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        await this.bot.api.sendMessage(chatId, text, {
          parse_mode: "HTML",
        });
        await this.notifications.updateLogStatus(log.id, "SENT");
        return;
      } catch (err: unknown) {
        attempt++;
        const errMsg = err instanceof Error ? err.message : String(err);

        // Error 403: Bot blocked by user -> disable link
        if (errMsg.includes("403") || errMsg.includes("bot was blocked")) {
          console.warn(`User blocked bot on chat ${chatId}, deactivating link`);
          await this.telegram.updateLinkStatus(chatId, false);
          await this.notifications.updateLogStatus(
            log.id,
            "FAILED",
            "User blocked bot (403)",
          );
          return;
        }

        // Error 429: Rate limited -> exponential backoff
        if (errMsg.includes("429") && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        if (attempt > maxRetries) {
          await this.notifications.updateLogStatus(log.id, "FAILED", errMsg);
        }
      }
    }
  }
}

export const notifierService = new NotifierService();

