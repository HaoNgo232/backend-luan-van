import { Injectable } from '@nestjs/common';
import { CategoryListQueryDto } from '@shared/dto/category.dto';
import { PrismaService } from '@product-app/prisma/prisma.service';

/**
 * Query builder for category list operations
 * Centralizes filter and query construction logic
 */
@Injectable()
export class CategoryQueryBuilder {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build where clause from query parameters
   */
  async buildWhereClause(query: CategoryListQueryDto): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = {};

    // Search filter
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    // Parent filter
    if (query.parentSlug) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { slug: query.parentSlug },
        select: { id: true },
      });

      if (parentCategory) {
        where.parentId = parentCategory.id;
      } else {
        // Return impossible condition if parent not found
        where.id = { equals: 'PARENT_NOT_FOUND' };
      }
    }

    return where;
  }

  /**
   * Get pagination parameters from query
   */
  getPaginationParams(query: CategoryListQueryDto): { skip: number; take: number } {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    return { skip, take: pageSize };
  }

  /**
   * Get pagination metadata
   */
  getPaginationMetadata(
    page: number,
    pageSize: number,
    total: number,
  ): {
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    return {
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
