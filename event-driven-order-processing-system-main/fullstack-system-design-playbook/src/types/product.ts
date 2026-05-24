export type ProductId = string;

export interface Money {
  amount: number;
  currency: 'BRL' | 'USD' | string;
}

export type ProductAvailability =
  | 'available'
  | 'out_of_stock'
  | 'discontinued'
  | 'unknown';

export interface Product {
  id: ProductId;
  sku: string;
  name: string;
  description?: string;
  price: Money;
  imageUrl?: string;
  availability: ProductAvailability;
  updatedAt: string;
}

export interface ProductListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}
