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
import { useCartStore } from '@/store/cart-store';
import { useFavoriteStore } from '@/store/favorite-store';
import { useReviewStore } from '@/store/review-store';
import { MessageSquare, Star, Send, Heart, ShoppingBag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<{ duration: number; quantity: number; label: string; basePrice: number; urgency: ConsultationUrgency; multiplier: number }[]>([]);
  const [localUrgencies, setLocalUrgencies] = useState<Record<number, ConsultationUrgency>>({});
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { toggleLike, isLiked } = useFavoriteStore();
  const { reviews, loadReviews, addReview, isLoading: reviewsLoading } = useReviewStore();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  useEffect(() => {
    loadReviews('consultation-general', 'consultation');
    if (user) {
      const orders = LocalStorage.getAll<any>('orders');
      const purchased = orders.some(
        (ord: any) => ord.userId === user.id && ord.items.some((item: any) => item.type === 'consultation') && ['payment_verified', 'order_shipped', 'order_completed'].includes(ord.status)
      );
      setHasPurchased(purchased);
    }
  }, [user, loadReviews]);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    const data = LocalStorage.getAll<ConsultationSettings>('consultation_settings');
    if (data.length > 0) {
      setSettings(data[0]);
    }
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem('pending_consultation');
    if (pending && isAuthenticated && user) {
      try {
        const { cart: pCart, query: pQuery } = JSON.parse(pending);
        setCart(pCart);
        setQuery(pQuery);
        setStep(2);
        localStorage.removeItem('pending_consultation');
        toast.success('Restored your consultation details!');
      } catch (e) {
        console.error('Failed to parse pending consultation', e);
      }
    }
  }, [isAuthenticated, user]);

  const totalMins = useMemo(() => cart.reduce((acc, item) => acc + (item.duration * item.quantity), 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((acc, item) => acc + (item.basePrice * item.multiplier * item.quantity), 0), [cart]);
  
  const updateCart = (dur: number, label: string, price: number, delta: number) => {
    const urgency = localUrgencies[dur] || 'normal';
    const multiplier = settings?.urgencyMultipliers.find(u => u.urgency === urgency)?.multiplier || 1;

    setCart(prev => {
      const existing = prev.find(item => item.duration === dur && item.urgency === urgency);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) return prev.filter(item => !(item.duration === dur && item.urgency === urgency));
        return prev.map(item => (item.duration === dur && item.urgency === urgency) ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { duration: dur, label, basePrice: price, quantity: 1, urgency, multiplier }];
      return prev;
    });
  };

  // Removed availableSlots memo as users no longer pick slots

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    cart.forEach(item => {
      addItem(null, 'consultation', {
        ...item,
        query: query || 'No query provided'
      });
    });

    toast.success('Consultation items added to cart!');
    router.push('/checkout');
  };

  if (!settings) return <div className="container mx-auto px-4 py-8"><div className="h-96 animate-pulse bg-muted rounded-xl" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge variant="outline" className="border-brand-gold/30 text-brand-gold mb-4">
          <Calendar className="h-3 w-3 mr-2" />
          Book Consultation
        </Badge>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Expert <span className="text-gradient">Consultation</span>
            </h1>
            <p className="text-muted-foreground">
              Get personalized guidance from experienced arachnid specialists
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => toggleLike('consultation-general', 'consultation')}
              className={`p-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 ${
                isLiked('consultation-general', 'consultation') 
                  ? 'bg-red-500 text-white border-red-400' 
                  : 'bg-black/60 text-white hover:bg-black/80'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked('consultation-general', 'consultation') ? 'fill-current' : ''}`} />
            </button>
            <Badge variant="outline" className="bg-black/50 border-white/20 text-white font-bold">
              Liked by others
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Talktime Explanation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-brand-gold/30 bg-brand-gold/5 mb-8 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="bg-brand-gold/10 p-6 flex items-center justify-center sm:w-24 shrink-0">
                <Clock className="h-8 w-8 text-brand-gold" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-brand-gold font-heading uppercase tracking-tight">Flexible "Talktime" Sessions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Experience a more personalized relationship with Harmanpreet through our <strong>Prepaid Session Model</strong>. Instead of rigid one-off appointments, your purchased time acts as a flexible balance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-2">
                      <Zap className="h-3 w-3 text-brand-gold" /> Use it Your Way
                    </p>
                    <p className="text-muted-foreground">Buy a block of time (e.g., 2 sessions = 120 mins) and use it for multiple quick check-ins or long deep-dives as needed.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-brand-gold" /> Simple Connection
                    </p>
                    <p className="text-muted-foreground">After payment, you&apos;ll receive instructions via email to connect directly and mutually decide on the best dates and times.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex flex-wrap items-center gap-y-4 gap-x-8 mb-12">
        {[
          { id: 1, label: 'Details & Query' },
          { id: 2, label: 'Confirmation' }
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                step >= s.id ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s.id ? <CheckCircle className="h-5 w-5" /> : s.id}
              </div>
              <span className={`text-sm font-bold transition-colors duration-500 ${
                step >= s.id ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div className={`w-12 sm:w-24 h-0.5 rounded-full transition-all duration-1000 ${
                step > s.id ? 'bg-brand-red' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Duration & Urgency */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {/* Duration & Cart */}
            <Card className="border-border">
              <CardHeader><CardTitle className="text-lg">Select Sessions <span className="text-red-500">*</span></CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {settings.pricing.map(p => {
                    const currentUrgency = localUrgencies[p.duration] || 'normal';
                    const activeItems = cart.filter(i => i.duration === p.duration);
                    const totalQty = activeItems.reduce((a, b) => a + b.quantity, 0);
                    
                    return (
                      <div key={p.duration} className={`flex flex-col gap-4 rounded-xl border-2 p-4 transition-all relative overflow-hidden group ${totalQty > 0 ? 'border-brand-gold bg-brand-gold/10' : 'border-border hover:border-brand-gold/50'}`}>
                        <div className="flex flex-col items-center gap-2">
                          <Clock className={`h-6 w-6 transition-colors ${totalQty > 0 ? 'text-brand-gold' : 'text-muted-foreground'}`} />
                          <div className="text-center">
                            <span className={`font-bold block transition-colors ${totalQty > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{p.label}</span>
                            <span className="text-lg font-bold text-brand-gold">{formatPrice(p.basePrice)}</span>
                          </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Set Urgency</Label>
                          <div className="flex gap-1">
                            {settings.urgencyMultipliers.map(u => {
                              const UIcon = urgencyIcons[u.urgency];
                              const isSelected = currentUrgency === u.urgency;
                              return (
                                <button
                                  key={u.urgency}
                                  onClick={() => setLocalUrgencies(prev => ({ ...prev, [p.duration]: u.urgency }))}
                                  className={`flex-1 flex flex-col items-center py-2 rounded-lg border transition-all ${isSelected ? 'bg-brand-gold text-white border-brand-gold' : 'bg-background/50 border-border text-muted-foreground hover:border-brand-gold/50'}`}
                                >
                                  <UIcon className="h-3 w-3 mb-1" />
                                  <span className="text-[8px] font-bold uppercase">{u.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-auto bg-background/50 rounded-lg border border-border p-1 w-full justify-between">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => updateCart(p.duration, p.label, p.basePrice, -1)}
                            disabled={!cart.find(i => i.duration === p.duration && i.urgency === currentUrgency)}
                            className="h-8 w-8 rounded-md"
                          >
                            -
                          </Button>
                          <div className="text-center">
                            <span className="font-bold text-sm block">{cart.find(i => i.duration === p.duration && i.urgency === currentUrgency)?.quantity || 0}</span>
                            <span className="text-[8px] text-muted-foreground uppercase">{currentUrgency}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => updateCart(p.duration, p.label, p.basePrice, 1)}
                            className="h-8 w-8 rounded-md hover:bg-brand-gold hover:text-white"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cart.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl border border-brand-gold/30 bg-brand-gold/5">
                    <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-3">Selected Sessions Summary</h4>
                    <div className="space-y-3">
                      {cart.map((item, idx) => (
                        <div key={`${item.duration}-${item.urgency}`} className="flex justify-between items-center text-sm">
                          <div className="space-y-0.5">
                            <span className="text-foreground font-medium">{item.label} × {item.quantity}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] h-4 px-1 ${urgencyColors[item.urgency]}`}>
                                {item.urgency}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{item.multiplier}x multiplier</span>
                            </div>
                          </div>
                          <span className="font-bold text-brand-gold">{formatPrice(item.basePrice * item.multiplier * item.quantity)}</span>
                        </div>
                      ))}
                      <Separator className="bg-brand-gold/20 my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>Total Amount</span>
                        <span className="text-brand-gold">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


             {/* Live Price Summary */}
             <motion.div key={totalPrice} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-6 rounded-xl bg-gradient-to-r from-brand-red/10 to-brand-gold/10 border border-border">
               <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm text-muted-foreground">Total Talktime</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalMins} <span className="text-sm font-normal text-muted-foreground">Minutes</span>
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <motion.span key={totalPrice} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-bold text-brand-gold">
                      {formatPrice(totalPrice)}
                    </motion.span>
                 </div>
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

            <Button 
               onClick={() => setStep(2)} 
               disabled={cart.length === 0}
               className="w-full bg-brand-red hover:bg-brand-red-light text-white" 
               size="lg"
             >
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
                    <p className="text-xs text-muted-foreground">Total Duration</p>
                    <p className="font-medium">{totalMins} minutes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                    <p className="font-medium">{cart.reduce((a, b) => a + b.quantity, 0)} sessions</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-brand-gold uppercase tracking-widest">Plan Details</p>
                  <div className="space-y-2">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-background/50 border border-border">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.label} × {item.quantity}</span>
                          <span className="text-[10px] text-muted-foreground">Urgency: {item.urgency}</span>
                        </div>
                        <span className="font-bold">{formatPrice(item.basePrice * item.multiplier * item.quantity)}</span>
                      </div>
                    ))}
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

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16 space-y-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2 font-heading uppercase tracking-wider">
            <MessageSquare className="h-6 w-6 text-brand-red" />
            Specialist Reviews
          </h2>
          <div className="flex items-center gap-1 bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
            <Star className="h-4 w-4 text-brand-gold fill-brand-gold" />
            <span className="text-sm font-bold text-brand-gold">
              {reviews.filter(r => r.status === 'approved').length > 0
                ? (reviews.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.rating, 0) / reviews.filter(r => r.status === 'approved').length).toFixed(1)
                : 'No reviews'
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-border bg-card/40 backdrop-blur-sm h-fit">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                {isAuthenticated && user && (
                  <Avatar className="h-8 w-8 border border-brand-red/30">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-brand-red text-white text-[10px]">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <h3 className="font-bold text-sm uppercase tracking-widest text-brand-gold">Share your experience</h3>
              </div>
              {isAuthenticated ? (
                hasPurchased ? (
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} className="hover:scale-110 transition-transform">
                          <Star className={`h-6 w-6 ${reviewRating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="How was your session with Harmanpreet?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-background/50 border-border"
                    />
                    <Button
                      className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold"
                      disabled={!reviewComment.trim() || submittingReview}
                      onClick={async () => {
                        setSubmittingReview(true);
                        await addReview({
                          targetId: 'consultation-general',
                          targetType: 'consultation',
                          userId: user!.id,
                          userName: user!.name,
                          userAvatar: user!.avatar,
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        toast.success('Review submitted for moderation!');
                        setReviewComment('');
                        setReviewRating(5);
                        setSubmittingReview(false);
                      }}
                    >
                      {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Post Review</>}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 px-2 bg-brand-gold/5 rounded-xl border border-brand-gold/20">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">Only verified clients who have completed a session can leave a review.</p>
                  </div>
                )
              ) : (
                <Button variant="outline" className="w-full border-border hover:bg-brand-gold/10" onClick={() => router.push('/login')}>Login to Review</Button>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {reviews.filter(r => r.status === 'approved').length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-accent/5">
                <p className="text-muted-foreground italic">No reviews yet. Be the first to share your feedback!</p>
              </div>
            ) : (
              reviews.filter(r => r.status === 'approved').map((review) => (
                <Card key={review.id} className="border-border bg-card/20 backdrop-blur-sm group hover:border-brand-gold/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10 border border-brand-red/30">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback className="bg-brand-red text-white">{review.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">{review.userName}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-3 w-3 ${review.rating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-[10px] text-muted-foreground italic">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-brand-gold/30 pl-4 bg-brand-gold/5 py-2 rounded-r-lg">
                      &quot;{review.comment}&quot;
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
