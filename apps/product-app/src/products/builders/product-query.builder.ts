import { Injectable } from '@nestjs/common';
import { ProductListQueryDto } from '@shared/dto/product.dto';

/**
 * Query builder for product list operations
 * Centralizes filter and query construction logic
 */
@Injectable()
export class ProductQueryBuilder {
  /**
   * Build where clause from query parameters
   */
  buildWhereClause(query: ProductListQueryDto): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    // Search filter
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (query.categorySlug) {
      where.category = {
        slug: query.categorySlug,
      };
    }

    // Price range filters
    if (query.minPriceInt !== undefined || query.maxPriceInt !== undefined) {
      where.priceInt = {};
      if (query.minPriceInt !== undefined) {
        (where.priceInt as Record<string, unknown>).gte = query.minPriceInt;
      }
      if (query.maxPriceInt !== undefined) {
        (where.priceInt as Record<string, unknown>).lte = query.maxPriceInt;
      }
    }

    return where;
  }

  /**
   * Get pagination parameters from query
   */
  getPaginationParams(query: ProductListQueryDto): { skip: number; take: number } {
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
