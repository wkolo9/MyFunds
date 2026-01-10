import { 
  type LoginCommand, 
  type RegisterCommand, 
  type ForgotPasswordCommand, 
  type ResetPasswordCommand 
} from '@/lib/validation/auth.validation';

export class AuthService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'An unexpected error occurred');
    }
    return response.json();
  }

  static async login(data: LoginCommand) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ session: any }>(response);
  }

  static async register(data: RegisterCommand) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ session: any }>(response);
  }

  static async forgotPassword(data: ForgotPasswordCommand) {
    // In a real app, this would be a fetch call.
    // Simulating API call for now as per previous placeholder logic
    // const response = await fetch('/api/auth/forgot-password', ...);
    
    // Mock implementation for current phase
    console.log('AuthService: Requesting password reset for', data.email);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }

  static async resetPassword(data: ResetPasswordCommand) {
    // In a real app, this would be a fetch call.
    // Mock implementation for current phase
    console.log('AuthService: Resetting password');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
}

