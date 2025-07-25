import { api, API_ENDPOINTS } from "../lib/api";
import { User } from "../types/user";
import { toast } from "@/components/ui/use-toast";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface AuthResponse {
  success: boolean;
  data: User | null;
  authenticated: boolean;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const data = {
      email: credentials.email.trim(),
      password: credentials.password,
    };
    const response = await api.post<{ data: User }>(API_ENDPOINTS.auth.login, data);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const formattedData = {
      email: data.email.trim(),
      password: data.password,
      name: data.name.trim(),
    };
    const response = await api.post<{ data: User }>(API_ENDPOINTS.auth.register, formattedData);
    return response.data;
  },

  logout: async () => {
    await api.post(API_ENDPOINTS.auth.logout);
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get<AuthResponse>(API_ENDPOINTS.auth.me);
      return response.data.authenticated ? response.data.data : null;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        return null;
      }
      throw error;
    }
  },
};
