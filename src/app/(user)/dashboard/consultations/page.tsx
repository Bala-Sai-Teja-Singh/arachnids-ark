'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { LocalStorage } from '@/mock-db/storage';
import type { ConsultationBooking } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { useNotificationStore } from '@/store/notification-store';

export default function MyConsultationsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const data = LocalStorage.getAll<ConsultationBooking>('bookings')
      .filter(b => b.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(data);
  }, [user]);

  const handleUpload = (id: string) => {
    if (!selectedFile) {
      setUploadError('Please select a payment screenshot to upload');
      return;
    }
    setUploadError(null);
    LocalStorage.update<ConsultationBooking>('bookings', id, {
      paymentScreenshot: 'payment_uploaded.jpg',
      status: 'payment_uploaded',
    });
    setBookings(prev => prev.map(b =>
      b.id === id ? { ...b, paymentScreenshot: 'payment_uploaded.jpg', status: 'payment_uploaded' as const } : b
    ));

    // Notify Admin
    useNotificationStore.getState().addNotification({
      userId: 'admin',
      title: 'Payment Received',
      message: `${user?.name} uploaded a payment screenshot for a consultation.`,
      type: 'payment',
    });

    toast.success('Payment screenshot uploaded successfully!');
    setUploadId(null);
    setSelectedFile(null);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="vibe-heading text-2xl font-bold mb-1">My Consultations</h1>
        <p className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Track your consultation bookings</p>
      </motion.div>

      {bookings.length === 0 ? (
        <EmptyState icon={Calendar} title="No consultations yet" description="Book a consultation with our experts to get started." />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium">{booking.duration} min — <span className="capitalize">{booking.urgency}</span></h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.slotDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} at {booking.slotTime}
                      </p>
                      {booking.query && <p className="text-xs text-muted-foreground line-clamp-1">{booking.query}</p>}
                      {booking.adminNote && <p className="text-xs text-brand-gold">Admin: {booking.adminNote}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-gold">{formatPrice(booking.totalPrice || 0)}</span>
                      <StatusBadge status={booking.status} />
                      {booking.status === 'awaiting_payment' && (
                        <Dialog open={uploadId === booking.id} onOpenChange={(open) => {
                          setUploadId(open ? booking.id : null);
                          if (!open) {
                            setSelectedFile(null);
                            setUploadError(null);
                          }
                        }}>
                          <DialogTrigger render={<Button size="sm" className="bg-brand-gold hover:bg-brand-gold-light text-white" />}>
                            Pay Now
                          </DialogTrigger>
                          <DialogContent className="glass border-border">
                            <DialogHeader><DialogTitle>Complete Your Payment</DialogTitle></DialogHeader>
                            <div className="py-4 space-y-6">
                              <div className="bg-background/50 border border-border p-4 rounded-lg space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                                  <p className="font-mono text-sm bg-muted/50 p-2 rounded border border-border select-all">payments@arachnidsark</p>
                                </div>
                                <div className="space-y-1 mt-2">
                                  <p className="text-xs text-muted-foreground">Bank Transfer Details</p>
                                  <div className="font-mono text-xs bg-muted/50 p-2 rounded border border-border space-y-1">
                                    <p>Bank: HDFC Bank</p>
                                    <p>Account Name: ArachnidsArk Pvt Ltd</p>
                                    <p>A/C Number: <span className="select-all">50200001234567</span></p>
                                    <p>IFSC: <span className="select-all">HDFC0001234</span></p>
                                  </div>
                                </div>
                                <p className="text-[10px] text-brand-gold italic">Please include your booking ID ({booking.id.split('-')[1] || booking.id}) in the transfer remarks.</p>
                              </div>

                              <div className="space-y-2 border-t border-border pt-4">
                                <Label>Upload Payment Screenshot</Label>
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
                                <p className="text-xs text-muted-foreground">Upload your payment proof for verification.</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setUploadId(null)}>Cancel</Button>
                              <Button onClick={() => handleUpload(booking.id)} className="bg-brand-red hover:bg-brand-red-light text-white">Submit</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
