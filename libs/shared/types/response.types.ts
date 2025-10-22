/**
 * Common Response Types
 * Định nghĩa các response types chung cho toàn bộ API
 */

/**
 * Generic paginated response wrapper
 * Sử dụng cho các list endpoints với pagination
 */
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

/**
 * Success response cho các operation không trả về data
 * Ví dụ: delete, clear cart, v.v.
 */
export type SuccessResponse = {
  success: boolean;
  message?: string;
};

/**
 * Error response structure
 * Chuẩn hóa error responses từ API Gateway
 */
export type ErrorResponse = {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
};

/**
 * Generic list response (không có pagination)
 */
export type ListResponse<T> = {
  items: T[];
  total: number;
};
