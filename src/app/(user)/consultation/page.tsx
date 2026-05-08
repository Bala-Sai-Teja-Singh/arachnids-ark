'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Zap, AlertTriangle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { LocalStorage } from '@/mock-db/storage';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import type { ConsultationSettings, ConsultationDuration, ConsultationUrgency, ConsultationSlot, ConsultationBooking } from '@/types';
import { formatPrice, calculateConsultationPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

const urgencyIcons = {
  normal: Clock,
  priority: Zap,
  emergency: AlertTriangle,
};

const urgencyColors = {
  normal: 'border-green-400/30 text-green-400 bg-green-400/5',
  priority: 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5',
  emergency: 'border-red-400/30 text-red-400 bg-red-400/5',
};

export default function ConsultationPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [settings, setSettings] = useState<ConsultationSettings | null>(null);
  const [duration, setDuration] = useState<ConsultationDuration>(0);
  const [urgency, setUrgency] = useState<ConsultationUrgency>('normal');
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = LocalStorage.getAll<ConsultationSettings>('consultation_settings');
    if (data.length > 0) {
      setSettings(data[0]);
      if (data[0].pricing.length > 0) {
        setDuration(data[0].pricing[0].duration);
      }
    }
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem('pending_consultation');
    if (pending && isAuthenticated && user) {
      try {
        const { duration: pDur, urgency: pUrg, query: pQuery } = JSON.parse(pending);
        setDuration(pDur);
        setUrgency(pUrg);
        setQuery(pQuery);
        setStep(2);
        localStorage.removeItem('pending_consultation');
        toast.success('Restored your consultation details!');
      } catch (e) {
        console.error('Failed to parse pending consultation', e);
      }
    }
  }, [isAuthenticated, user]);

  const selectedPricing = useMemo(() => {
    if (!settings) return null;
    return settings.pricing.find(p => p.duration === duration);
  }, [settings, duration]);

  const selectedMultiplier = useMemo(() => {
    if (!settings) return null;
    return settings.urgencyMultipliers.find(u => u.urgency === urgency);
  }, [settings, urgency]);

  const totalPrice = useMemo(() => {
    if (!selectedPricing || !selectedMultiplier) return 0;
    return calculateConsultationPrice(selectedPricing.basePrice, selectedMultiplier.multiplier);
  }, [selectedPricing, selectedMultiplier]);

  // Removed availableSlots memo as users no longer pick slots

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      localStorage.setItem('pending_consultation', JSON.stringify({
        duration, urgency, query
      }));
      toast.error('Please login to book a consultation');
      router.push('/login?redirect=/consultation');
      return;
    }
    const booking: ConsultationBooking = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      duration,
      urgency,
      slotId: '',
      slotDate: '',
      slotTime: '',
      query,
      basePrice: selectedPricing?.basePrice,
      multiplier: selectedMultiplier?.multiplier,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    LocalStorage.create('bookings', booking);

    addNotification({
      userId: user.id,
      title: 'Consultation Booked',
      message: `Your ${duration}-min ${urgency} consultation has been booked. Our team will assign a slot soon.`,
      type: 'success',
      link: '/dashboard/consultations',
    });

    // Notify Admin
    addNotification({
      userId: 'admin',
      title: 'New Consultation Booking',
      message: `${user.name} booked a ${duration}-min ${urgency} consultation.`,
      type: 'info',
      link: '/admin/bookings',
    });

    toast.success('Consultation booked successfully!');
    setSubmitting(false);
    router.push('/dashboard/consultations');
  };

  if (!settings) return <div className="container mx-auto px-4 py-8"><div className="h-96 animate-pulse bg-muted rounded-xl" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge variant="outline" className="border-brand-gold/30 text-brand-gold mb-4">
          <Calendar className="h-3 w-3 mr-2" />
          Book Consultation
        </Badge>
        <h1 className="text-3xl font-bold mb-2">
          Expert <span className="text-gradient">Consultation</span>
        </h1>
        <p className="text-muted-foreground">
          Get personalized guidance from experienced arachnid specialists
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-brand-red text-white' : 'bg-muted text-muted-foreground'
              }`}>
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 2 && <div className={`w-12 sm:w-24 h-0.5 ${step > s ? 'bg-brand-red' : 'bg-muted'}`} />}
          </div>
        ))}
        <div className="flex gap-4 ml-4 text-xs text-muted-foreground">
          <span>Details & Query</span>
          <span>Confirmation</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Duration & Urgency */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {/* Duration */}
            <Card className="border-border">
              <CardHeader><CardTitle className="text-lg">Select Duration <span className="text-red-500">*</span></CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={String(duration)} onValueChange={(v) => v && setDuration(Number(v) as ConsultationDuration)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {settings.pricing.map(p => (
                    <div key={p.duration}>
                      <RadioGroupItem value={String(p.duration)} id={`dur-${p.duration}`} className="peer sr-only" />
                      <Label htmlFor={`dur-${p.duration}`} className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 cursor-pointer hover:border-brand-gold/30 peer-data-[state=checked]:border-brand-gold peer-data-[state=checked]:bg-brand-gold/5 transition-all">
                        <Clock className="h-6 w-6 text-brand-gold" />
                        <span className="font-bold">{p.label}</span>
                        <span className="text-lg font-bold text-brand-gold">{formatPrice(p.basePrice)}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Urgency */}
            <Card className="border-border">
              <CardHeader><CardTitle className="text-lg">Select Urgency <span className="text-red-500">*</span></CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={urgency} onValueChange={(v) => v && setUrgency(v as ConsultationUrgency)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {settings.urgencyMultipliers.map(u => {
                    const Icon = urgencyIcons[u.urgency];
                    return (
                      <div key={u.urgency}>
                        <RadioGroupItem value={u.urgency} id={`urg-${u.urgency}`} className="peer sr-only" />
                        <Label htmlFor={`urg-${u.urgency}`} className={`flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 cursor-pointer hover:border-brand-gold/30 peer-data-[state=checked]:border-brand-gold peer-data-[state=checked]:bg-brand-gold/5 transition-all`}>
                          <Icon className="h-6 w-6" />
                          <span className="font-bold capitalize">{u.label}</span>
                          <span className="text-sm text-muted-foreground">{u.multiplier}x price</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Live Price */}
            <motion.div key={totalPrice} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-6 rounded-xl bg-gradient-to-r from-brand-red/10 to-brand-gold/10 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {duration} min × {selectedMultiplier?.multiplier}x ({selectedMultiplier?.label})
                  </p>
                </div>
                <motion.span key={totalPrice} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold text-brand-gold">
                  {formatPrice(totalPrice)}
                </motion.span>
              </div>
            </motion.div>

            <div className="space-y-2">
              <Label>Describe your query <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Tell us about what you need help with..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="bg-card border-border"
              />
            </div>

            <Button onClick={() => setStep(2)} className="w-full bg-brand-red hover:bg-brand-red-light text-white" size="lg">
              Next: Review Booking <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-lg">Booking Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{duration} minutes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Urgency</p>
                    <p className="font-medium capitalize">{urgency}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-brand-gold/20 bg-brand-gold/5">
                  <p className="text-sm font-medium mb-1">Schedule Info</p>
                  <p className="text-xs text-muted-foreground">
                    Admin will assign a date and time slot for your consultation once the booking is reviewed. You will receive a notification.
                  </p>
                </div>
                {query && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Query</p>
                    <p className="text-sm">{query}</p>
                  </div>
                )}
                <Separator className="bg-accent/50" />
                <div className="flex items-center justify-between p-4 rounded-lg bg-brand-gold/5 border border-brand-gold/20">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-brand-gold">{formatPrice(totalPrice)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-brand-red hover:bg-brand-red-light text-white"
                size="lg"
              >
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking...</> : 'Confirm Booking'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
