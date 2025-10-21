import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryIdDto,
  CategorySlugDto,
  CategoryListQueryDto,
} from '@shared/dto/category.dto';
import {
  CategoryResponse,
  PaginatedCategoriesResponse,
  CategoryWithRelations,
} from '@shared/types/product.types';
import { PrismaService } from '@product-app/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get category by ID with relationships
   * @throws NotFoundException if category not found
   */
  async getById(dto: CategoryIdDto): Promise<CategoryWithRelations> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.id },
        include: {
          parent: true,
          children: true,
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.id} not found`);
      }

      return this.mapToCategoryWithRelations(category);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[CategoriesService] getById error:', error);
      throw new BadRequestException('Failed to retrieve category');
    }
  }

  /**
   * Get category by slug with relationships
   * @throws NotFoundException if category not found
   */
  async getBySlug(dto: CategorySlugDto): Promise<CategoryWithRelations> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
        include: {
          parent: true,
          children: true,
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with slug '${dto.slug}' not found`);
      }

      return this.mapToCategoryWithRelations(category);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[CategoriesService] getBySlug error:', error);
      throw new BadRequestException('Failed to retrieve category');
    }
  }

  /**
   * List categories with pagination and filters
   */
  async list(query: CategoryListQueryDto): Promise<PaginatedCategoriesResponse> {
    try {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      // Build where clause for filters
      const where: Record<string, unknown> = {};

      // Search filter
      if (query.q) {
        where.OR = [
          { name: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      // Parent filter - if parentSlug provided, find categories under that parent
      if (query.parentSlug) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { slug: query.parentSlug },
        });

        if (parentCategory) {
          where.parentId = parentCategory.id;
        } else {
          // If parent not found, return empty results
          return {
            categories: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
      }

      // Execute queries in parallel
      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          include: {
            parent: true,
            children: true,
          },
          skip,
          take: pageSize,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.category.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        categories: categories.map(c => this.mapToCategoryResponse(c)),
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('[CategoriesService] list error:', error);
      throw new BadRequestException('Failed to retrieve categories');
    }
  }

  /**
   * Create a new category
   * @throws ConflictException if slug already exists
   * @throws BadRequestException if parent category doesn't exist
   */
  async create(dto: CategoryCreateDto): Promise<CategoryResponse> {
    try {
      // Validate unique slug
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException(`Category with slug '${dto.slug}' already exists`);
      }

      // Validate parent exists if provided
      if (dto.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new BadRequestException(`Parent category with ID ${dto.parentId} not found`);
        }
      }

      // Create category
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          parentId: dto.parentId,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      console.log(`[CategoriesService] Created category: ${category.id}`);
      return this.mapToCategoryResponse(category);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[CategoriesService] create error:', error);
      throw new BadRequestException('Failed to create category');
    }
  }

  /**
   * Update an existing category
   * @throws NotFoundException if category not found
   * @throws ConflictException if slug already exists
   * @throws BadRequestException if trying to set self as parent or create circular reference
   */
  async update(id: string, dto: CategoryUpdateDto): Promise<CategoryResponse> {
    try {
      // Check category exists
      const existing = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Check slug uniqueness if updating slug
      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await this.prisma.category.findUnique({
          where: { slug: dto.slug },
        });
        if (slugExists) {
          throw new ConflictException(`Category with slug '${dto.slug}' already exists`);
        }
      }

      // Validate parent exists and prevent circular reference
      if (dto.parentId !== undefined) {
        if (dto.parentId === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }

        if (dto.parentId) {
          const parent = await this.prisma.category.findUnique({
            where: { id: dto.parentId },
          });
          if (!parent) {
            throw new BadRequestException(`Parent category with ID ${dto.parentId} not found`);
          }

          // Check if the parent is a child of current category (circular reference)
          if (parent.parentId === id) {
            throw new BadRequestException(
              'Cannot create circular reference: parent is already a child of this category',
            );
          }
        }
      }

      // Update category
      const updateData: {
        name?: string;
        slug?: string;
        description?: string | null;
        parentId?: string | null;
      } = {};

      if (dto.name) updateData.name = dto.name;
      if (dto.slug) updateData.slug = dto.slug;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.parentId !== undefined) updateData.parentId = dto.parentId;

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          parent: true,
          children: true,
        },
      });

      console.log(`[CategoriesService] Updated category: ${id}`);
      return this.mapToCategoryResponse(category);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('[CategoriesService] update error:', error);
      throw new BadRequestException('Failed to update category');
    }
  }

  /**
   * Delete a category
   * @throws NotFoundException if category not found
   * @throws BadRequestException if category has children or products
   */
  async delete(id: string): Promise<{ success: boolean; id: string }> {
    try {
      const existing = await this.prisma.category.findUnique({
        where: { id },
        include: {
          children: true,
          products: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Prevent deletion if category has children
      if (existing.children.length > 0) {
        throw new BadRequestException(
          'Cannot delete category with child categories. Delete or reassign children first.',
        );
      }

      // Prevent deletion if category has products
      if (existing.products.length > 0) {
        throw new BadRequestException(
          'Cannot delete category with products. Reassign products first.',
        );
      }

      await this.prisma.category.delete({
        where: { id },
      });

      console.log(`[CategoriesService] Deleted category: ${id}`);
      return { success: true, id };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[CategoriesService] delete error:', error);
      throw new BadRequestException('Failed to delete category');
    }
  }

  /**
   * Map Prisma category to CategoryResponse
   */
  private mapToCategoryResponse(category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    parent?: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    children?: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
            description: category.parent.description,
            parentId: category.parent.parentId,
            createdAt: category.parent.createdAt,
            updatedAt: category.parent.updatedAt,
          }
        : null,
      children: category.children?.map(child => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        parentId: child.parentId,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
    };
  }

  /**
   * Map Prisma category to CategoryWithRelations
   */
  private mapToCategoryWithRelations(category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    parent?: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    children?: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): CategoryWithRelations {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
            description: category.parent.description,
            parentId: category.parent.parentId,
            createdAt: category.parent.createdAt,
            updatedAt: category.parent.updatedAt,
          }
        : null,
      children:
        category.children?.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          parentId: child.parentId,
          createdAt: child.createdAt,
          updatedAt: child.updatedAt,
        })) ?? [],
    };
  }
}
