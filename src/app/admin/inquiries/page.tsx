'use client';

import { useEffect, useState } from 'react';
import { Eye, Edit, Trash2, CheckCircle, XCircle, Phone, MapPin, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { LocalStorage } from '@/mock-db/storage';
import { useNotificationStore } from '@/store/notification-store';
import type { Inquiry, InquiryStatus } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { ALL_STATUSES } from '@/constants/statuses';
import { toast } from 'sonner';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    setInquiries(LocalStorage.getAll<Inquiry>('inquiries').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const updateStatus = (id: string, status: InquiryStatus, userId: string) => {
    LocalStorage.update<Inquiry>('inquiries', id, { status });
    // Refresh background content
    setInquiries(LocalStorage.getAll<Inquiry>('inquiries').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    // Notify user
    addNotification({
      userId,
      title: 'Order Request Status Updated',
      message: `Your order request status has been updated to ${status.replace('_', ' ')}`,
      type: 'info',
      link: '/dashboard/inquiries',
    });
    
    toast.success('Status updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order Requests</h1>
        <p className="text-muted-foreground">Manage customer purchase requests.</p>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No inquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                inquiries.map((inq) => (
                  <TableRow key={inq.id} className="border-border">
                    <TableCell>
                      <div className="font-medium">{inq.userName}</div>
                      <div className="text-xs text-muted-foreground">{inq.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{inq.productName}</div>
                      <div className="text-xs text-muted-foreground">Qty: {inq.quantity}</div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(inq.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{formatPrice(inq.totalPrice)}</TableCell>
                    <TableCell>
                      <Select value={inq.status} onValueChange={(val) => val && updateStatus(inq.id, val as InquiryStatus, inq.userId)}>
                        <SelectTrigger className="h-8 text-xs w-[140px] border-border">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-brand-gold"
                        onClick={() => setSelectedInquiry(inq)}
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
          {inquiries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No order requests found.</div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{inq.productName}</h3>
                    <p className="text-xs text-muted-foreground">By {inq.userName}</p>
                  </div>
                  <StatusBadge status={inq.status} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    {new Date(inq.createdAt).toLocaleDateString()} • Qty: {inq.quantity}
                  </div>
                  <div className="font-bold text-brand-gold">{formatPrice(inq.totalPrice)}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Select value={inq.status} onValueChange={(val) => val && updateStatus(inq.id, val as InquiryStatus, inq.userId)}>
                    <SelectTrigger className="h-9 text-xs flex-1 border-border">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground border-border"
                    onClick={() => setSelectedInquiry(inq)}
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
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent className="glass border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Request Details</DialogTitle>
            <DialogDescription>
              Purchase request for {selectedInquiry?.productName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Order ID</p>
                  <p className="text-sm font-mono">{selectedInquiry.id.slice(0, 8)}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(selectedInquiry.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
                  <Package className="h-3 w-3" /> Delivery Information
                </h4>
                <div className="p-4 rounded-xl border border-border bg-background/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recipient Name</p>
                      <p className="text-sm font-medium">{selectedInquiry.deliveryName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile Number</p>
                      <p className="text-sm font-medium">{selectedInquiry.deliveryPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium leading-relaxed">{selectedInquiry.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedInquiry.message && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest">Customer Message</h4>
                  <div className="p-4 rounded-xl border border-border bg-background/30 italic text-sm text-muted-foreground leading-relaxed">
                    "{selectedInquiry.message}"
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl bg-brand-gold/5 border border-brand-gold/20">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Price ({selectedInquiry.quantity} unit{selectedInquiry.quantity > 1 ? 's' : ''})</span>
                </div>
                <div className="text-xl font-bold text-brand-gold">
                  {formatPrice(selectedInquiry.totalPrice)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
