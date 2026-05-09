'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, CheckCircle, XCircle, Phone, MapPin, User, Package, ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { LocalStorage } from '@/mock-db/storage';
import { useNotificationStore } from '@/store/notification-store';
import type { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { ALL_STATUSES } from '@/constants/statuses';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { addNotification } = useNotificationStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    const allOrders = LocalStorage.getAll<Order>('orders').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(allOrders);

    // Auto-select if ID is in search params
    const orderId = searchParams.get('id');
    if (orderId) {
      const order = allOrders.find(o => o.id === orderId);
      if (order) setSelectedOrder(order);
    }
  }, [searchParams]);

  const updateStatus = (id: string, status: OrderStatus, userId: string) => {
    LocalStorage.update<Order>('orders', id, { status, updatedAt: new Date().toISOString() });
    const updatedOrders = LocalStorage.getAll<Order>('orders').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(updatedOrders);
    
    // Update selected order if open
    if (selectedOrder?.id === id) {
      setSelectedOrder(updatedOrders.find(o => o.id === id) || null);
    }
    
    // Notify user
    addNotification({
      userId,
      title: 'Order Status Updated',
      message: `Your order status has been updated to ${status.replace(/_/g, ' ')}`,
      type: 'info',
      link: `/dashboard/orders?id=${id}`,
    });
    
    toast.success('Status updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage customer purchases and multi-item orders.</p>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-border">
                    <TableCell className="font-mono text-xs">#{order.id.split('-')[0]}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{order.userName}</div>
                      <div className="text-[10px] text-muted-foreground">{order.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{order.items.length} item(s)</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                        {order.items.map(i => i.productName).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold text-brand-gold">{formatPrice(order.totalPrice)}</TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(val) => val && updateStatus(order.id, val as OrderStatus, order.userId)}>
                        <SelectTrigger className="h-8 text-[10px] w-[130px] border-border uppercase tracking-widest font-bold">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          {ALL_STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-[10px] capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-brand-gold"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-border">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No orders found.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm">#{order.id.split('-')[0]}</h3>
                    <p className="text-[10px] text-muted-foreground">By {order.userName}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                  </div>
                  <div className="font-bold text-brand-gold">{formatPrice(order.totalPrice)}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Select value={order.status} onValueChange={(val) => val && updateStatus(order.id, val as OrderStatus, order.userId)}>
                    <SelectTrigger className="h-9 text-[10px] flex-1 border-border uppercase tracking-widest font-bold">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-[10px] capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground border-border"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="glass border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-red" />
              Order Details <span className="text-muted-foreground font-mono text-sm ml-2">#{selectedOrder?.id.split('-')[0]}</span>
            </DialogTitle>
            <DialogDescription>
              Placed by {selectedOrder?.userName} on {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Status Update in Dialog */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Status</div>
                <Select value={selectedOrder.status} onValueChange={(val) => val && updateStatus(selectedOrder.id, val as OrderStatus, selectedOrder.userId)}>
                  <SelectTrigger className="h-9 text-xs w-[160px] border-border bg-background">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {ALL_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Items List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
                    <Package className="h-3 w-3" /> Ordered Items
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center p-2 rounded-lg bg-background/30 border border-border">
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
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold uppercase tracking-widest">Total</span>
                      <span className="text-lg font-bold text-brand-gold">{formatPrice(selectedOrder.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery & Customer Info */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest">Delivery Info</h4>
                    <div className="p-4 rounded-xl border border-border bg-background/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recipient</p>
                          <p className="text-xs font-medium">{selectedOrder.deliveryName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                          <p className="text-xs font-medium">{selectedOrder.deliveryPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Address</p>
                          <p className="text-xs font-medium leading-relaxed">{selectedOrder.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.message && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest">Customer Note</h4>
                      <div className="p-3 rounded-xl border border-border bg-background/30 italic text-xs text-muted-foreground">
                        "{selectedOrder.message}"
                      </div>
                    </div>
                  )}

                  {selectedOrder.paymentScreenshot && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest">Payment Proof</h4>
                      <Button variant="outline" size="sm" className="w-full h-8 text-[10px] uppercase tracking-widest font-bold">
                        <ExternalLink className="h-3 w-3 mr-2" /> View Screenshot
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
