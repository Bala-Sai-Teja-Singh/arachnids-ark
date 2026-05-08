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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    setBookings(LocalStorage.getAll<ConsultationBooking>('bookings').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const updateStatus = (id: string, status: BookingStatus, userId: string) => {
    LocalStorage.update<ConsultationBooking>('bookings', id, { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    
    addNotification({
      userId,
      title: 'Booking Status Updated',
      message: `Your consultation booking status has been updated to ${status.replace('_', ' ')}`,
      type: 'info'
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
                  <TableCell className="font-medium">{formatPrice(booking.totalPrice)}</TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-gold">
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

      {/* Assign Slot Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
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
    </div>
  );
}
