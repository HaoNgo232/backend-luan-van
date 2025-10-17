export class CategoryCreateDto {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export class CategoryUpdateDto {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
}

export class CategoryIdDto {
  id: string;
}

export class CategorySlugDto {
  slug: string;
}

export class CategoryListQueryDto {
  page?: number;
  pageSize?: number;
  q?: string;
  parentSlug?: string;
}
