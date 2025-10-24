import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@product-app/prisma/prisma.service';

/**
 * Validator class for product business rules
 * Centralizes validation logic and reduces service complexity
 */
@Injectable()
export class ProductValidator {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate SKU and slug uniqueness
   * @throws RpcException if SKU or slug already exists
   */
  async validateUniqueSKUAndSlug(sku: string, slug: string): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: {
        OR: [{ sku }, { slug }],
      },
    });

    if (!existing) {
      return;
    }

    if (existing.sku === sku) {
      throw new RpcException({
        statusCode: 409,
        message: `Product with SKU '${sku}' already exists`,
      });
    }

    throw new RpcException({
      statusCode: 409,
      message: `Product with slug '${slug}' already exists`,
    });
  }

  /**
   * Validate slug uniqueness when updating (allow same slug)
   * @throws RpcException if slug already exists for different product
   */
  async validateSlugForUpdate(newSlug: string | undefined, currentSlug: string): Promise<void> {
    if (!newSlug || newSlug === currentSlug) {
      return;
    }

    const slugExists = await this.prisma.product.findUnique({
      where: { slug: newSlug },
    });

    if (slugExists) {
      throw new RpcException({
        statusCode: 409,
        message: `Product with slug '${newSlug}' already exists`,
      });
    }
  }

  /**
   * Validate category exists
   * @throws RpcException if category not found
   */
  async validateCategoryExists(categoryId: string | undefined): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new RpcException({
        statusCode: 400,
        message: `Category with ID ${categoryId} not found`,
      });
    }
  }

  /**
   * Validate stock change quantity
   * @throws RpcException if quantity is invalid
   */
  validateStockChangeQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new RpcException({
        statusCode: 400,
        message: 'Stock change quantity must be greater than 0',
      });
    }
  }

  /**
   * Validate sufficient stock for decrement
   * @throws RpcException if insufficient stock
   */
  validateSufficientStock(currentStock: number, quantityToDecrement: number): void {
    if (currentStock - quantityToDecrement < 0) {
      throw new RpcException({
        statusCode: 400,
        message: `Insufficient stock. Available: ${currentStock}, Requested: ${quantityToDecrement}`,
      });
    }
  }
}
