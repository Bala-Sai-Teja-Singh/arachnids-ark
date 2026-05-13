'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormBuilder, type FormFieldConfig } from '@/components/shared/organisms/form-builder';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().refine((val) => !val || /^\d{10}$/.test(val.replace(/\D/g, '')), {
    message: 'Mobile number must be exactly 10 digits',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { signup, isLoading, isAuthenticated, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'John Doe',
      leftIcon: <User className="h-4 w-4" />,
      required: true,
      gridSpan: 'col-span-2'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'you@example.com',
      leftIcon: <Mail className="h-4 w-4" />,
      required: true,
      gridSpan: 'col-span-2'
    },
    {
      name: 'phone',
      label: 'Mobile Number',
      type: 'tel',
      placeholder: '10-digit number',
      leftIcon: <Phone className="h-4 w-4" />,
      gridSpan: 'col-span-2'
    },
    {
      name: 'password',
      label: 'Password',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Min 6 characters',
      leftIcon: <Lock className="h-4 w-4" />,
      rightIcon: (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-brand-gold transition-colors">
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ),
      required: true,
      gridSpan: 'col-span-2'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Repeat your password',
      leftIcon: <Lock className="h-4 w-4" />,
      required: true,
      gridSpan: 'col-span-2'
    }
  ];

  const onSubmit = async (values: SignupFormValues) => {
    const result = await signup(values.name, values.email, values.password, values.phone || '');
    if (result.success) {
      toast.success('Account created successfully!');
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    } else {
      toast.error(result.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-background to-brand-gold/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(197, 150, 58, 0.05) 0%, transparent 50%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6 group">
            <div className="w-80 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="ArachnidsArk" className="w-full h-auto object-contain" />
            </div>
          </Link>
          <h1 className="vibe-heading text-2xl font-bold">Create Account</h1>
          <p className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mt-1 tracking-[0.2em]">Join the ArachnidsArk community</p>
        </div>

        <Card className="vibe-card border-border bg-card/40 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-8">
            <FormBuilder
              schema={signupSchema}
              fields={fields}
              onSubmit={onSubmit}
              isSubmitting={isLoading}
              submitAlignment="center"
              submitLabel="Create Account"
              className="space-y-6"
            />
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-0 flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account? <Link href={`/login${redirect ? `?redirect=${redirect}` : ''}`} className="text-brand-gold hover:underline font-bold transition-all hover:tracking-wide">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
