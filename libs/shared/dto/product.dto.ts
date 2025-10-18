import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsArray,
  IsUrl,
  Min,
} from 'class-validator';

export class ProductCreateDto {
  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  attributes?: any;

  @IsOptional()
  @IsUrl()
  model3dUrl?: string;
}

export class ProductUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  attributes?: any;

  @IsOptional()
  @IsUrl()
  model3dUrl?: string;
}

export class ProductListQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pageSize?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

export class ProductIdDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class ProductSlugDto {
  @IsNotEmpty()
  @IsString()
  slug: string;
}

export class StockChangeDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
