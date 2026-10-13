import type { Category, NewCategory } from "../../db/schema";

export interface ICategoryRepository {
  create(category: NewCategory): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  listAvailableForWorkspace(workspaceId: string): Promise<Category[]>;
  archive(id: string): Promise<void>;
}

