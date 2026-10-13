import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { wallets, type Wallet, type NewWallet } from "../../db/schema";
import type { IWalletRepository } from "../interfaces/wallet.repository.interface";

export class DrizzleWalletRepository implements IWalletRepository {
  async create(wallet: NewWallet): Promise<Wallet> {
    const [result] = await db.insert(wallets).values(wallet).returning();
    if (!result) {
      throw new Error("Gagal membuat dompet");
    }
    return result;
  }

  async findById(id: string): Promise<Wallet | null> {
    const [result] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.id, id))
      .limit(1);
    return result ?? null;
  }

  async listByWorkspace(
    workspaceId: string,
    includeArchived = false,
  ): Promise<Wallet[]> {
    if (includeArchived) {
      return await db
        .select()
        .from(wallets)
        .where(eq(wallets.workspaceId, workspaceId));
    }
    return await db
      .select()
      .from(wallets)
      .where(
        and(eq(wallets.workspaceId, workspaceId), eq(wallets.isArchived, false)),
      );
  }

  async archive(id: string): Promise<void> {
    await db
      .update(wallets)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(wallets.id, id));
  }

  async update(id: string, data: Partial<NewWallet>): Promise<Wallet> {
    const [result] = await db
      .update(wallets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(wallets.id, id))
      .returning();
    if (!result) {
      throw new Error("Gagal memperbarui dompet");
    }
    return result;
  }
}

export const walletRepository = new DrizzleWalletRepository();

