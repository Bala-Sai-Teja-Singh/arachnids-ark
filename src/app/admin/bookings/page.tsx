'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { Badge } from '@/components/ui/badge';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [itemMinutes, setItemMinutes] = useState<Record<number, string>>({});
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);
  const [newSlotDuration, setNewSlotDuration] = useState<string>('');
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


  const openSlotModalForItem = (itemIdx: number) => {
    setActiveItemIdx(itemIdx);
    const item = selectedBooking?.items?.[itemIdx];
    setNewSlotDuration(String(item?.duration || 30));
    setSlotDate('');
    setSlotTime('');
    setIsSlotModalOpen(true);
  };

  const openDetailModal = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    const initialMinutes: Record<number, string> = {};
    booking.items?.forEach((item, idx) => {
      initialMinutes[idx] = String(item.minutesUsed || 0);
    });
    setItemMinutes(initialMinutes);
    setIsDetailOpen(true);
  };

  const handleUpdateItemUsage = (itemIdx: number) => {
    if (!selectedBooking || !selectedBooking.items) return;

    const newItems = [...selectedBooking.items];
    const mins = Math.max(0, parseInt(itemMinutes[itemIdx]) || 0);
    newItems[itemIdx] = { ...newItems[itemIdx], minutesUsed: mins };

    const totalMinutesUsed = newItems.reduce((acc, item) => acc + (item.minutesUsed || 0), 0);

    const updates = {
      items: newItems,
      minutesUsed: totalMinutesUsed
    };

    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, updates);
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updates } : b));
    setSelectedBooking(prev => prev ? { ...prev, ...updates } : null);
    toast.success('Talktime updated for session item');
  };

  const handleAddSlot = () => {
    if (!selectedBooking || activeItemIdx === null || !selectedBooking.items) return;

    const newItems = [...selectedBooking.items];
    const item = newItems[activeItemIdx];
    const newSlot = {
      id: uuidv4(),
      date: slotDate,
      time: slotTime,
      duration: parseInt(newSlotDuration) || item.duration,
    };

    const slots = item.slots ? [...item.slots, newSlot] : [newSlot];
    newItems[activeItemIdx] = { ...item, slots };

    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, { items: newItems });
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, items: newItems } : b));
    setSelectedBooking(prev => prev ? { ...prev, items: newItems } : null);

    addNotification({
      userId: selectedBooking.userId,
      title: 'Call Scheduled',
      message: `A new ${newSlot.duration}-min call has been scheduled for your ${item.label} session on ${new Date(slotDate).toLocaleDateString()}.`,
      type: 'success'
    });

    toast.success('Call scheduled successfully');
    setIsSlotModalOpen(false);
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
                      {booking.items?.some(i => i.slots?.length) ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Multiple Slots</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{booking.items.reduce((a, b) => a + (b.slots?.length || 0), 0)} scheduled</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No slots assigned</span>
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
                    {booking.items?.reduce((a, b) => a + (b.slots?.length || 0), 0) || 0} calls scheduled
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

      {/* Add Call Slot Modal */}
      <Dialog open={isSlotModalOpen} onOpenChange={setIsSlotModalOpen}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Call</DialogTitle>
            <DialogDescription>
              Add a specific call slot for the {selectedBooking?.items?.[activeItemIdx || 0]?.label} session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)} className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Call Duration (minutes)</Label>
              <Input
                type="number"
                value={newSlotDuration}
                onChange={e => setNewSlotDuration(e.target.value)}
                className="bg-background/50"
                placeholder="e.g. 15"
              />
              <p className="text-[10px] text-muted-foreground">You can split a 30-min session into smaller calls (e.g. 15+15).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSlotModalOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white" onClick={handleAddSlot} disabled={!slotDate || !slotTime}>
              <Check className="mr-2 h-4 w-4" /> Confirm Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        setIsDetailOpen(open);
        if (!open) setSelectedBooking(null);
      }}>
        <DialogContent className="glass border-border sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
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
              </div>               <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
                  Session Breakdowns
                </h4>
                <div className="space-y-3">
                  {selectedBooking.items?.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-background/30 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{item.urgency} Urgency</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-brand-gold">{item.duration} mins total</p>
                          <p className="text-[10px] text-muted-foreground font-medium">Used: {item.minutesUsed || 0} / {item.duration}m</p>
                        </div>
                      </div>

                      {/* Scheduled Calls per breakdown */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scheduled Calls</p>
                        <div className="space-y-1.5">
                          {item.slots?.length ? item.slots.map(slot => (
                            <div key={slot.id} className="flex items-center justify-between p-2 rounded bg-brand-gold/5 border border-brand-gold/10 text-xs">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-brand-gold" />
                                <span>{new Date(slot.date).toLocaleDateString()} at {slot.time}</span>
                              </div>
                              <Badge variant="outline" className="text-[8px] h-4">{slot.duration} mins</Badge>
                            </div>
                          )) : (
                            <p className="text-[10px] text-muted-foreground italic">No calls scheduled for this item.</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-[10px] uppercase font-bold border-brand-gold/20 text-brand-gold hover:bg-brand-gold hover:text-white"
                            onClick={() => openSlotModalForItem(idx)}
                          >
                            + Schedule New Call
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-3 items-end pt-2 border-t border-border/50">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground">Update Total Minutes Consumed</Label>
                          <Input
                            type="number"
                            min="0"
                            value={itemMinutes[idx] || '0'}
                            onChange={e => setItemMinutes(prev => ({ ...prev, [idx]: e.target.value }))}
                            className="h-8 bg-background text-sm"
                          />
                        </div>
                        <Button
                          onClick={() => handleUpdateItemUsage(idx)}
                          size="sm"
                          className="bg-brand-gold hover:bg-brand-gold/90 text-white h-8 px-3 text-xs"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  ))}
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
