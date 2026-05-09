'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, MapPin, Phone, User as UserIcon, CreditCard, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/constants/pricing';
import { LocalStorage } from '@/mock-db/storage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useNotificationStore } from '@/store/notification-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Order, Product, ProductSize, SystemSettings, ShippingRule } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [deliveryName, setDeliveryName] = useState(user?.name || '');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const [shippingSettings, setShippingSettings] = useState<SystemSettings['shippingSettings'] | null>(null);
  const [shippingCharge, setShippingCharge] = useState(0);

  const updateItemSize = useCartStore(state => state.updateItemSize);

  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      router.push('/shop');
    }

    const sysSettings = LocalStorage.getAll<SystemSettings>('system_settings');
    if (sysSettings.length > 0) {
      setShippingSettings(sysSettings[0].shippingSettings);
    }
  }, [items, router, isSubmitting]);

  useEffect(() => {
    if (!shippingSettings) return;

    // Count tarantulas in the cart
    const tarantulaCount = items.reduce((acc, item) => {
      const product = LocalStorage.getById<Product>('products', item.productId);
      if (product?.mainCategory === 'Tarantulas') {
        return acc + item.quantity;
      }
      return acc;
    }, 0);

    // Find applicable shipping rule
    const rule = shippingSettings.rules?.find(
      r => tarantulaCount >= r.minQuantity && tarantulaCount <= r.maxQuantity
    );

    setShippingCharge(rule ? rule.charge : 0);
  }, [items, shippingSettings]);

  useEffect(() => {
    // Load full product details for size switching
    const details: Record<string, Product> = {};
    items.forEach(item => {
      if (!productDetails[item.productId]) {
        const p = LocalStorage.getById<Product>('products', item.productId);
        if (p) details[item.productId] = p;
      }
    });
    if (Object.keys(details).length > 0) {
      setTimeout(() => {
        setProductDetails(prev => ({ ...prev, ...details }));
      }, 0);
    }
  }, [items]);

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setDeliveryName(user.name);
        setDeliveryPhone(user.phone || '');
      }, 0);
    }
  }, [user]);

  const handleSizeChange = (productId: string, oldSize: string, newSizeName: string) => {
    const product = productDetails[productId];
    if (!product) return;
    const newSize = product.sizes.find(s => s.size === newSizeName);
    if (newSize) {
      updateItemSize(productId, oldSize, newSize);
      toast.info(`Updated size for ${product.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast.error('Please login to place an order');
      router.push(`/login?redirect=/checkout`);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!deliveryName.trim()) newErrors.name = 'Full name is required';
    if (!deliveryPhone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else {
      const cleanPhone = deliveryPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        newErrors.phone = 'Mobile number must be at least 10 digits';
      }
    }
    if (!deliveryAddress.trim()) newErrors.address = 'Delivery address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const order: Order = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.name,
        productImage: item.image,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      })),
      status: 'pending',
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      shippingCharge,
      totalPrice: totalPrice() + shippingCharge,
      message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      LocalStorage.create('orders', order);

      // Trigger Email Notification
      const settingsData = LocalStorage.getAll<SystemSettings>('system_settings');
      const paymentDetails = settingsData.length > 0 ? {
        upiIds: settingsData[0].upiIds,
        bankDetails: settingsData[0].bankDetails,
        paymentInstructions: settingsData[0].paymentInstructions
      } : null;

      if (paymentDetails) {
        fetch('/api/emails/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order,
            paymentDetails,
            adminEmail: 'isopodsofindia@gmail.com'
          })
        }).catch(err => console.error('Failed to trigger email:', err));
      }

      // User Notification
      addNotification({
        userId: user.id,
        title: 'Order Placed Successfully',
        message: `Your order for ${items.length} item(s) has been placed. Check your email for payment instructions.`,
        type: 'success',
        link: '/dashboard/orders',
      });

      // Admin Notification
      addNotification({
        userId: 'admin',
        title: 'New Order Received',
        message: `${user.name} placed an order for ${items.length} item(s).`,
        type: 'order',
        link: '/admin/orders',
      });

      toast.success('Order placed! Please check your email for payment instructions.');
      clearCart();
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) return null;

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-[70vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-border"
        >
          <div className="h-20 w-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-brand-red" />
          </div>
          <h2 className="vibe-heading text-3xl font-bold">Order Received!</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              We have sent a confirmation email with **Payment Instructions** (UPI & Bank details) to your registered email address.
            </p>
            <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-bold uppercase tracking-widest">
              Please check your inbox & spam folder
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Reply to the email with your payment screenshot to complete the order.
            </p>
          </div>
          <div className="pt-6 flex flex-col gap-3">
            <Button onClick={() => router.push('/dashboard/orders')} className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold h-12 rounded-xl">
              View Order Status
            </Button>
            <Button variant="ghost" onClick={() => router.push('/shop')} className="w-full text-xs uppercase tracking-widest font-bold">
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <span className="hover:text-foreground cursor-pointer" onClick={() => router.push('/shop')}>Shop</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold font-heading mb-6 flex items-center gap-3">
              <ShoppingBag className="text-brand-red h-8 w-8" />
              Complete Your <span className="text-gradient-red">Order</span>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-accent/10 border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-brand-gold" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                      <Input
                        id="name"
                        value={deliveryName}
                        onChange={(e) => setDeliveryName(e.target.value)}
                        placeholder="John Doe"
                        className={errors.name ? 'border-red-500' : 'bg-background/50'}
                      />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={deliveryPhone}
                          onChange={(e) => setDeliveryPhone(e.target.value)}
                          placeholder="9876543210"
                          className={`pl-10 ${errors.phone ? 'border-red-500' : 'bg-background/50'}`}
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Shipping Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Street address, City, State, ZIP code"
                        className={`pl-10 min-h-[100px] ${errors.address ? 'border-red-500' : 'bg-background/50'}`}
                      />
                    </div>
                    {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Order Note (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Special instructions for delivery or seller..."
                      className="bg-background/50 min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-accent/10 border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-brand-gold" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-red/20 bg-brand-red/5">
                    <CheckCircle2 className="h-5 w-5 text-brand-red mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Payment via Email</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        We have received your order request! An automated email with our <strong>UPI and Bank Transfer</strong> details has been sent to your registered email address. 
                        Please reply to that email with your payment screenshot to confirm your order.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-accent/10 border-b border-border">
                <CardTitle className="text-lg font-heading tracking-tight uppercase text-xs">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex gap-3">
                      <div className="h-12 w-12 rounded bg-muted overflow-hidden border border-border flex-shrink-0">
                        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground italic truncate">{item.scientificName}</p>
                        <div className="flex justify-between items-center mt-1">
                          <Select
                            value={item.size}
                            onValueChange={(val) => handleSizeChange(item.productId, item.size, val || '')}
                          >
                            <SelectTrigger className="h-6 w-auto min-w-[70px] text-[10px] px-2 py-0 bg-accent/50 border-none font-bold uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-border">
                              {productDetails[item.productId]?.sizes.map((s, idx) => (
                                <SelectItem key={idx} value={s.size} className="text-[10px] uppercase font-bold">
                                  {s.size} - {formatPrice(s.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-[10px] text-muted-foreground ml-2 uppercase font-bold">× {item.quantity}</span>
                          <span className="text-xs font-bold text-brand-gold ml-auto">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-border" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items Subtotal</span>
                    <span>{formatPrice(totalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-brand-gold font-medium">{formatPrice(shippingCharge)}</span>
                  </div>
                  {shippingSettings?.disclaimer && (
                    <p className="text-[10px] text-muted-foreground italic leading-tight">
                      {shippingSettings.disclaimer}
                    </p>
                  )}
                  <Separator className="bg-border/50 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-heading font-black text-2xl text-brand-gold">{formatPrice(totalPrice() + shippingCharge)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold h-12 shadow-lg shadow-brand-red/20 mt-4"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order Request'}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground italic px-2">
                  By placing this order, you agree to our terms of service regarding live animal shipping.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
