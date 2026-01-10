import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe('login', () => {
    it('should call the login endpoint and return session data on success', async () => {
      const mockResponse = { session: { access_token: 'fake-token' } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = { email: 'test@example.com', password: 'password123' };
      const result = await AuthService.login(data);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error on failure', async () => {
      const errorResponse = { error: 'Invalid credentials' };
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => errorResponse,
      });

      const data = { email: 'test@example.com', password: 'wrong' };

      await expect(AuthService.login(data)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should call the register endpoint and return session data', async () => {
      const mockResponse = { session: { access_token: 'fake-token' } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = { 
        email: 'new@example.com', 
        password: 'password123', 
        confirmPassword: 'password123' 
      };
      const result = await AuthService.register(data);

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockResponse);
    });
  });
});

