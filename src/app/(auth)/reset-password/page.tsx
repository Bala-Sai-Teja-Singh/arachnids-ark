'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/shared/atoms/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/shared/atoms/input';
import { toast } from 'sonner';
import { LocalStorage } from '@/mock-db/storage';
import type { User } from '@/types';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid or missing reset token/email');
      router.push('/login');
    }
  }, [token, email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(r => setTimeout(r, 800));

      const users = LocalStorage.getAll<User>('users');
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('User not found');
      }

      // Update password in mock DB
      LocalStorage.update<User>('users', user.id, { password });
      
      toast.success('Password reset successfully! Please login with your new password.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-black tracking-tighter text-gradient uppercase">ArachnidsArk</span>
            </Link>
          </div>

          <Card className="glass border-border overflow-hidden">
            <CardHeader className="space-y-1 text-center bg-muted/20 border-b border-border/50 pb-8">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">
                Reset Password
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Secure your account with a strong new password
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">New Password</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-brand-gold transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 bg-muted/30 border-border/50 focus:border-brand-gold/50 transition-all rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Confirm Password</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-brand-gold transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 h-12 bg-muted/30 border-border/50 focus:border-brand-gold/50 transition-all rounded-xl"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-brand-red/20 transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-border/50 text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-brand-gold transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
