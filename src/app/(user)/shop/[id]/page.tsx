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
  }, [params.id]);

  const handleInquiry = () => {
    if (!isAuthenticated || !user || !product) {
      toast.error('Please login to raise an inquiry');
      router.push('/login');
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
      message,
      quantity,
      status: 'pending',
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      totalPrice: product.price * quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    LocalStorage.create('inquiries', inquiry);
    addNotification({
      userId: user.id,
      title: 'Inquiry Submitted',
      message: `Your inquiry for ${product.name} has been submitted successfully.`,
      type: 'success',
    });
    
    // Notify Admin
    addNotification({
      userId: 'admin',
      title: 'New Inquiry Received',
      message: `${user.name} raised an inquiry for ${product.name}.`,
      type: 'info',
    });
    toast.success('Inquiry submitted successfully!');
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
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === idx ? 'border-brand-gold' : 'border-border hover:border-brand-gold/50'
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
            <span className="text-3xl font-bold text-brand-gold">{formatPrice(product.price)}</span>
            <Badge className={product.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Badge>
          </div>

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
              <DialogTrigger render={<Button size="lg" className="flex-1 bg-brand-red hover:bg-brand-red-light text-white" disabled={product.stock === 0} />}>
                <MessageSquare className="mr-2 h-4 w-4" /> Raise Inquiry
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle>Raise Inquiry - {product.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <span className="text-sm">Price per unit</span>
                    <span className="font-bold text-brand-gold">{formatPrice(product.price)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-brand-gold/5 border border-brand-gold/20">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-lg font-bold text-brand-gold">{formatPrice(product.price * quantity)}</span>
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
    </div>
  );
}
