import { randomBytes, createHash } from "crypto";
import type { ITelegramRepository } from "../repositories/interfaces/telegram.repository.interface";
import type { IWorkspaceRepository } from "../repositories/interfaces/workspace.repository.interface";
import type { IMemberRepository } from "../repositories/interfaces/member.repository.interface";
import { telegramRepository } from "../repositories/drizzle/telegram.repository";
import { workspaceRepository } from "../repositories/drizzle/workspace.repository";
import { memberRepository } from "../repositories/drizzle/member.repository";
import { ForbiddenError } from "../domain/errors";

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: "private" | "group" | "supergroup" | "channel";
      title?: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
}

export class TelegramService {
  constructor(
    private readonly telegram: ITelegramRepository = telegramRepository,
    private readonly workspaces: IWorkspaceRepository = workspaceRepository,
    private readonly members: IMemberRepository = memberRepository,
  ) {}

  async generateLinkToken(
    userId: string,
    workspaceId: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const isMember = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!isMember) {
      throw new ForbiddenError("Anda bukan anggota ruang ini");
    }

    const rawToken = randomBytes(16).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.telegram.createLinkToken({
      workspaceId,
      userId,
      tokenHash,
      expiresAt,
    });

    return {
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async handleWebhookUpdate(
    update: TelegramWebhookUpdate,
  ): Promise<{ handled: boolean; reply?: string; chatId?: string }> {
    const msg = update.message;
    if (!msg || !msg.text) {
      return { handled: false };
    }

    const text = msg.text.trim();
    const chatId = String(msg.chat.id);
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const chatTitle = isGroup ? msg.chat.title : msg.from?.first_name;

    // 1. Command /start <token>
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();

      if (!token) {
        return {
          handled: true,
          chatId,
          reply:
            "👋 Halo! Untuk menautkan akun Couple Ledger, buka menu Pengaturan di aplikasi Web dan klik <b>Hubungkan Telegram</b>.",
        };
      }

      const tokenHash = createHash("sha256").update(token).digest("hex");
      const validToken = await this.telegram.findValidLinkToken(tokenHash);

      if (!validToken) {
        return {
          handled: true,
          chatId,
          reply:
            "❌ Token tautan tidak valid atau telah kedaluwarsa (berlaku 10 menit). Silakan buat token baru dari aplikasi web.",
        };
      }

      await this.telegram.createLink({
        workspaceId: validToken.workspaceId,
        userId: validToken.userId,
        chatId,
        chatType: "PRIVATE",
        chatTitle: chatTitle ?? undefined,
        isActive: true,
      });

      await this.telegram.markTokenUsed(validToken.id);

      return {
        handled: true,
        chatId,
        reply:
          "✅ <b>Akun berhasil ditautkan!</b> Anda akan menerima notifikasi otomatis ketika pasangan Anda mencatat transaksi baru.",
      };
    }

    // 2. Command /link <kode_ruang> (Grup)
    if (text.startsWith("/link")) {
      const parts = text.split(" ");
      const code = parts[1]?.trim().toUpperCase();

      if (!code) {
        return {
          handled: true,
          chatId,
          reply:
            "ℹ️ Gunakan format: <code>/link &lt;kode_ruang&gt;</code> untuk menautkan grup ini ke ruang catatan keuangan Anda.",
        };
      }

      const workspace = await this.workspaces.findByInviteCode(code);
      if (!workspace) {
        return {
          handled: true,
          chatId,
          reply: "❌ Kode ruang tidak ditemukan. Periksa kembali kode undangan ruang Anda.",
        };
      }

      await this.telegram.createLink({
        workspaceId: workspace.id,
        userId: null,
        chatId,
        chatType: isGroup ? "GROUP" : "PRIVATE",
        chatTitle: chatTitle ?? undefined,
        isActive: true,
      });

      return {
        handled: true,
        chatId,
        reply: `🎉 <b>Berhasil!</b> Chat ini telah ditautkan ke ruang <b>${workspace.name}</b>. Seluruh anggota akan menerima notifikasi pengeluaran bersama di sini.`,
      };
    }

    // 3. Command /mute
    if (text === "/mute") {
      await this.telegram.updateLinkStatus(chatId, false);
      return {
        handled: true,
        chatId,
        reply: "🔕 Notifikasi telah <b>dimatikan</b> untuk chat ini. Kirim <code>/unmute</code> untuk mengaktifkannya kembali.",
      };
    }

    // 4. Command /unmute
    if (text === "/unmute") {
      await this.telegram.updateLinkStatus(chatId, true);
      return {
        handled: true,
        chatId,
        reply: "🔔 Notifikasi telah <b>diaktifkan kembali</b>!",
      };
    }

    // 5. Command /status
    if (text === "/status") {
      const link = await this.telegram.findLinkByChatId(chatId);
      if (!link) {
        return {
          handled: true,
          chatId,
          reply: "ℹ️ Chat ini <b>belum ditautkan</b> ke Couple Ledger.",
        };
      }

      const workspace = await this.workspaces.findById(link.workspaceId);
      const statusText = link.isActive ? "🟢 Aktif" : "🔴 Dimatikan (/mute)";

      return {
        handled: true,
        chatId,
        reply:
          `📋 <b>Status Couple Ledger Bot:</b>\n\n` +
          `• Ruang: <b>${workspace?.name ?? "Tidak diketahui"}</b>\n` +
          `• Tipe Chat: <b>${link.chatType}</b>\n` +
          `• Status Notifikasi: <b>${statusText}</b>`,
      };
    }

    return { handled: false };
  }
}

export const telegramService = new TelegramService();

