import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
}

interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'user';
  };
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    useAuth.getState().setUser(response.data.user);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    useAuth.getState().setUser(response.data.user);
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    useAuth.getState().logout();
  },

  checkSession: async () => {
    try {
      const response = await api.get<AuthResponse>("/auth/me");
      useAuth.getState().setUser(response.data.user);
      return response.data;
    } catch (error) {
      useAuth.getState().logout();
      throw error;
    }
  },
}; 