export class CartGetDto {
  sessionId: string;
}

export class CartAddItemDto {
  sessionId: string;
  productId: string;
  quantity?: number;
}

export class CartRemoveItemDto {
  sessionId: string;
  itemId: string;
}

export class CartClearDto {
  sessionId: string;
}

export class CartTransferToUserDto {
  sessionId: string;
  userId: string;
}
