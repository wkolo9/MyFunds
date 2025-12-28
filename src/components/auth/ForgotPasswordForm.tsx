import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { forgotPasswordCommandSchema, type ForgotPasswordCommand } from '../../lib/validation/auth.validation';

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordCommand>({
    resolver: zodResolver(forgotPasswordCommandSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordCommand) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual forgot password logic
      console.log('Forgot password data:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      setIsSuccess(true);
    } catch (error) {
      toast.error('Failed to send reset link');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center space-y-4 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="rounded-full bg-green-500/10 p-3 text-green-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We have sent a password reset link to your email address.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => window.location.href = '/auth/login'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending link...
          </>
        ) : (
          'Send reset link'
        )}
      </Button>

      <div className="text-center text-sm">
        <a href="/auth/login" className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign in
        </a>
      </div>
    </form>
  );
}

