import type { ICategoryRepository } from "../repositories/interfaces/category.repository.interface";
import type { IMemberRepository } from "../repositories/interfaces/member.repository.interface";
import type { IAuditLogRepository } from "../repositories/interfaces/audit.repository.interface";
import { categoryRepository } from "../repositories/drizzle/category.repository";
import { memberRepository } from "../repositories/drizzle/member.repository";
import { auditLogRepository } from "../repositories/drizzle/audit.repository";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../domain/errors";
import type { CreateCategoryInput } from "@couple-ledger/shared";
import type { Category } from "../db/schema";
import type { RequestMeta } from "./auth.service";

export class CategoryService {
  constructor(
    private readonly categories: ICategoryRepository = categoryRepository,
    private readonly members: IMemberRepository = memberRepository,
    private readonly audit: IAuditLogRepository = auditLogRepository,
  ) {}

  async createCategory(
    userId: string,
    input: CreateCategoryInput,
    meta?: RequestMeta,
  ): Promise<Category> {
    await this.ensureWorkspaceMembership(input.workspaceId, userId);

    const category = await this.categories.create({
      workspaceId: input.workspaceId,
      name: input.name,
      type: input.type,
      icon: input.icon ?? "circle",
      color: input.color ?? "#222222",
      isArchived: false,
    });

    await this.audit.record({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "CATEGORY_CREATED",
      entityType: "CATEGORY",
      entityId: category.id,
      after: { name: category.name, type: category.type },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      requestId: meta?.requestId,
    });

    return category;
  }

  async listCategories(
    userId: string,
    workspaceId: string,
  ): Promise<Category[]> {
    await this.ensureWorkspaceMembership(workspaceId, userId);
    return await this.categories.listAvailableForWorkspace(workspaceId);
  }

  async archiveCategory(
    userId: string,
    categoryId: string,
    meta?: RequestMeta,
  ): Promise<void> {
    const existing = await this.categories.findById(categoryId);
    if (!existing) {
      throw new NotFoundError("Kategori tidak ditemukan");
    }

    if (!existing.workspaceId) {
      throw new ValidationError("Kategori bawaan sistem tidak dapat diarsipkan");
    }

    await this.ensureWorkspaceMembership(existing.workspaceId, userId);

    await this.categories.archive(categoryId);

    await this.audit.record({
      workspaceId: existing.workspaceId,
      actorId: userId,
      action: "CATEGORY_ARCHIVED",
      entityType: "CATEGORY",
      entityId: categoryId,
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

export const categoryService = new CategoryService();

