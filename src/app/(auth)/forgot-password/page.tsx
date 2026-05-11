'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/shared/atoms/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/shared/atoms/input';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to send reset link');
      
      setIsSuccess(true);
      toast.success('Reset link sent to your email');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
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
              <div className="mx-auto w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center mb-4">
                {isSuccess ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Mail className="h-6 w-6 text-brand-gold" />}
              </div>
              <CardTitle className="text-2xl font-bold uppercase tracking-tight">
                {isSuccess ? 'Check your email' : 'Forgot Password?'}
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                {isSuccess 
                  ? "We've sent a password reset link to your email." 
                  : "Enter your email address and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Email Address</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-brand-gold transition-colors" />
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10 h-12 bg-muted/30 border-border/50 focus:border-brand-gold/50 transition-all rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
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
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setIsSuccess(false)}
                    className="text-brand-gold hover:text-brand-gold hover:bg-brand-gold/5 font-bold uppercase tracking-widest text-xs"
                  >
                    Try another email
                  </Button>
                </div>
              )}

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
