export class ProductCreateDto {
  sku: string;
  name: string;
  slug: string;
  price: number;
  stock?: number;
  description?: string;
  imageUrls?: string[];
  categoryId?: string;
  attributes?: any;
  model3dUrl?: string;
}

export class ProductUpdateDto {
  name?: string;
  slug?: string;
  price?: number;
  stock?: number;
  description?: string;
  imageUrls?: string[];
  categoryId?: string;
  attributes?: any;
  model3dUrl?: string;
}

export class ProductListQueryDto {
  page?: number;
  pageSize?: number;
  q?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class ProductIdDto {
  id: string;
}

export class ProductSlugDto {
  slug: string;
}

export class StockChangeDto {
  productId: string;
  quantity: number;
}
