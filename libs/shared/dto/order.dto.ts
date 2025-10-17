export class OrderCreateDto {
  userId: string;
  addressId?: string;
  items: { productId: string; quantity: number; price: number }[];
}

export class OrderIdDto {
  id: string;
}

export class OrderListByUserDto {
  userId: string;
  page?: number;
  pageSize?: number;
}

export class OrderUpdateStatusDto {
  id: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';
}

export class OrderCancelDto {
  id: string;
  reason?: string;
}

export class OrderItemAddDto {
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export class OrderItemRemoveDto {
  id: string;
}

export class OrderItemListByOrderDto {
  orderId: string;
}
