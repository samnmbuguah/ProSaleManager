// API endpoints configuration
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    me: "/auth/me",
    csrfToken: "/auth/csrf-token",
  },
  users: {
    list: "/users",
    create: "/users",
    update: (id: number) => `/users/${id}`,
    delete: (id: number) => `/users/${id}`,
  },
  products: {
    list: "/products",
    create: "/products",
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
    search: (query: string) =>
      `/products/search?query=${encodeURIComponent(query)}`,
  },
  categories: {
    list: "/categories",
    create: "/categories",
    update: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`,
  },
  customers: {
    list: "/customers",
    create: "/customers",
    update: (id: number) => `/customers/${id}`,
    delete: (id: number) => `/customers/${id}`,
  },
  sales: {
    list: "/sales",
    create: "/sales",
    getById: (id: number) => `/sales/${id}`,
    getItems: (id: number) => `/sales/${id}/items`,
    sendWhatsAppReceipt: (id: number) => `/sales/${id}/receipt/whatsapp`,
    sendSMSReceipt: (id: number) => `/sales/${id}/receipt/sms`,
  },
  orders: {
    list: "/orders",
    create: "/orders",
    update: (id: number) => `/orders/${id}`,
    delete: (id: number) => `/orders/${id}`,
  },
} as const;
