'use client';

import { useEffect, useState } from 'react';
import { Eye, Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocalStorage } from '@/mock-db/storage';
import { useNotificationStore } from '@/store/notification-store';
import type { ConsultationBooking, BookingStatus } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { ALL_STATUSES } from '@/constants/statuses';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared/status-badge';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    setBookings(LocalStorage.getAll<ConsultationBooking>('bookings').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const updateStatus = (id: string, status: BookingStatus, userId: string) => {
    LocalStorage.update<ConsultationBooking>('bookings', id, { status });
    // Refresh background content
    setBookings(LocalStorage.getAll<ConsultationBooking>('bookings').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    addNotification({
      userId,
      title: 'Booking Status Updated',
      message: `Your consultation booking status has been updated to ${status.replace('_', ' ')}`,
      type: 'info',
      link: '/dashboard/consultations',
    });

    toast.success('Status updated');
  };

  const handleAssignSlot = () => {
    if (!selectedBooking) return;

    const updates = {
      slotDate,
      slotTime,
      updatedAt: new Date().toISOString(),
    };

    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, updates);
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updates } : b));

    addNotification({
      userId: selectedBooking.userId,
      title: 'Consultation Slot Assigned',
      message: `Your consultation has been scheduled for ${new Date(slotDate).toLocaleDateString()} at ${slotTime}.`,
      type: 'success'
    });

    toast.success('Slot assigned successfully');
    setSelectedBooking(null);
  };

  const openSlotModal = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    setSlotDate(booking.slotDate || '');
    setSlotTime(booking.slotTime || '');
    setIsDetailOpen(false);
  };

  const openDetailModal = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultation Bookings</h1>
          <p className="text-muted-foreground">Manage expert consultation appointments and scheduling.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead>Customer</TableHead>
                <TableHead>Requested Plan</TableHead>
                <TableHead>Assigned Slot</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Calendar className="mx-auto h-8 w-8 mb-4 opacity-20" />
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id} className="border-border hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="font-medium">{booking.userName}</div>
                      <div className="text-xs text-muted-foreground">{booking.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{booking.duration} min</div>
                      <div className="text-xs capitalize text-brand-gold">{booking.urgency}</div>
                    </TableCell>
                    <TableCell>
                      {booking.slotDate ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{new Date(booking.slotDate).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">{booking.slotTime}</span>
                        </div>
                      ) : (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs text-brand-red font-bold"
                          onClick={() => openSlotModal(booking)}
                        >
                          Assign Slot
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatPrice(booking.totalPrice ?? 0)}</TableCell>
                    <TableCell>
                      <Select value={booking.status} onValueChange={(val) => val && updateStatus(booking.id, val as BookingStatus, booking.userId)}>
                        <SelectTrigger className="h-8 text-xs w-[140px] border-border bg-background/50">
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-brand-gold"
                          onClick={() => openSlotModal(booking)}
                          title="Assign/Change Slot"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-brand-gold"
                          onClick={() => openDetailModal(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-border">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No bookings found.</div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{booking.userName}</h3>
                    <p className="text-xs text-muted-foreground">{booking.duration} min • {booking.urgency}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-muted-foreground">
                    {booking.slotDate ? `${new Date(booking.slotDate).toLocaleDateString()} at ${booking.slotTime}` : 'No slot assigned'}
                  </div>
                  <div className="font-bold text-brand-gold">{formatPrice(booking.totalPrice ?? 0)}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Select value={booking.status} onValueChange={(val) => val && updateStatus(booking.id, val as BookingStatus, booking.userId)}>
                    <SelectTrigger className="h-9 text-xs flex-1 border-border">
                      <SelectValue placeholder="Status" />
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
                    onClick={() => openSlotModal(booking)}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground border-border"
                    onClick={() => openDetailModal(booking)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign Slot Modal */}
      <Dialog open={!!selectedBooking && !isDetailOpen} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Consultation</DialogTitle>
            <DialogDescription>
              Assign a date and time for {selectedBooking?.userName}'s {selectedBooking?.duration} min consultation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={slotDate}
                onChange={e => setSlotDate(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={slotTime}
                onChange={e => setSlotTime(e.target.value)}
                className="bg-background/50"
              />
            </div>
            {selectedBooking?.query && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <Label className="text-[10px] uppercase text-muted-foreground">User Query</Label>
                <p className="text-sm italic text-muted-foreground">"{selectedBooking.query}"</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>Cancel</Button>
            <Button
              className="bg-brand-gold hover:bg-brand-gold/90 text-white"
              onClick={handleAssignSlot}
              disabled={!slotDate || !slotTime}
            >
              <Check className="mr-2 h-4 w-4" /> Confirm Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="glass border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Consultation request from {selectedBooking?.userName}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Booking ID</p>
                  <p className="text-sm font-mono">{selectedBooking.id.slice(0, 8)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
                  Plan Details
                </h4>
                <div className="p-4 rounded-xl border border-border bg-background/30 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{selectedBooking.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Urgency</p>
                    <p className="text-sm font-medium capitalize">{selectedBooking.urgency}</p>
                  </div>
                </div>
              </div>

              {selectedBooking.query && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest">User Query</h4>
                  <div className="p-4 rounded-xl border border-border bg-background/30 italic text-sm text-muted-foreground leading-relaxed">
                    "{selectedBooking.query}"
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl bg-brand-gold/5 border border-brand-gold/20">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Price</span>
                </div>
                <div className="text-xl font-bold text-brand-gold">
                  {formatPrice(selectedBooking.totalPrice ?? 0)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
