import type { IWalletRepository } from "../repositories/interfaces/wallet.repository.interface";
import type { IMemberRepository } from "../repositories/interfaces/member.repository.interface";
import type { IAuditLogRepository } from "../repositories/interfaces/audit.repository.interface";
import { walletRepository } from "../repositories/drizzle/wallet.repository";
import { memberRepository } from "../repositories/drizzle/member.repository";
import { auditLogRepository } from "../repositories/drizzle/audit.repository";
import { NotFoundError, ForbiddenError } from "../domain/errors";
import type {
  CreateWalletInput,
  UpdateWalletInput,
} from "@couple-ledger/shared";
import type { Wallet } from "../db/schema";
import type { RequestMeta } from "./auth.service";

export class WalletService {
  constructor(
    private readonly wallets: IWalletRepository = walletRepository,
    private readonly members: IMemberRepository = memberRepository,
    private readonly audit: IAuditLogRepository = auditLogRepository,
  ) {}

  async createWallet(
    userId: string,
    input: CreateWalletInput,
    meta?: RequestMeta,
  ): Promise<Wallet> {
    await this.ensureWorkspaceMembership(input.workspaceId, userId);

    const wallet = await this.wallets.create({
      workspaceId: input.workspaceId,
      name: input.name,
      type: input.type,
      isArchived: false,
    });

    await this.audit.record({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "WALLET_CREATED",
      entityType: "WALLET",
      entityId: wallet.id,
      after: { name: wallet.name, type: wallet.type },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return wallet;
  }

  async listWallets(
    userId: string,
    workspaceId: string,
    includeArchived = false,
  ): Promise<Wallet[]> {
    await this.ensureWorkspaceMembership(workspaceId, userId);
    return await this.wallets.listByWorkspace(workspaceId, includeArchived);
  }

  async updateWallet(
    userId: string,
    walletId: string,
    input: UpdateWalletInput,
    meta?: RequestMeta,
  ): Promise<Wallet> {
    const existing = await this.wallets.findById(walletId);
    if (!existing) {
      throw new NotFoundError("Dompet tidak ditemukan");
    }

    await this.ensureWorkspaceMembership(existing.workspaceId, userId);

    const updated = await this.wallets.update(walletId, input);

    await this.audit.record({
      workspaceId: existing.workspaceId,
      actorId: userId,
      action: "WALLET_UPDATED",
      entityType: "WALLET",
      entityId: walletId,
      before: { name: existing.name, type: existing.type },
      after: { name: updated.name, type: updated.type },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return updated;
  }

  async archiveWallet(
    userId: string,
    walletId: string,
    meta?: RequestMeta,
  ): Promise<void> {
    const existing = await this.wallets.findById(walletId);
    if (!existing) {
      throw new NotFoundError("Dompet tidak ditemukan");
    }

    await this.ensureWorkspaceMembership(existing.workspaceId, userId);

    await this.wallets.archive(walletId);

    await this.audit.record({
      workspaceId: existing.workspaceId,
      actorId: userId,
      action: "WALLET_ARCHIVED",
      entityType: "WALLET",
      entityId: walletId,
      before: { isArchived: false },
      after: { isArchived: true },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });
  }

  private async ensureWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.members.findByWorkspaceAndUser(
      workspaceId,
      userId,
    );
    if (!member) {
      throw new ForbiddenError("Anda bukan anggota dari ruang ini");
    }
  }
}

export const walletService = new WalletService();

