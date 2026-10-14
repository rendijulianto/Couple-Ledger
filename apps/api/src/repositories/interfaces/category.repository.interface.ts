import type { Category, NewCategory } from "../../db/schema";

export interface ICategoryRepository {
  create(category: NewCategory): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  listAvailableForWorkspace(workspaceId: string): Promise<Category[]>;
  archive(id: string): Promise<void>;
  findSubcategoryByName(
    workspaceId: string,
    parentId: string,
    name: string,
  ): Promise<Category | null>;
  findOrCreateSubcategory(
    workspaceId: string,
    parentId: string,
    name: string,
  ): Promise<Category>;
}

