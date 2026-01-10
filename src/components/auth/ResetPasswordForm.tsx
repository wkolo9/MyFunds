import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { resetPasswordCommandSchema, type ResetPasswordCommand } from '../../lib/validation/auth.validation';
import { useAuth } from './hooks/useAuth';

export function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordCommand>({
    resolver: zodResolver(resetPasswordCommandSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordCommand) => {
    await resetPassword(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder="••••••••"
          {...register('confirmPassword')}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          'Set new password'
        )}
      </Button>
    </form>
  );
}
