import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/authService'
import { User } from '../types/user'

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null })
          const response = await authService.login(credentials)
          set({ user: response.data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          })
          throw error
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null })
          const response = await authService.register(data)
          set({ user: response.data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Registration failed',
            isLoading: false
          })
          throw error
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null })
          await authService.logout()
          set({ user: null, isAuthenticated: false, isLoading: false })
        } catch (error) {
          // Even if the server request fails, clear the local state
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            isLoading: false
          })
          throw error
        }
      },

      checkSession: async () => {
        try {
          set({ isLoading: true, error: null })
          const user = await authService.getCurrentUser()

          // If we get a user back, update the state
          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } else {
            // If no user is returned, clear the state
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            })
          }
        } catch (error) {
          // Handle 401 errors silently (just clear the state)
          if (error instanceof Error && error.message.includes('401')) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            })
          } else {
            // For other errors, set the error state
            set({
              user: null,
              isAuthenticated: false,
              error:
                error instanceof Error ? error.message : 'Session check failed',
              isLoading: false
            })
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          return {
            ...(persistedState as any),
            version: 1
          }
        }
        return persistedState
      }
    }
  )
)
