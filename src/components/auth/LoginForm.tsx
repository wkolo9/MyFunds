import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PasswordInput } from '../ui/password-input';
import { loginCommandSchema, type LoginCommand } from '../../lib/validation/auth.validation';
import { useAuth } from './hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LoginForm() {
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCommand>({
    resolver: zodResolver(loginCommandSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginCommand) => {
    const result = await login(data);
    if (!result.success && result.error) {
      setError('root', {
        type: 'manual',
        message: result.error,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errors.root.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          disabled={isSubmitting}
          data-test-id="email-input"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isSubmitting}
          data-test-id="password-input"
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting} data-test-id="submit-login-button">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <a href="/auth/register" className="font-medium text-primary hover:underline">
          Sign up
        </a>
      </div>
    </form>
  );
}
