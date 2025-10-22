/**
 * Cart Response Types
 * Định nghĩa các response types cho cart endpoints
 * Based on Cart và CartItem models trong cart-app Prisma schema
 */

/**
 * Cart item response
 */
export type CartItemResponse = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceInt: number; // Giá tại thời điểm thêm vào cart (cents) - match Prisma field name
  createdAt: Date;
  product?: {
    // Populated từ product-service
    id: string;
    sku: string;
    name: string;
    slug: string;
    priceInt: number;
    stock: number;
    imageUrls: string[];
  };
};

/**
 * Cart response với full details
 */
export type CartResponse = {
  id: string;
  userId: string | null;
  sessionId: string; // Match Prisma: sessionId là unique, không null
  items: CartItemResponse[];
  totalItems: number; // Computed field
  subtotalInt: number; // Computed field - Tổng tiền (cents)
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Cart summary cho quick view
 */
export type CartSummary = {
  totalItems: number;
  subtotalInt: number;
  itemCount: number;
};

/**
 * Transfer cart result
 */
export type TransferCartResponse = {
  success: boolean;
  cartId: string;
  itemsTransferred: number;
};
