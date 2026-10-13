import type { Wallet, NewWallet } from "../../db/schema";

export interface IWalletRepository {
  create(wallet: NewWallet): Promise<Wallet>;
  findById(id: string): Promise<Wallet | null>;
  listByWorkspace(
    workspaceId: string,
    includeArchived?: boolean,
  ): Promise<Wallet[]>;
  archive(id: string): Promise<void>;
  update(id: string, data: Partial<NewWallet>): Promise<Wallet>;
}

