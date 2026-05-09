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
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-brand-red" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Order #{order.id.split('-')[0]}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
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
                          {order.status === 'awaiting_payment' && (
                            <Dialog open={uploadId === order.id} onOpenChange={(open) => {
                              setUploadId(open ? order.id : null);
                              if (!open) {
                                setSelectedFile(null);
                                setUploadError(null);
                              }
                            }}>
                              <DialogTrigger render={<Button size="sm" className="bg-brand-gold hover:bg-brand-gold-light text-white font-bold px-6" />}>
                                Complete Payment
                              </DialogTrigger>
                              <DialogContent className="glass border-border">
                                <DialogHeader><DialogTitle>Complete Your Payment</DialogTitle></DialogHeader>
                                <div className="py-4 space-y-6">
                                  <div className="bg-background/50 border border-border p-4 rounded-lg space-y-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Select UPI ID</Label>
                                      {systemSettings && systemSettings.upiIds.length > 0 ? (
                                        <Select value={selectedUPI} onValueChange={(val) => setSelectedUPI(val ?? '')}>
                                          <SelectTrigger className="w-full bg-background/50">
                                            <SelectValue placeholder="Select UPI ID" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {systemSettings.upiIds.map((upi) => (
                                              <SelectItem key={upi.id} value={upi.value}>
                                                {upi.label} ({upi.value})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <p className="font-mono text-sm bg-muted/50 p-2 rounded border border-border select-all">payments@arachnidsark</p>
                                      )}
                                      {selectedUPI && (
                                        <div 
                                          onClick={() => handleCopy(selectedUPI)}
                                          className={`mt-2 p-2 rounded border transition-all duration-300 flex items-center justify-between cursor-pointer group ${copiedUPI ? 'bg-green-500/10 border-green-500/50' : 'bg-muted/30 border-border hover:bg-muted/50'}`}
                                        >
                                          <span className="font-mono text-sm select-all">{selectedUPI}</span>
                                          <div className="flex items-center gap-1.5">
                                            {copiedUPI ? (
                                              <>
                                                <Check className="h-3 w-3 text-green-500" />
                                                <span className="text-[10px] text-green-500 uppercase tracking-widest font-black">Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="h-3 w-3 text-muted-foreground group-hover:text-brand-gold transition-colors" />
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-brand-gold transition-colors">Copy</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-1 mt-2 border-t border-border pt-3">
                                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Bank Transfer Details</p>
                                      <div className="font-mono text-xs bg-muted/50 p-2 rounded border border-border space-y-1">
                                        {systemSettings?.bankDetails ? (
                                          <pre className="whitespace-pre-wrap font-mono">{systemSettings.bankDetails}</pre>
                                        ) : (
                                          <>
                                            <p>Bank: HDFC Bank</p>
                                            <p>Account Name: ArachnidsArk Pvt Ltd</p>
                                            <p>A/C Number: <span className="select-all">50200001234567</span></p>
                                            <p>IFSC: <span className="select-all">HDFC0001234</span></p>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-brand-gold italic">
                                      {systemSettings?.paymentInstructions || `Please include your order ID (${order.id.split('-')[0]}) in the transfer remarks.`}
                                    </p>
                                  </div>

                                  <div className="space-y-2 border-t border-border pt-4">
                                    <Label className="text-xs uppercase tracking-widest">Upload Payment Screenshot</Label>
                                    <Input 
                                      type="file" 
                                      accept="image/*" 
                                      className={`bg-background/50 cursor-pointer ${uploadError ? 'border-red-500' : ''}`}
                                      onChange={(e) => {
                                        setSelectedFile(e.target.files?.[0] || null);
                                        setUploadError(null);
                                      }}
                                    />
                                    {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}
                                    <p className="text-[10px] text-muted-foreground">Upload a screenshot of your successful transaction for verification.</p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setUploadId(null)}>Cancel</Button>
                                  <Button onClick={() => handleUploadScreenshot(order.id)} className="bg-brand-red hover:bg-brand-red-light text-white font-bold">
                                    Submit for Verification
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
            <p className="text-[11px] text-muted-foreground leading-relaxed">Order approved. Please complete the payment and upload the screenshot for verification.</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">Payment Uploaded / Verified</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Admin is verifying your payment. Once verified, your order will be confirmed and prepared for shipping.</p>
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
