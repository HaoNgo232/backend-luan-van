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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryListQueryDto,
} from '@shared/dto/category.dto';
import { AuthGuard } from '../auth/auth.guard';
import { EVENTS } from '@shared/events';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';

@Controller('categories')
export class CategoriesController {
  constructor(@Inject('PRODUCT_SERVICE') private readonly productService: ClientProxy) {}

  private async sendWithRetry<T>(pattern: string, data: unknown): Promise<T> {
    return firstValueFrom(
      this.productService.send<T>(pattern, data).pipe(
        timeout(5000),
        retry({ count: 1, delay: 1000 }),
        catchError(error => {
          throw new HttpException(
            error.message || 'Service communication failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  @Get()
  async list(@Query() query: CategoryListQueryDto) {
    return this.sendWithRetry(EVENTS.CATEGORY.LIST, query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.CATEGORY.GET_BY_ID, id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.sendWithRetry(EVENTS.CATEGORY.GET_BY_SLUG, { slug });
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CategoryCreateDto) {
    return this.sendWithRetry(EVENTS.CATEGORY.CREATE, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(@Param('id') id: string, @Body() dto: CategoryUpdateDto) {
    return this.sendWithRetry(EVENTS.CATEGORY.UPDATE, { id, ...dto });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string) {
    return this.sendWithRetry(EVENTS.CATEGORY.DELETE, id);
  }
}
