import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryListQueryDto,
} from '@shared/dto/category.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { BaseGatewayController } from '../base.controller';
import { CategoryResponse, PaginatedCategoriesResponse } from '@shared/types/product.types';
import { SuccessResponse } from '@shared/types/response.types';

/**
 * Categories Controller
 * Gateway endpoint cho product categories - forward requests đến product-service
 */
@Controller('categories')
export class CategoriesController extends BaseGatewayController {
  constructor(@Inject('PRODUCT_SERVICE') protected readonly client: ClientProxy) {
    super(client);
  }

  /**
   * GET /categories
   * Lấy danh sách categories với pagination
   */
  @Get()
  async list(@Query() query: CategoryListQueryDto): Promise<PaginatedCategoriesResponse> {
    return this.send<CategoryListQueryDto, PaginatedCategoriesResponse>(
      EVENTS.CATEGORY.LIST,
      query,
    );
  }

  /**
   * GET /categories/:id
   * Lấy chi tiết category theo ID (bao gồm children nếu có)
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<CategoryResponse> {
    return this.send<string, CategoryResponse>(EVENTS.CATEGORY.GET_BY_ID, id);
  }

  /**
   * GET /categories/slug/:slug
   * Lấy chi tiết category theo slug
   */
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<CategoryResponse> {
    return this.send<{ slug: string }, CategoryResponse>(EVENTS.CATEGORY.GET_BY_SLUG, { slug });
  }

  /**
   * POST /categories
   * Tạo category mới (admin only)
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CategoryCreateDto): Promise<CategoryResponse> {
    return this.send<CategoryCreateDto, CategoryResponse>(EVENTS.CATEGORY.CREATE, dto);
  }

  /**
   * PUT /categories/:id
   * Cập nhật category (admin only)
   */
  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() dto: CategoryUpdateDto): Promise<CategoryResponse> {
    return this.send<CategoryUpdateDto & { id: string }, CategoryResponse>(EVENTS.CATEGORY.UPDATE, {
      id,
      ...dto,
    });
  }

  /**
   * DELETE /categories/:id
   * Xóa category (admin only)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string): Promise<SuccessResponse> {
    return this.send<string, SuccessResponse>(EVENTS.CATEGORY.DELETE, id);
  }
}
