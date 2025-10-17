export class ARSnapshotCreateDto {
  userId?: string;
  productId: string;
  imageUrl: string;
  metadata?: any;
}

export class ARSnapshotListDto {
  userId?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}
