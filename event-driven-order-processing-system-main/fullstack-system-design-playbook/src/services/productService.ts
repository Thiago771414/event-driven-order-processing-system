import type {
  Product,
  ProductId,
  ProductListQuery,
  ProductListResponse,
} from '../types/product';
import { apiRequest } from './apiClient';

export const productService = {
  async listProducts(query: ProductListQuery = {}): Promise<ProductListResponse> {
    const params = new URLSearchParams();

    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));

    const suffix = params.size > 0 ? `?${params.toString()}` : '';

    // MiniShop currently focuses on orders. This contract shows where a
    // product API extension would live without leaking transport details to UI.
    return apiRequest<ProductListResponse>(`/products${suffix}`);
  },

  async getProductById(productId: ProductId): Promise<Product> {
    return apiRequest<Product>(`/products/${productId}`);
  },
};
