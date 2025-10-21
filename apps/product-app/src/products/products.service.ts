import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ProductCreateDto,
  ProductUpdateDto,
  ProductListQueryDto,
  ProductIdDto,
  ProductSlugDto,
  StockChangeDto,
} from '@shared/dto/product.dto';
import {
  ProductResponse,
  PaginatedProductsResponse,
  StockChangeResult,
} from '@shared/types/product.types';
import { PrismaService } from '@product-app/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get product by ID
   * @throws NotFoundException if product not found
   */
  async getById(dto: ProductIdDto): Promise<ProductResponse> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.id },
        include: {
          category: true,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.id} not found`);
      }

      return this.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[ProductsService] getById error:', error);
      throw new BadRequestException('Failed to retrieve product');
    }
  }

  /**
   * Get product by slug
   * @throws NotFoundException if product not found
   */
  async getBySlug(dto: ProductSlugDto): Promise<ProductResponse> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
        include: {
          category: true,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with slug '${dto.slug}' not found`);
      }

      return this.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[ProductsService] getBySlug error:', error);
      throw new BadRequestException('Failed to retrieve product');
    }
  }

  /**
   * List products with pagination and filters
   */
  async list(query: ProductListQueryDto): Promise<PaginatedProductsResponse> {
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

      // Execute queries in parallel
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            category: true,
          },
          skip,
          take: pageSize,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        products: products.map(p => this.mapToProductResponse(p)),
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('[ProductsService] list error:', error);
      throw new BadRequestException('Failed to retrieve products');
    }
  }

  /**
   * Create a new product
   * @throws ConflictException if SKU or slug already exists
   * @throws BadRequestException if category doesn't exist
   */
  async create(dto: ProductCreateDto): Promise<ProductResponse> {
    try {
      // Validate unique constraints
      const existing = await this.prisma.product.findFirst({
        where: {
          OR: [{ sku: dto.sku }, { slug: dto.slug }],
        },
      });

      if (existing) {
        if (existing.sku === dto.sku) {
          throw new ConflictException(`Product with SKU '${dto.sku}' already exists`);
        }
        throw new ConflictException(`Product with slug '${dto.slug}' already exists`);
      }

      // Validate category exists if provided
      if (dto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new BadRequestException(`Category with ID ${dto.categoryId} not found`);
        }
      }

      // Create product
      const product = await this.prisma.product.create({
        data: {
          sku: dto.sku,
          name: dto.name,
          slug: dto.slug,
          priceInt: dto.priceInt,
          stock: dto.stock ?? 0,
          description: dto.description,
          imageUrls: dto.imageUrls ?? [],
          categoryId: dto.categoryId,
          attributes: dto.attributes as never, // Prisma JSON type
          model3dUrl: dto.model3dUrl,
        },
        include: {
          category: true,
        },
      });

      console.log(`[ProductsService] Created product: ${product.id}`);
      return this.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[ProductsService] create error:', error);
      throw new BadRequestException('Failed to create product');
    }
  }

  /**
   * Update an existing product
   * @throws NotFoundException if product not found
   * @throws ConflictException if slug already exists
   */
  async update(id: string, dto: ProductUpdateDto): Promise<ProductResponse> {
    try {
      // Check product exists
      const existing = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Check slug uniqueness if updating slug
      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await this.prisma.product.findUnique({
          where: { slug: dto.slug },
        });
        if (slugExists) {
          throw new ConflictException(`Product with slug '${dto.slug}' already exists`);
        }
      }

      // Validate category exists if updating category
      if (dto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new BadRequestException(`Category with ID ${dto.categoryId} not found`);
        }
      }

      // Build update data object
      const updateData: {
        name?: string;
        slug?: string;
        priceInt?: number;
        stock?: number;
        description?: string | null;
        imageUrls?: string[];
        categoryId?: string | null;
        attributes?: never;
        model3dUrl?: string | null;
      } = {};

      if (dto.name) updateData.name = dto.name;
      if (dto.slug) updateData.slug = dto.slug;
      if (dto.priceInt !== undefined) updateData.priceInt = dto.priceInt;
      if (dto.stock !== undefined) updateData.stock = dto.stock;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.imageUrls) updateData.imageUrls = dto.imageUrls;
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (dto.attributes !== undefined) updateData.attributes = dto.attributes as never;
      if (dto.model3dUrl !== undefined) updateData.model3dUrl = dto.model3dUrl;

      // Update product
      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      console.log(`[ProductsService] Updated product: ${id}`);
      return this.mapToProductResponse(product);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('[ProductsService] update error:', error);
      throw new BadRequestException('Failed to update product');
    }
  }

  /**
   * Delete a product
   * @throws NotFoundException if product not found
   */
  async delete(id: string): Promise<{ success: boolean; id: string }> {
    try {
      const existing = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      await this.prisma.product.delete({
        where: { id },
      });

      console.log(`[ProductsService] Deleted product: ${id}`);
      return { success: true, id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[ProductsService] delete error:', error);
      throw new BadRequestException('Failed to delete product');
    }
  }

  /**
   * Increment product stock
   * @throws NotFoundException if product not found
   * @throws BadRequestException if quantity is invalid
   */
  async incrementStock(dto: StockChangeDto): Promise<StockChangeResult> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.productId} not found`);
      }

      const previousStock = product.stock;
      const newStock = previousStock + dto.quantity;

      await this.prisma.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      console.log(
        `[ProductsService] Incremented stock for ${dto.productId}: ${previousStock} -> ${newStock}`,
      );

      return {
        productId: dto.productId,
        previousStock,
        newStock,
        quantityChanged: dto.quantity,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('[ProductsService] incrementStock error:', error);
      throw new BadRequestException('Failed to increment stock');
    }
  }

  /**
   * Decrement product stock
   * @throws NotFoundException if product not found
   * @throws BadRequestException if insufficient stock
   */
  async decrementStock(dto: StockChangeDto): Promise<StockChangeResult> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${dto.productId} not found`);
      }

      const previousStock = product.stock;
      const newStock = previousStock - dto.quantity;

      // Validate sufficient stock
      if (newStock < 0) {
        throw new BadRequestException(
          `Insufficient stock for product ${dto.productId}. Available: ${previousStock}, Requested: ${dto.quantity}`,
        );
      }

      await this.prisma.product.update({
        where: { id: dto.productId },
        data: { stock: newStock },
      });

      console.log(
        `[ProductsService] Decremented stock for ${dto.productId}: ${previousStock} -> ${newStock}`,
      );

      return {
        productId: dto.productId,
        previousStock,
        newStock,
        quantityChanged: dto.quantity,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[ProductsService] decrementStock error:', error);
      throw new BadRequestException('Failed to decrement stock');
    }
  }

  /**
   * Map Prisma product to ProductResponse
   */
  private mapToProductResponse(product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    priceInt: number;
    stock: number;
    description: string | null;
    imageUrls: string[];
    categoryId: string | null;
    attributes: unknown;
    model3dUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    category?: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): ProductResponse {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      priceInt: product.priceInt,
      stock: product.stock,
      description: product.description,
      imageUrls: product.imageUrls,
      categoryId: product.categoryId,
      attributes: product.attributes as Record<string, unknown> | null,
      model3dUrl: product.model3dUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description,
            parentId: product.category.parentId,
            createdAt: product.category.createdAt,
            updatedAt: product.category.updatedAt,
          }
        : null,
    };
  }
}
