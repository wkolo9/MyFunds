import { useState } from 'react';
import { toast } from 'sonner';
import { AuthService } from '@/lib/services/auth.service';
import { supabase } from '@/lib/utils/client-auth';
import type { 
  LoginCommand, 
  RegisterCommand, 
  ForgotPasswordCommand, 
  ResetPasswordCommand 
} from '@/lib/validation/auth.validation';

export function useAuth() {
  const login = async (data: LoginCommand) => {
    try {
      const response = await AuthService.login(data);
      if (response.session) {
        await supabase.auth.setSession(response.session);
      }
      toast.success('Logged in successfully');
      window.location.href = '/';
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid email or password';
      toast.error(message);
      console.error(error);
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterCommand) => {
    try {
      const response = await AuthService.register(data);
      if (response.session) {
        await supabase.auth.setSession(response.session);
      }
      toast.success('Account created successfully');
      window.location.href = '/';
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(message);
      console.error(error);
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (data: ForgotPasswordCommand) => {
    try {
      await AuthService.forgotPassword(data);
      return { success: true };
    } catch (error) {
      const message = 'Failed to send reset link';
      toast.error(message);
      console.error(error);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (data: ResetPasswordCommand) => {
    try {
      await AuthService.resetPassword(data);
      toast.success('Password has been reset successfully');
      window.location.href = '/auth/login';
      return { success: true };
    } catch (error) {
      const message = 'Failed to reset password';
      toast.error(message);
      console.error(error);
      return { success: false, error: message };
    }
  };

  return {
    login,
    register,
    forgotPassword,
    resetPassword,
  };
}
