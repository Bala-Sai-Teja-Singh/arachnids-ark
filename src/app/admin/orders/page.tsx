'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Package,
  Phone,
  MapPin,
  Truck,
  ExternalLink,
  Eye,
  Save,
  ChevronRight,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertCircle,
  XCircle,
  Undo2,
  Search,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/molecules/status-badge';
import { SectionHeader } from '@/components/shared/molecules/section-header';
import { Loading } from '@/components/shared/molecules/loading';
import { Modal } from '@/components/shared/molecules/modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/shared/atoms/input';
import { Separator } from '@/components/ui/separator';
import { LocalStorage } from '@/mock-db/storage';
import { useNotificationStore } from '@/store/notification-store';
import { ALL_STATUSES, STATUS_CONFIG } from '@/constants/statuses';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import type { Order, OrderStatus, CourseEnrollment, SystemSettings, ConsultationBooking, User } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<{ id: string, userId: string } | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: OrderStatus, userId: string } | null>(null);
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotificationStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    const allOrders = LocalStorage.getAll<Order>('orders').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(allOrders);
    setTimeout(() => setIsLoading(false), 300);

    // Auto-select if ID is in search params
    const orderId = searchParams.get('id');
    if (orderId) {
      const order = allOrders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setTrackingId(order.trackingId || '');
        setCourierPartner(order.courierPartner || '');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedOrder) {
      setTrackingId(selectedOrder.trackingId || '');
      setCourierPartner(selectedOrder.courierPartner || '');
    }
  }, [selectedOrder]);

  const updateStatus = (id: string, status: OrderStatus, userId: string, forceResend: boolean = false) => {
    const existingOrders = LocalStorage.getAll<Order>('orders');
    const orderToUpdate = existingOrders.find(o => o.id === id);

    if (orderToUpdate?.status === 'order_cancelled') {
      toast.error('Cannot change status of a cancelled order');
      return;
    }

    if (status === 'order_shipped' && orderToUpdate && !orderToUpdate.trackingId) {
      toast.error('Please enter tracking details before marking as shipped');
      setSelectedOrder(orderToUpdate);
      return;
    }

    if (status === 'order_cancelled') {
      setOrderToCancel({ id, userId });
      setCancellationReason('');
      setIsCancellationModalOpen(true);
      return;
    }

    // Smart Email Logic
    if (orderToUpdate && !forceResend) {
      const oldIndex = ALL_STATUSES.indexOf(orderToUpdate.status);
      const newIndex = ALL_STATUSES.indexOf(status);
      const isBackward = newIndex < oldIndex;
      const alreadySent = orderToUpdate.emailsSent?.includes(status);

      if (isBackward || alreadySent) {
        setPendingStatusUpdate({ id, status, userId });
        setIsResendModalOpen(true);
        return;
      }
    }

    executeStatusUpdate(id, status, userId, forceResend);
  };

  const executeStatusUpdate = (id: string, status: OrderStatus, userId: string, sendEmail: boolean = true) => {
    LocalStorage.update<Order>('orders', id, { status, updatedAt: new Date().toISOString() });
    const updatedOrders = LocalStorage.getAll<Order>('orders').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(updatedOrders);

    const order = updatedOrders.find(o => o.id === id);

    // AUTOMATIC ENROLLMENT & BOOKING
    if (order && status === 'payment_verified') {
      const newlyUnlockedCourses: string[] = [];

      order.items.forEach(item => {
        if (item.type === 'course') {
          const enrollments = LocalStorage.getAll<CourseEnrollment>('enrollments');
          const alreadyCreated = enrollments.some((e: CourseEnrollment) => e.orderId === order.id && e.courseId === item.id);

          if (!alreadyCreated) {
            LocalStorage.create<CourseEnrollment>('enrollments', {
              id: `enr-${Date.now()}-${item.id}`,
              userId,
              userName: order.userName,
              userEmail: order.userEmail,
              courseId: item.id,
              courseTitle: item.name,
              status: 'enrolled',
              totalPrice: item.price,
              orderId: order.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as CourseEnrollment);

            newlyUnlockedCourses.push(item.name);
          }
        } else if (item.type === 'consultation') {
          const bookings = LocalStorage.getAll<ConsultationBooking>('bookings');
          const alreadyCreated = bookings.some((b: ConsultationBooking) => b.orderId === order.id);

          if (!alreadyCreated) {
            const consultationItems = order.items.filter(i => i.type === 'consultation');
            const totalConsultationPrice = consultationItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

            // Use the first item for top-level metadata defaults
            const firstItem = consultationItems[0];

            LocalStorage.create<ConsultationBooking>('bookings', {
              id: `bk-${Date.now()}-${order.id}`,
              userId,
              userName: order.userName,
              userEmail: order.userEmail,
              status: 'payment_verified',
              duration: firstItem.metadata?.duration || 30,
              urgency: (firstItem.metadata?.urgency as any) || 'normal',
              query: firstItem.metadata?.query || 'Purchased via cart',
              slotId: 'TBD',
              slotDate: 'TBD',
              slotTime: 'TBD',
              totalPrice: totalConsultationPrice,
              orderId: order.id,
              items: consultationItems.map(i => ({
                duration: i.metadata?.duration || 30,
                quantity: i.quantity,
                label: i.metadata?.label || 'Expert Consultation',
                basePrice: i.price,
                urgency: i.metadata?.urgency || 'normal',
                status: 'payment_verified'
              })),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as ConsultationBooking);
            toast.success(`${consultationItems.length} consultation(s) added to a new booking`);
          }
        }
      });

      // Trigger grouped course unlocked email
      if (newlyUnlockedCourses.length > 0) {
        fetch('/api/emails/course-unlocked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: order.userEmail,
            userName: order.userName,
            courses: newlyUnlockedCourses,
          })
        })
        .then(() => toast.success(`Unlocked ${newlyUnlockedCourses.length} course(s) and sent notification`))
        .catch(console.error);
      }
    }

    // EMAIL NOTIFICATIONS
    if (order && sendEmail) {
      if (status === 'payment_verified') {
        sendEmailNotification(order, 'payment-verified');
      } else if (status === 'order_shipped') {
        sendEmailNotification(order, 'order-shipped');
      }
    }

    // Update selected order if open
    if (selectedOrder?.id === id) {
      setSelectedOrder(order || null);
    }

    addNotification({
      userId,
      title: 'Order Status Updated',
      message: `Your order status has been updated to ${status.replace(/_/g, ' ')}`,
      type: 'info',
      link: `/dashboard/orders?id=${id}`,
    });

    toast.success('Status updated');
    setIsResendModalOpen(false);
    setPendingStatusUpdate(null);
  };

  const handleCancelOrder = () => {
    if (!orderToCancel || !cancellationReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    const { id, userId } = orderToCancel!;
    LocalStorage.update<Order>('orders', id, {
      status: 'order_cancelled',
      cancellationReason,
      updatedAt: new Date().toISOString()
    });

    const updatedOrders = LocalStorage.getAll<Order>('orders').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(updatedOrders);

    const order = updatedOrders.find(o => o.id === id);

    if (order) {
      sendEmailNotification(order, 'order-cancelled');
      addNotification({
        userId,
        title: 'Order Cancelled',
        message: `Your order #${id.split('-')[0]} has been cancelled. Reason: ${cancellationReason}`,
        type: 'error',
        link: `/dashboard/orders?id=${id}`,
      });
    }

    if (selectedOrder?.id === id) {
      setSelectedOrder(order || null);
    }

    setIsCancellationModalOpen(false);
    setOrderToCancel(null);
    toast.success('Order cancelled and customer notified');
  };

  const sendEmailNotification = (order: Order, type: string) => {
    fetch(`/api/emails/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order,
        adminEmail: LocalStorage.getAll<User>('users').find(u => u.role === 'admin')?.email || 'harrysweettt@gmail.com'
      })
    })
      .then(() => {
        toast.success(`Notification email sent to customer!`);
        // Track email sent
        const existingEmails = order.emailsSent || [];
        const statusMap: Record<string, OrderStatus> = {
          'payment-verified': 'payment_verified',
          'order-shipped': 'order_shipped',
          'order-cancelled': 'order_cancelled'
        };
        const currentStatus = statusMap[type];
        if (currentStatus && !existingEmails.includes(currentStatus)) {
          LocalStorage.update<Order>('orders', order.id, {
            emailsSent: [...existingEmails, currentStatus]
          });
        }
      })
      .catch(err => {
        console.error(`Failed to send email:`, err);
        toast.error(`Failed to send email notification`);
      });
  };

  const resendPaymentEmail = (order: Order) => {
    const settingsData = LocalStorage.getAll<SystemSettings>('system_settings');
    if (settingsData.length > 0) {
      fetch('/api/emails/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          paymentDetails: {
            upiIds: settingsData[0].upiIds,
            bankDetails: settingsData[0].bankDetails,
            paymentInstructions: settingsData[0].paymentInstructions
          },
          adminEmail: LocalStorage.getAll<User>('users').find(u => u.role === 'admin')?.email || 'harrysweettt@gmail.com'
        })
      })
        .then(() => toast.success('Payment instruction email resent!'))
        .catch(err => {
          console.error('Failed to resend email:', err);
          toast.error('Failed to resend email');
        });
    }
  };

  const handleResendEmail = (order: Order) => {
    if (['pending', 'awaiting_payment'].includes(order.status)) {
      resendPaymentEmail(order);
    } else if (order.status === 'payment_verified') {
      sendEmailNotification(order, 'payment-verified');
    } else if (order.status === 'order_shipped') {
      sendEmailNotification(order, 'order-shipped');
    } else if (order.status === 'order_cancelled') {
      sendEmailNotification(order, 'order-cancelled');
    } else {
      toast.info('No email notification available for this status');
    }
  };

  const getResendButtonInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
      case 'awaiting_payment':
        return { label: 'Resend Payment Instructions', icon: CreditCard };
      case 'payment_verified':
        return { label: 'Resend Verification Email', icon: CheckCircle2 };
      case 'order_shipped':
        return { label: 'Resend Tracking Email', icon: Truck };
      case 'order_cancelled':
        return { label: 'Resend Cancellation Email', icon: XCircle };
      default:
        return { label: 'Resend Notification', icon: Undo2 };
    }
  };

  const updateTrackingInfo = () => {
    if (!selectedOrder) return;
    LocalStorage.update<Order>('orders', selectedOrder.id, {
      trackingId,
      courierPartner,
      status: 'order_shipped',
      updatedAt: new Date().toISOString()
    });
    const updatedOrders = LocalStorage.getAll<Order>('orders').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(updatedOrders);
    setSelectedOrder(updatedOrders.find(o => o.id === selectedOrder.id) || null);
    // Notify user
    addNotification({
      userId: selectedOrder.userId,
      title: 'Shipping Update',
      message: `Order #${selectedOrder.id.split('-')[0]}: ${courierPartner} - ${trackingId}`,
      type: 'success',
      link: `/dashboard/orders?id=${selectedOrder.id}`,
    });

    // Send email notification with new tracking details
    sendEmailNotification({ ...selectedOrder!, trackingId, courierPartner }, 'order-shipped');

    toast.success('Order marked as Dispatched & email sent');
  };

  if (isLoading) {
    return <Loading text="Fetching orders..." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader className="justify-end">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search by customer, email or phone..."
            className="bg-card border-border h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="h-4 w-4 text-muted-foreground" />}
            isClearable
            onClear={() => setSearchQuery('')}
          />
        </div>
      </SectionHeader>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold tracking-widest">Order ID</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest">Customer</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest">Items</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-center">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-right">Total</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders
                .filter(o => {
                  const query = searchQuery.toLowerCase();
                  return (
                    o.userName?.toLowerCase().includes(query) ||
                    o.userEmail?.toLowerCase().includes(query) ||
                    o.deliveryPhone?.includes(query) ||
                    o.id.toLowerCase().includes(query)
                  );
                })
                .length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No orders found.</TableCell>
                </TableRow>
              ) : (
                orders
                  .filter(o => {
                    const query = searchQuery.toLowerCase();
                    return (
                      o.userName?.toLowerCase().includes(query) ||
                      o.userEmail?.toLowerCase().includes(query) ||
                      o.deliveryPhone?.includes(query) ||
                      o.id.toLowerCase().includes(query)
                    );
                  })
                  .map((order) => (
                    <TableRow key={order.id} className="border-border group">
                      <TableCell className="font-mono text-[10px] text-muted-foreground">#{order.id.split('-')[0]}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{order.userName}</div>
                        <div className="text-[10px] text-muted-foreground">{order.userEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs truncate max-w-[150px]">
                          {order.items.map(i => i.name).join(', ')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{order.items.length} item(s)</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={order.status} className="scale-90" />
                      </TableCell>
                      <TableCell className="text-right font-bold text-brand-gold text-sm">{formatPrice(order.totalPrice)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-gold shrink-0" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 shrink-0" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {orders
            .filter(o => {
              const query = searchQuery.toLowerCase();
              return (
                o.userName?.toLowerCase().includes(query) ||
                o.userEmail?.toLowerCase().includes(query) ||
                o.deliveryPhone?.includes(query) ||
                o.id.toLowerCase().includes(query)
              );
            })
            .map((order) => (
              <div key={order.id} className="p-4 space-y-4 active:bg-muted/30 transition-colors group relative" onClick={() => setSelectedOrder(order)}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">#{order.id.split('-')[0]}</h3>
                      <StatusBadge status={order.status} className="scale-75 origin-left" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{order.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-gold text-sm">{formatPrice(order.totalPrice)}</p>
                    <p className="text-[9px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30 gap-4">
                  <p className="text-[9px] text-muted-foreground italic truncate flex-1">
                    {order.items.map(i => i.name).join(', ')}
                  </p>
                  <Eye className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        variant="extra-large"
        size="extra-large"
        className="sm:max-w-[95vw] sm:max-h-[95vh]"
        noPadding
      >
        {selectedOrder && (
          <div className="flex flex-col h-full">
            <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:pr-12">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-5 w-5 text-brand-red" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Order Details</h3>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        #{selectedOrder.id.split('-')[0]} • {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.status !== 'order_completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendEmail(selectedOrder!)}
                      className="h-8 px-3 text-[9px] uppercase font-bold tracking-widest border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 gap-2 shadow-sm w-fit"
                    >
                      {(() => {
                        const info = getResendButtonInfo(selectedOrder.status);
                        return (
                          <>
                            <info.icon className="h-3.5 w-3.5" />
                            {info.label}
                          </>
                        );
                      })()}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Status Journey */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lifecycle Journey</h4>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'pending', label: 'Order Received', icon: Clock },
                        { id: 'awaiting_payment', label: 'Awaiting Payment', icon: CreditCard },
                        { id: 'payment_verified', label: 'Payment Verified', icon: CheckCircle2 },
                        { id: 'order_shipped', label: 'Dispatched', icon: Truck },
                        { id: 'order_completed', label: 'Completed', icon: CheckCircle2 }
                      ].map((step, idx, arr) => {
                        const isCompleted = arr.findIndex(s => s.id === selectedOrder.status) >= idx;
                        const isCurrent = selectedOrder.status === step.id;
                        const isNext = arr.findIndex(s => s.id === selectedOrder.status) + 1 === idx;

                        return (
                          <div
                            key={step.id}
                            onClick={() => {
                              if (selectedOrder.status === 'order_cancelled') {
                                toast.error('Cannot change status of a cancelled order');
                                return;
                              }
                              
                              // Scroll to shipping details if trying to dispatch without tracking info
                              if (step.id === 'order_shipped' && (!trackingId || !courierPartner)) {
                                const el = document.getElementById('shipping-details-form');
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  toast.info('Please enter shipping details first');
                                  return;
                                }
                              }
                              
                              updateStatus(selectedOrder!.id, step.id as OrderStatus, selectedOrder!.userId);
                            }}
                            className={cn(
                              "relative flex items-center gap-4 p-3 rounded-xl border transition-all duration-300 group cursor-pointer",
                              selectedOrder.status === 'order_cancelled' && "cursor-not-allowed opacity-60",
                              isCurrent ? "bg-brand-gold/10 border-brand-gold shadow-lg shadow-brand-gold/5" :
                                isCompleted ? "bg-green-500/5 border-green-500/20 hover:border-green-500/50" :
                                  "bg-muted/30 border-border hover:border-brand-gold/50"
                            )}
                          >
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                              isCurrent ? "bg-brand-gold text-black" :
                                isCompleted ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                            )}>
                              {isCompleted && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <p className={cn("text-[10px] font-bold uppercase tracking-wider", isCurrent ? "text-brand-gold" : isCompleted ? "text-green-500" : "text-muted-foreground")}>
                                {step.label}
                              </p>
                              {isCurrent && <p className="text-[9px] text-brand-gold/70 italic leading-none mt-1">Current Stage</p>}
                            </div>
                            {isNext && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />}
                          </div>
                        );
                      })}

                      {/* Cancel Action */}
                      <div className="pt-4 border-t border-border mt-4">
                        {selectedOrder.status !== 'order_cancelled' ? (
                          <Button
                            variant="ghost"
                            onClick={() => updateStatus(selectedOrder.id, 'order_cancelled', selectedOrder.userId)}
                            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-12 rounded-xl border border-transparent hover:border-red-500/20"
                          >
                            <XCircle className="h-5 w-5" />
                            <div className="text-left">
                              <p className="text-[10px] font-bold uppercase tracking-widest">Cancel Order</p>
                              <p className="text-[8px] text-red-500/70">Voids items and notifies customer</p>
                            </div>
                          </Button>
                        ) : (
                          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                              <XCircle className="h-4 w-4" /> Order Cancelled
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">"{(selectedOrder!.cancellationReason || 'No reason specified')}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Order Content */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Items Section */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Package className="h-3 w-3" /> Items Purchased
                        </h4>
                        <div className="space-y-2">
                          {selectedOrder!.items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center p-3 rounded-xl bg-muted/30 border border-border/50 group hover:border-brand-gold/30 transition-colors">
                              <div className="h-10 w-10 rounded-lg border border-border bg-background overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="h-4 w-4 text-muted-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold uppercase truncate">{item.name}</p>
                                <p className="text-[9px] text-muted-foreground">{item.type === 'product' ? (item.metadata?.size || 'N/A') : item.type} × {item.quantity}</p>
                              </div>
                              <p className="text-xs font-bold text-brand-gold">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          ))}
                          <div className="pt-2 px-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Subtotal</span><span>{formatPrice(selectedOrder!.totalPrice - selectedOrder!.shippingCharge)}</span></div>
                            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Shipping</span><span>{formatPrice(selectedOrder!.shippingCharge)}</span></div>
                            <div className="flex justify-between text-xs font-bold text-brand-gold pt-1 border-t border-border mt-1"><span>Total</span><span>{formatPrice(selectedOrder!.totalPrice)}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Customer & Delivery Section */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> Customer & Delivery
                        </h4>
                        <div className="p-4 rounded-2xl border border-border bg-background/50 space-y-4 shadow-inner">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <UserIcon className="h-3.5 w-3.5 text-brand-red mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[8px] text-muted-foreground uppercase font-black">Recipient</p>
                                <p className="text-xs font-bold">{selectedOrder!.deliveryName}</p>
                                <p className="text-[9px] text-muted-foreground">{selectedOrder!.userEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Phone className="h-3.5 w-3.5 text-brand-red mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[8px] text-muted-foreground uppercase font-black">Phone</p>
                                <p className="text-xs font-bold">{selectedOrder!.deliveryPhone}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin className="h-3.5 w-3.5 text-brand-red mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-[8px] text-muted-foreground uppercase font-black">Full Address</p>
                                <p className="text-xs font-medium leading-relaxed">{selectedOrder!.deliveryAddress}</p>
                              </div>
                            </div>
                          </div>
                          {selectedOrder!.message && (
                            <div className="p-2.5 rounded-xl bg-brand-gold/5 border border-brand-gold/10 italic text-[10px] text-muted-foreground">
                              "{selectedOrder!.message}"
                            </div>
                          )}
                        </div>

                        {/* Dispatch Logistics Section */}
                        {['payment_verified', 'order_shipped', 'order_completed'].includes(selectedOrder!.status) && (
                          <div id="shipping-details-form" className="space-y-4 pt-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Truck className="h-3 w-3" /> Dispatch Logistics
                            </h4>
                            <div className="p-4 rounded-2xl border border-border bg-accent/10 space-y-4 shadow-sm">
                              <div className="space-y-3">
                                <Input
                                  label="Courier Partner"
                                  labelClassName="text-[9px] uppercase tracking-widest text-muted-foreground"
                                  value={courierPartner}
                                  onChange={(e) => setCourierPartner(e.target.value)}
                                  placeholder="e.g. Delhivery, BlueDart"
                                  className="h-8 text-xs bg-background/50"
                                />
                                <Input
                                  label="Tracking ID / AWB"
                                  labelClassName="text-[9px] uppercase tracking-widest text-muted-foreground"
                                  value={trackingId}
                                  onChange={(e) => setTrackingId(e.target.value)}
                                  placeholder="Enter tracking number"
                                  className="h-8 text-xs bg-background/50"
                                />
                              </div>
                              <Button
                                onClick={updateTrackingInfo}
                                disabled={selectedOrder!.status === 'order_cancelled'}
                                className="w-full h-8 bg-brand-gold hover:bg-brand-gold/90 text-black font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-brand-gold/10"
                              >
                                <Save className="h-3 w-3" /> Update & Notify
                              </Button>
                              <p className="text-[8px] text-muted-foreground text-center italic">Triggers shipping email to customer</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </Modal>

      {/* Cancellation Modal */}
      <Modal 
        isOpen={isCancellationModalOpen} 
        onClose={() => setIsCancellationModalOpen(false)}
        variant="confirm"
        title="Cancellation Audit"
        description="You are about to cancel this order. This action will notify the customer and provide them with the following reason."
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setIsCancellationModalOpen(false)} className="text-[10px] uppercase tracking-widest font-bold">Dismiss</Button>
            <Button onClick={handleCancelOrder} className="bg-red-500 hover:bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold px-8">Confirm Cancellation</Button>
          </div>
        )}
      >
        <div className="py-2 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Reason for Cancellation</Label>
            <textarea
              className="w-full h-24 bg-background/50 border border-border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all resize-none shadow-inner"
              placeholder="e.g. Items out of stock, shipping zone unreachable..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Resend Email Confirmation Modal */}
      <Modal 
        isOpen={isResendModalOpen} 
        onClose={() => setIsResendModalOpen(false)}
        variant="confirm"
        title="Email Notification Guard"
        description="You are moving this order to a status that was previously reached or is a backward step. Do you want to resend the status update email to the customer?"
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => {
                if (pendingStatusUpdate) {
                  executeStatusUpdate(pendingStatusUpdate.id, pendingStatusUpdate.status, pendingStatusUpdate.userId, false);
                }
              }}
              className="text-[10px] uppercase tracking-widest font-bold flex-1"
            >
              Update Without Email
            </Button>
            <Button
              onClick={() => {
                if (pendingStatusUpdate) {
                  executeStatusUpdate(pendingStatusUpdate.id, pendingStatusUpdate.status, pendingStatusUpdate.userId, true);
                }
              }}
              className="bg-brand-gold hover:bg-brand-gold/90 text-black text-[10px] uppercase tracking-widest font-bold px-8 flex-1"
            >
              Update & Resend Email
            </Button>
          </div>
        )}
      >
        <div className="py-2" />
      </Modal>
    </div>
  );
}
