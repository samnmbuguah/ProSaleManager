import { api, setAuthToken, initAuth, onAuthError } from '../api';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => ({
      ...mockAxios,
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    })),
  };
  return mockAxios;
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setAuthToken', () => {
    it('should set auth token in header and secure store', async () => {
      const token = 'test-token-123';
      await setAuthToken(token);

      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', token);
    });

    it('should remove auth token when token is null', async () => {
      await setAuthToken(null);

      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('initAuth', () => {
    it('should load token from secure store and set it', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('existing-token');

      await initAuth();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer existing-token');
    });

    it('should not set token if none exists in secure store', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await initAuth();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('onAuthError', () => {
    it('should register callback and return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = onAuthError(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});
