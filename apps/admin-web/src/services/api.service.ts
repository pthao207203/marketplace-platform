// apps/admin-web/src/services/api.service.ts
import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace('/api', '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - không cần token trong dev mode
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - chỉ log error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("API returned 401 - but continuing anyway (dev mode)");
    }
    return Promise.reject(error);
  }
);

export default api;

// ===== Product Interfaces =====
export interface ProductFilters {
  priceType?: number;
  search?: string;
  status?: number;
  deleted?: boolean;
  dateFilter?: string;
  shop?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  quantity?: number;
  page?: number;
  pageSize?: number;
}

export interface Product {
  id: string;
  name: string;
  shop: string;
  shopId: string;
  category: string;
  quantity: number;
  price: number;
  status: number;
  deleted: number;
  created: string;
  priceType: number;
  priceTypeLabel: string;
  thumbnail?: string;
  auctionEndsAt?: string;
}

export interface ProductListResponse {
  success: boolean;
  data: {
    items: Product[];
    page: number;
    pageSize: number;
    total: number;
  };
}

// ===== API Functions =====

// GET Products (with filters)
export const getProducts = async (
  filters: ProductFilters
): Promise<ProductListResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await api.get(`/admin/products?${params.toString()}`);
  return response.data;
};

// GET Product by ID
export const getProductById = async (id: string) => {
  const response = await api.get(`/admin/products/${id}`);
  return response.data;
};

// GET Product Meta (categories, brands)
export const getProductMeta = async () => {
  const response = await api.get("/admin/products/meta");
  return response.data;
};

// CREATE Product
export const createProduct = async (productData: any) => {
  const response = await api.post("/admin/products", productData);
  return response.data;
};

// RESPOND to Negotiation
export const respondToNegotiation = async (
  negotiationId: string,
  action: "accept" | "reject"
) => {
  const response = await api.post(
    `/admin/products/negotiations/${negotiationId}/respond`,
    { action }
  );
  return response.data;
};

// ===== Order Interfaces =====
export interface OrderFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  creationDate: string;
  completionDate?: string;
  status: "Pending" | "Cancelled" | "Delivering" | "Delivered" | "Returned";
  totalPrice: number;
  totalItems: number;
  paymentStatus: "Paid" | "Unpaid";
  canConfirm: boolean;
}

export interface OrderListResponse {
  success: boolean;
  data: {
    items: Order[];
    page: number;
    pageSize: number;
    total: number;
  };
}

// ===== Order API Functions =====

// GET Orders (with filters)
export const getOrders = async (
  filters: OrderFilters
): Promise<OrderListResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await api.get(`/admin/orders?${params.toString()}`);
  return response.data;
};

// GET Order by ID
export const getOrderById = async (id: string) => {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data;
};

// UPDATE Order Status
export const updateOrderStatus = async (id: string, status: string) => {
  const response = await api.put(`/admin/orders/${id}/status`, { status });
  return response.data;
};

// CONFIRM Order (Accept)
export const confirmOrder = async (id: string) => {
  const response = await api.post(`/admin/orders/${id}/confirm`);
  return response.data;
};

// CANCEL Order
export const cancelOrder = async (id: string, reason?: string) => {
  const response = await api.post(`/admin/orders/${id}/cancel`, { reason });
  return response.data;
};
