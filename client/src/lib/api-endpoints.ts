// API endpoints configuration
const API_BASE_URL = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
    csrfToken: `${API_BASE_URL}/auth/csrf-token`,
  },
  users: {
    list: `${API_BASE_URL}/users`,
    create: `${API_BASE_URL}/users`,
    update: (id: number) => `${API_BASE_URL}/users/${id}`,
    delete: (id: number) => `${API_BASE_URL}/users/${id}`,
  },
  products: {
    list: `${API_BASE_URL}/products`,
    create: `${API_BASE_URL}/products`,
    update: (id: number) => `${API_BASE_URL}/products/${id}`,
    delete: (id: number) => `${API_BASE_URL}/products/${id}`,
    search: (query: string) => `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`,
  },
  categories: {
    list: `${API_BASE_URL}/categories`,
    create: `${API_BASE_URL}/categories`,
    update: (id: number) => `${API_BASE_URL}/categories/${id}`,
    delete: (id: number) => `${API_BASE_URL}/categories/${id}`,
  },
  customers: {
    list: `${API_BASE_URL}/customers`,
    create: `${API_BASE_URL}/customers`,
    update: (id: number) => `${API_BASE_URL}/customers/${id}`,
    delete: (id: number) => `${API_BASE_URL}/customers/${id}`,
  },
  suppliers: {
    list: `${API_BASE_URL}/suppliers`,
    create: `${API_BASE_URL}/suppliers`,
    update: (id: number) => `${API_BASE_URL}/suppliers/${id}`,
    delete: (id: number) => `${API_BASE_URL}/suppliers/${id}`,
    search: (query: string) => `${API_BASE_URL}/suppliers/search?q=${encodeURIComponent(query)}`,
  },
  productSuppliers: {
    list: `${API_BASE_URL}/product-suppliers`,
    create: `${API_BASE_URL}/product-suppliers`,
    update: (id: number) => `${API_BASE_URL}/product-suppliers/${id}`,
    delete: (id: number) => `${API_BASE_URL}/product-suppliers/${id}`,
  },
  purchaseOrders: {
    list: `${API_BASE_URL}/purchase-orders`,
    create: `${API_BASE_URL}/purchase-orders`,
    update: (id: number) => `${API_BASE_URL}/purchase-orders/${id}`,
    delete: (id: number) => `${API_BASE_URL}/purchase-orders/${id}`,
    items: (id: number) => `${API_BASE_URL}/purchase-orders/${id}/items`,
  },
  sales: {
    list: `${API_BASE_URL}/sales`,
    create: `${API_BASE_URL}/sales`,
    getById: (id: number) => `${API_BASE_URL}/sales/${id}`,
    getItems: (id: number) => `${API_BASE_URL}/sales/${id}/items`,
    sendWhatsAppReceipt: (id: number) => `${API_BASE_URL}/sales/${id}/receipt/whatsapp`,
    sendSMSReceipt: (id: number) => `${API_BASE_URL}/sales/${id}/receipt/sms`,
  },
  orders: {
    list: `${API_BASE_URL}/orders`,
    create: `${API_BASE_URL}/orders`,
    update: (id: number) => `${API_BASE_URL}/orders/${id}`,
    delete: (id: number) => `${API_BASE_URL}/orders/${id}`,
  },
  expenses: {
    list: `${API_BASE_URL}/expenses`,
    create: `${API_BASE_URL}/expenses`,
    update: (id: number) => `${API_BASE_URL}/expenses/${id}`,
    delete: (id: number) => `${API_BASE_URL}/expenses/${id}`,
  },
  reports: {
    inventory: `${API_BASE_URL}/reports/inventory`,
    productPerformance: `${API_BASE_URL}/reports/product-performance`,
    salesSummary: `${API_BASE_URL}/reports/sales-summary`,
  },
  loyalty: {
    points: (customerId: number) => `${API_BASE_URL}/customers/${customerId}/loyalty/points`,
    transactions: (customerId: number) =>
      `${API_BASE_URL}/customers/${customerId}/loyalty/transactions`,
    addPoints: `${API_BASE_URL}/loyalty/add-points`,
    redeemPoints: `${API_BASE_URL}/loyalty/redeem-points`,
  },
} as const;
