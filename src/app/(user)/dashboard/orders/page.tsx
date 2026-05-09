'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, Upload, Package, ChevronDown, ChevronUp, Check, Copy, Truck, MapPin, Phone, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { LocalStorage } from '@/mock-db/storage';
import type { Order, SystemSettings } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function MyOrdersPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [selectedUPI, setSelectedUPI] = useState<string>('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [copiedUPI, setCopiedUPI] = useState(false);

  useEffect(() => {
    if (!user) return;
    const data = LocalStorage.getAll<Order>('orders')
      .filter(o => o.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTimeout(() => {
      setOrders(data);
    }, 0);

    const settingsData = LocalStorage.getAll<SystemSettings>('system_settings');
    if (settingsData.length > 0) {
      setSystemSettings(settingsData[0]);
      const defaultUPI = settingsData[0].upiIds.find(u => u.isDefault) || settingsData[0].upiIds[0];
      if (defaultUPI) setSelectedUPI(defaultUPI.value);
    }

    // Auto-expand if ID is in search params
    const orderId = searchParams.get('id');
    if (orderId) {
      setExpandedOrders(new Set([orderId]));
      // Scroll to the order element after a small delay
      setTimeout(() => {
        const el = document.getElementById(`order-${orderId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [user, searchParams]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOrders(newExpanded);
  };

  const handleUploadScreenshot = (id: string) => {
    if (!selectedFile) {
      setUploadError('Please select a payment screenshot to upload');
      return;
    }
    setUploadError(null);
    LocalStorage.update<Order>('orders', id, {
      paymentScreenshot: 'payment_screenshot_uploaded.jpg',
      status: 'payment_uploaded',
    });
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, paymentScreenshot: 'payment_screenshot_uploaded.jpg', status: 'payment_uploaded' } : o
    ));

    // Notify Admin
    import('@/store/notification-store').then(m => {
      m.useNotificationStore.getState().addNotification({
        userId: 'admin',
        title: 'Order Payment Received',
        message: `${user?.name} uploaded a payment screenshot for an order.`,
        type: 'payment',
        link: `/admin/orders?id=${id}`,
      });
    });

    toast.success('Payment screenshot uploaded successfully!');
    setUploadId(null);
    setSelectedFile(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="vibe-heading text-2xl font-bold mb-1">My Orders</h1>
        <p className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Track your order status and details</p>
      </motion.div>

      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders yet" description="Browse our shop and start adding exotic species to your cart!" />
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const isExpanded = expandedOrders.has(order.id);
            return (
              <motion.div 
                key={order.id} 
                id={`order-${order.id}`}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                              <Package className="h-5 w-5 text-brand-red" />
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider">Order #{order.id.split('-')[0]}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-red uppercase tracking-wider bg-brand-red/10 px-3 py-1 rounded-full w-fit">
                              Check Email for Updates
                            </div>
                          )}
                        </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Amount</p>
                          <p className="text-lg font-bold text-brand-gold leading-none">{formatPrice(order.totalPrice)}</p>
                        </div>
                        <StatusBadge status={order.status} />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleExpand(order.id)}
                          className="text-muted-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Order Details (Expanded) */}
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border bg-accent/5 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Items List */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Items in Order</h4>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                  <div className="h-10 w-10 rounded border border-border bg-muted overflow-hidden flex-shrink-0">
                                    {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase truncate">{item.productName}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.size} × {item.quantity}</p>
                                  </div>
                                  <p className="text-xs font-bold text-brand-gold">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Info */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Delivery Details</h4>
                            <div className="text-xs space-y-1">
                              <p><span className="text-muted-foreground">Recipient:</span> {order.deliveryName}</p>
                              <p><span className="text-muted-foreground">Phone:</span> {order.deliveryPhone}</p>
                              <p><span className="text-muted-foreground">Address:</span> {order.deliveryAddress}</p>
                              {order.message && (
                                <p className="mt-2 p-2 bg-background/50 rounded border border-border italic">
                                  &quot;{order.message}&quot;
                                </p>
                              )}
                            </div>
                            {order.adminNote && (
                              <div className="p-2 bg-brand-gold/10 border border-brand-gold/20 rounded text-xs text-brand-gold">
                                <span className="font-bold">Admin Note:</span> {order.adminNote}
                              </div>
                            )}

                            {(order.trackingId || order.courierPartner) && (
                              <div className="p-3 bg-accent/20 border border-border rounded-xl space-y-2 mt-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-brand-gold uppercase tracking-widest">
                                  <Truck className="h-4 w-4" /> Shipping Updates
                                </div>
                                <div className="text-[11px] space-y-1 pl-6">
                                  {order.courierPartner && <p><span className="text-muted-foreground uppercase tracking-tighter mr-2">Courier:</span> {order.courierPartner}</p>}
                                  {order.trackingId && <p><span className="text-muted-foreground uppercase tracking-tighter mr-2">Tracking ID:</span> <span className="font-mono text-brand-gold">{order.trackingId}</span></p>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end pt-2">
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <div className="p-3 px-5 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex flex-col items-end gap-1">
                              <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">
                                {order.status === 'awaiting_payment' ? 'Payment Required' : 'Order in Progress'}
                              </p>
                              <p className="text-[9px] text-muted-foreground italic">
                                Please check your email for payment instructions and further updates.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Status Guide */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="mt-12 p-6 rounded-2xl bg-accent/5 border border-border"
      >
        <h3 className="font-heading text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-brand-gold" />
          Understanding Order Statuses
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-tighter">Pending</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Order request sent. Awaiting admin approval to proceed to payment.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Awaiting Payment</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Check your email for payment details. Reply to that email with your payment screenshot.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">Payment Verification</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Admin is verifying your payment screenshot received via email.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Confirmed / Confirmed</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Payment verified! Your order is being packed and prepared for safe transit.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-brand-gold uppercase tracking-tighter">Completed / Shipped</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Your order has been shipped. You can find the Tracking ID and Courier details in the order info.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Cancelled / Rejected</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">The order was not processed. This can happen due to stock issues or payment verification failure.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
