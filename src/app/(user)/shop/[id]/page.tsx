'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bug, Thermometer, Droplets, UtensilsCrossed, AlertTriangle, Heart, Share2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LocalStorage } from '@/mock-db/storage';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import type { Product, Inquiry } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useReviewStore } from '@/store/review-store';
import { Star, Send, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const careLevelColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  advanced: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  expert: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const temperamentColors: Record<string, string> = {
  docile: 'text-green-400',
  'semi-aggressive': 'text-yellow-400',
  aggressive: 'text-red-400',
  defensive: 'text-orange-400',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryName, setDeliveryName] = useState(user?.name || '');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number>(0);
  const { reviews, loadReviews, addReview, isLoading: reviewsLoading } = useReviewStore();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    if (user) {
      setDeliveryName(user.name);
      setDeliveryPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const p = LocalStorage.getById<Product>('products', params.id as string);
    setProduct(p);
    setLoading(false);
    loadReviews(params.id as string);

    if (user && p) {
      const inquiries = LocalStorage.getAll<Inquiry>('inquiries');
      const purchased = inquiries.some(
        (inq) => inq.userId === user.id && inq.productId === p.id && inq.status === 'completed'
      );
      setHasPurchased(purchased);
    }
  }, [params.id, loadReviews, user]);

  useEffect(() => {
    const pending = localStorage.getItem('pending_inquiry');
    if (pending && isAuthenticated && user && product) {
      try {
        const { productId, message: pMsg, quantity: pQty, selectedSize: pSize } = JSON.parse(pending);
        if (productId === product.id) {
          setMessage(pMsg);
          setQuantity(pQty);
          setSelectedSize(pSize);
          setInquiryOpen(true);
          localStorage.removeItem('pending_inquiry');
          toast.success('Restored your pending inquiry!');
        }
      } catch (e) {
        console.error('Failed to parse pending inquiry', e);
      }
    }
  }, [isAuthenticated, user, product, params.id]);

  const currentPrice = product?.sizes?.[selectedSize]?.price || 0;

  const handleInquiry = () => {
    if (!isAuthenticated || !user || !product) {
      // Save pending inquiry state
      localStorage.setItem('pending_inquiry', JSON.stringify({
        productId: product?.id,
        message,
        quantity,
        selectedSize
      }));
      toast.error('Please login to place an order request');
      router.push(`/login?redirect=/shop/${params.id}`);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!deliveryName.trim()) newErrors.name = 'Full name is required';
    if (!deliveryPhone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(deliveryPhone.replace(/\s/g, ''))) {
      newErrors.phone = 'Mobile number must be exactly 10 digits';
    }
    if (!deliveryAddress.trim()) newErrors.address = 'Delivery address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const inquiry: Inquiry = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      productId: product.id,
      productName: product.name,
      quantity,
      status: 'pending',
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      totalPrice: currentPrice * quantity,
      message: `${message}${product.sizes ? `\nSize: ${product.sizes[selectedSize].size}` : ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    LocalStorage.create('inquiries', inquiry);
    addNotification({
      userId: user.id,
      title: 'Order Request Submitted',
      message: `Your order request for ${product.name} has been submitted successfully.`,
      type: 'success',
      link: '/dashboard/inquiries',
    });

    // Notify Admin
    addNotification({
      userId: 'admin',
      title: 'New Order Request Received',
      message: `${user.name} placed an order request for ${product.name}.`,
      type: 'info',
      link: '/admin/inquiries',
    });
    toast.success('Order request submitted successfully!');
    setInquiryOpen(false);
    setMessage('');
    setQuantity(1);
    setDeliveryAddress('');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 bg-muted rounded" />
              <div className="h-6 w-1/2 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link href="/shop"><Button>Back to Shop</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="aspect-square rounded-xl bg-gradient-to-br from-brand-red/20 via-background to-brand-gold/10 relative overflow-hidden border border-border group">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Bug className="h-32 w-32 text-brand-red/20" />
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge className={careLevelColors[product.careLevel]}>
                {product.careLevel}
              </Badge>
            </div>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImage === idx ? 'border-brand-gold' : 'border-border hover:border-brand-gold/50'
                    }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div>
            <div className="flex gap-2 mb-3">
              <Badge variant="outline" className="border-white/30 bg-black/50 text-white text-xs capitalize backdrop-blur-sm">{product.category}</Badge>
              <Badge variant="outline" className="border-brand-gold/40 bg-brand-gold/10 text-brand-gold text-xs capitalize backdrop-blur-sm">{product.origin.replace('-', ' ')}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-1">{product.name}</h1>
            <p className="text-lg text-muted-foreground italic">{product.scientificName}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-brand-gold">{formatPrice(currentPrice)}</span>
            <Badge className={(product.sizes?.[selectedSize]?.stock || 0) > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
              {(product.sizes?.[selectedSize]?.stock || 0) > 0 
                ? `${product.sizes?.[selectedSize]?.stock} in stock` 
                : 'Out of stock'}
            </Badge>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Size</Label>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map((s, idx) => (
                  <Button
                    key={idx}
                    variant={selectedSize === idx ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(idx)}
                    className={selectedSize === idx ? 'bg-brand-gold text-black hover:bg-brand-gold/90' : 'border-border'}
                  >
                    {s.size} - {formatPrice(s.price)} 
                    <span className="ml-2 opacity-60 text-[10px]">({s.stock} available)</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator className="bg-accent/50" />

          {/* Specs Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Thermometer className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="text-sm font-medium">{product.temperature}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="text-sm font-medium">{product.humidity}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Feeding</p>
                  <p className="text-sm font-medium">{product.feeding}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temperament</p>
                  <p className={`text-sm font-medium ${temperamentColors[product.temperament]}`}>{product.temperament}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
              <DialogTrigger render={<Button size="lg" className="flex-1 bg-brand-red hover:bg-brand-red-light text-white" disabled={(product.sizes?.[selectedSize]?.stock || 0) === 0 || product.available === false} />}>
                <MessageSquare className="mr-2 h-4 w-4" /> 
                {product.available === false ? 'Unavailable' : 'Order Request'}
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle>Order Request - {product.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-sm">Price per unit</span>
                    <span className="font-bold text-brand-gold">{formatPrice(currentPrice)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={product.sizes?.[selectedSize]?.stock || 0}
                      value={quantity}
                      onChange={(e) => {
                        const maxStock = product.sizes?.[selectedSize]?.stock || 0;
                        setQuantity(Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1)));
                      }}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-brand-gold/5 border border-brand-gold/20">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-lg font-bold text-brand-gold">{formatPrice(currentPrice * quantity)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={deliveryName}
                        onChange={(e) => {
                          setDeliveryName(e.target.value);
                          if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Recipient Name"
                        className={`bg-background/50 ${errors.name ? 'border-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile Number <span className="text-red-500">*</span></Label>
                      <Input
                        value={deliveryPhone}
                        onChange={(e) => {
                          setDeliveryPhone(e.target.value);
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        placeholder="10-digit number"
                        className={`bg-background/50 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                      {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Address <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="Street, City, State, ZIP Code"
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      className={`bg-background/50 ${errors.address ? 'border-red-500' : ''}`}
                      rows={2}
                    />
                    {errors.address && <p className="text-[10px] text-red-500 font-medium">{errors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Message (optional)</Label>
                    <Textarea
                      placeholder="Any specific requirements or questions..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-background/50"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInquiryOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleInquiry}
                    className="bg-brand-red hover:bg-brand-red-light text-white"
                    disabled={!deliveryName || !deliveryPhone || !deliveryAddress}
                  >
                    Submit Inquiry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="lg" variant="outline" className="border-border">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-16 space-y-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-brand-red" />
            Customer Reviews
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
          {/* Review Form */}
          <Card className="lg:col-span-1 border-border bg-card/50 h-fit">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Write a Review</h3>
              {isAuthenticated ? (
                hasPurchased ? (
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${reviewRating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-comment">Your Feedback</Label>
                      <Textarea
                        id="review-comment"
                        placeholder="Share your experience with this species..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <Button
                      className="w-full bg-brand-red hover:bg-brand-red-light text-white"
                      disabled={!reviewComment.trim() || submittingReview}
                      onClick={async () => {
                        if (!user || !product) return;
                        setSubmittingReview(true);
                        await addReview({
                          productId: product.id,
                          userId: user.id,
                          userName: user.name,
                          userAvatar: user.avatar,
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        toast.success('Review submitted for moderation!');
                        setReviewComment('');
                        setReviewRating(5);
                        setSubmittingReview(false);
                      }}
                    >
                      {submittingReview ? 'Submitting...' : <><Send className="mr-2 h-4 w-4" /> Post Review</>}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center italic">
                      Your review will be visible after admin approval.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-sm text-muted-foreground">Only customers who have purchased this product can leave a review.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Please login to share your thoughts.</p>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="w-full">Login Now</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.filter(r => r.status === 'approved').length === 0 ? (
              <div className="text-center py-12 bg-accent/10 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">No approved reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.filter(r => r.status === 'approved').map((review) => (
                <Card key={review.id} className="border-border bg-card/30 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback className="bg-brand-red text-white">
                            {review.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{review.userName}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${review.rating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{review.comment}"
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
