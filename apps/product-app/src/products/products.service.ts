import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
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
import { ProductMapper } from './mappers/product.mapper';
import { ProductValidator } from './validators/product.validator';
import { ProductQueryBuilder } from './builders/product-query.builder';

export interface IProductsService {
  getById(dto: ProductIdDto): Promise<ProductResponse>;
  getBySlug(dto: ProductSlugDto): Promise<ProductResponse>;
  list(query: ProductListQueryDto): Promise<PaginatedProductsResponse>;
  create(dto: ProductCreateDto): Promise<ProductResponse>;
  update(id: string, dto: ProductUpdateDto): Promise<ProductResponse>;
  incrementStock(dto: StockChangeDto): Promise<StockChangeResult>;
  decrementStock(dto: StockChangeDto): Promise<StockChangeResult>;
}

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ProductMapper,
    private readonly validator: ProductValidator,
    private readonly queryBuilder: ProductQueryBuilder,
  ) {}

  /**
   * Get product by ID
   * @throws RpcException if product not found
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
        throw new RpcException({
          statusCode: 404,
          message: `Product with ID ${dto.id} not found`,
        });
      }

      return this.mapper.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      console.error('[ProductsService] getById error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to retrieve product',
      });
    }
  }

  /**
   * Get product by slug
   * @throws RpcException if product not found
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
        throw new RpcException({
          statusCode: 404,
          message: `Product with slug '${dto.slug}' not found`,
        });
      }

      return this.mapper.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      console.error('[ProductsService] getBySlug error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to retrieve product',
      });
    }
  }

  /**
   * List products with pagination and filters
   */
  async list(query: ProductListQueryDto): Promise<PaginatedProductsResponse> {
    try {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = this.queryBuilder.getPaginationParams(query);

      const where = this.queryBuilder.buildWhereClause(query);

      // Execute queries in parallel
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            category: true,
          },
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      const { totalPages } = this.queryBuilder.getPaginationMetadata(page, pageSize, total);

      return {
        products: this.mapper.mapManyToProductResponse(products),
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('[ProductsService] list error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to retrieve products',
      });
    }
  }

  /**
   * Create a new product
   * @throws RpcException if SKU or slug already exists
   * @throws RpcException if category doesn't exist
   */
  async create(dto: ProductCreateDto): Promise<ProductResponse> {
    try {
      // Validate unique constraints
      await this.validator.validateUniqueSKUAndSlug(dto.sku, dto.slug);

      // Validate category exists if provided
      await this.validator.validateCategoryExists(dto.categoryId);

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
      return this.mapper.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('[ProductsService] create error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to create product',
      });
    }
  }

  /**
   * Update an existing product
   * @throws RpcException if product not found
   * @throws RpcException if slug already exists
   */
  async update(id: string, dto: ProductUpdateDto): Promise<ProductResponse> {
    try {
      // Check product exists
      const existing = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new RpcException({
          statusCode: 404,
          message: `Product with ID ${id} not found`,
        });
      }

      // Validate slug uniqueness if updating slug
      await this.validator.validateSlugForUpdate(dto.slug, existing.slug);

      // Validate category exists if updating category
      await this.validator.validateCategoryExists(dto.categoryId);

      // Build update data object
      const updateData = this.buildProductUpdateData(dto);

      // Update product
      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      console.log(`[ProductsService] Updated product: ${id}`);
      return this.mapper.mapToProductResponse(product);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('[ProductsService] update error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to update product',
      });
    }
  }

  /**
   * Delete a product
   * @throws RpcException if product not found
   */
  async delete(id: string): Promise<{ success: boolean; id: string }> {
    try {
      const existing = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new RpcException({
          statusCode: 404,
          message: `Product with ID ${id} not found`,
        });
      }

      await this.prisma.product.delete({
        where: { id },
      });

      console.log(`[ProductsService] Deleted product: ${id}`);
      return { success: true, id };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      console.error('[ProductsService] delete error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to delete product',
      });
    }
  }

  /**
   * Increment product stock
   * @throws RpcException if product not found
   * @throws RpcException if quantity is invalid
   */
  async incrementStock(dto: StockChangeDto): Promise<StockChangeResult> {
    try {
      this.validator.validateStockChangeQuantity(dto.quantity);

      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new RpcException({
          statusCode: 404,
          message: `Product with ID ${dto.productId} not found`,
        });
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
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('[ProductsService] incrementStock error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to increment stock',
      });
    }
  }

  /**
   * Decrement product stock
   * @throws RpcException if product not found
   * @throws RpcException if insufficient stock
   */
  async decrementStock(dto: StockChangeDto): Promise<StockChangeResult> {
    try {
      this.validator.validateStockChangeQuantity(dto.quantity);

      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new RpcException({
          statusCode: 404,
          message: `Product with ID ${dto.productId} not found`,
        });
      }

      const previousStock = product.stock;
      const newStock = previousStock - dto.quantity;

      // Validate sufficient stock
      this.validator.validateSufficientStock(previousStock, dto.quantity);

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
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('[ProductsService] decrementStock error:', error);
      throw new RpcException({
        statusCode: 400,
        message: 'Failed to decrement stock',
      });
    }
  }

  /**
   * Build update data object from DTO
   * @private
   */
  private buildProductUpdateData(dto: ProductUpdateDto): {
    name?: string;
    slug?: string;
    priceInt?: number;
    stock?: number;
    description?: string | null;
    imageUrls?: string[];
    categoryId?: string | null;
    attributes?: never;
    model3dUrl?: string | null;
  } {
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

    return updateData;
  }
}
