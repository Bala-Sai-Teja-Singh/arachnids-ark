'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Eye, Calendar, Clock, Check, Video, X } from 'lucide-react';
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
import { ALL_BOOKING_STATUSES, BOOKING_STATUS_CONFIG } from '@/constants/statuses';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);
  const [itemMinutes, setItemMinutes] = useState<Record<string, string>>({});
  const [itemMeetings, setItemMeetings] = useState<Record<string, string>>({});
  const [itemRecordings, setItemRecordings] = useState<Record<string, string>>({});
  const [itemDates, setItemDates] = useState<Record<string, string>>({});
  const [itemTimes, setItemTimes] = useState<Record<string, string>>({});
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({});
  const [newSlotDuration, setNewSlotDuration] = useState<string>('');
  const [slotMeetingLink, setSlotMeetingLink] = useState('');
  const [slotRecordingLink, setSlotRecordingLink] = useState('');
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ itemIdx: number, slotId: string } | null>(null);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    setBookings(LocalStorage.getAll<ConsultationBooking>('bookings').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const updateStatus = (id: string, status: BookingStatus, userId: string) => {
    LocalStorage.update<ConsultationBooking>('bookings', id, { status });
    // Refresh background content
    const updatedBookings = LocalStorage.getAll<ConsultationBooking>('bookings').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(updatedBookings);

    if (status === 'scheduled') {
      const booking = updatedBookings.find(b => b.id === id);
      if (booking) {
        // Get first assigned slot if available
        const firstSlot = booking.items?.find(i => i.slots?.length)?.slots?.[0];

        fetch('/api/emails/consultation-scheduled', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: booking.userEmail,
            userName: booking.userName,
            bookingId: booking.id,
            slotDate: firstSlot?.date || 'TBD (Check Dashboard)',
            slotTime: firstSlot?.time || 'TBD (Check Dashboard)',
            meetingLink: booking.meetingLink || '',
            duration: booking.duration
          })
        }).catch(console.error);

        toast.success('Scheduling email sent to user');
      }
    }

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
    setSlotMeetingLink('');
    setIsSlotModalOpen(true);
  };

  const openDetailModal = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    const initialMinutes: Record<string, string> = {};
    const initialMeetings: Record<string, string> = {};
    const initialRecordings: Record<string, string> = {};
    const initialDates: Record<string, string> = {};
    const initialTimes: Record<string, string> = {};
    const initialStatuses: Record<number, string> = {};
    
    booking.items?.forEach((item, idx) => {
      initialStatuses[idx] = item.status || 'payment_verified';
      item.slots?.forEach((slot) => {
        initialMinutes[slot.id] = String(slot.minutesUsed || 0);
        initialMeetings[slot.id] = slot.meetingLink || '';
        initialRecordings[slot.id] = slot.recordingUrl || '';
        initialDates[slot.id] = slot.date || '';
        initialTimes[slot.id] = slot.time || '';
      });
    });

    setItemMinutes(initialMinutes);
    setItemMeetings(initialMeetings);
    setItemRecordings(initialRecordings);
    setItemDates(initialDates);
    setItemTimes(initialTimes);
    setItemStatuses(initialStatuses);
    setIsDetailOpen(true);
  };

  const sendUpdatedEmail = (booking: ConsultationBooking, slot: any) => {
    fetch('/api/emails/consultation-updated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.userEmail,
        userName: booking.userName,
        bookingId: booking.id,
        slotDate: slot.date,
        slotTime: slot.time,
        meetingLink: slot.meetingLink,
        duration: slot.duration
      })
    })
      .then(() => toast.success('Update email sent to customer'))
      .catch(err => {
        console.error('Email error:', err);
        toast.error('Failed to send update email');
      });
  };

  const sendScheduledEmail = (booking: ConsultationBooking, slot: any) => {
    fetch('/api/emails/consultation-scheduled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.userEmail,
        userName: booking.userName,
        bookingId: booking.id,
        slotDate: slot.date,
        slotTime: slot.time,
        meetingLink: slot.meetingLink,
        duration: slot.duration
      })
    })
      .then(() => toast.success('Schedule email sent to customer'))
      .catch(err => {
        console.error('Email error:', err);
        toast.error('Failed to send schedule email');
      });
  };

  const sendCancelledEmail = (booking: ConsultationBooking, slot: any) => {
    fetch('/api/emails/consultation-cancelled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.userEmail,
        userName: booking.userName,
        bookingId: booking.id,
        slotDate: slot.date,
        slotTime: slot.time,
        reason: 'Administrative update'
      })
    })
      .then(() => toast.success('Cancellation email sent to customer'))
      .catch(err => {
        console.error('Email error:', err);
        toast.error('Failed to send cancellation email');
      });
  };

  const calculateItemStatus = (item: any): BookingStatus => {
    const minutesUsed = item.slots?.reduce((sum: number, s: any) => sum + (parseInt(itemMinutes[s.id]) || s.minutesUsed || 0), 0) || 0;
    if (minutesUsed >= item.duration) return 'completed';
    if (item.slots && item.slots.length > 0) return 'scheduled';
    return 'payment_verified';
  };

  const handleUpdateItemStatus = (itemIdx: number, status: BookingStatus) => {
    if (!selectedBooking || !selectedBooking.items) return;

    const newItems = [...selectedBooking.items];
    newItems[itemIdx] = { ...newItems[itemIdx], status };
    
    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, { items: newItems });
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, items: newItems } : b));
    setSelectedBooking(prev => prev ? { ...prev, items: newItems } : null);
    toast.success('Session status updated');
  };

  const handleUpdateSlotDetails = (itemIdx: number, slotId: string) => {
    if (!selectedBooking || !selectedBooking.items) return;

    const newItems = [...selectedBooking.items];
    const item = { ...newItems[itemIdx] };
    if (!item.slots) return;

    const slotIdx = item.slots.findIndex(s => s.id === slotId);
    if (slotIdx === -1) return;

    const oldMinutesUsed = item.slots[slotIdx].minutesUsed || 0;
    const newMinutesUsed = Math.max(0, parseInt(itemMinutes[slotId]) || 0);

    const updatedSlot = {
      ...item.slots[slotIdx],
      minutesUsed: newMinutesUsed,
      meetingLink: itemMeetings[slotId],
      recordingUrl: itemRecordings[slotId],
      date: itemDates[slotId],
      time: itemTimes[slotId]
    };

    item.slots[slotIdx] = updatedSlot;

    // Update item-level totals and status
    item.minutesUsed = item.slots.reduce((sum, s) => sum + (s.minutesUsed || 0), 0);
    item.status = calculateItemStatus(item);
    newItems[itemIdx] = item;

    // Update booking-level total and overall status
    const totalMinutesUsed = newItems.reduce((acc, i) => acc + (i.minutesUsed || 0), 0);
    const allCompleted = newItems.every(i => i.status === 'completed');
    
    const updates: Partial<ConsultationBooking> = {
      items: newItems,
      minutesUsed: totalMinutesUsed,
    };
    
    if (allCompleted) updates.status = 'completed';
    else if (newItems.some(i => i.status === 'scheduled')) updates.status = 'scheduled';

    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, updates);
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updates } : b));
    setSelectedBooking(prev => prev ? { ...prev, ...updates } : null);
    
    // Notify user of update
    sendUpdatedEmail(selectedBooking, updatedSlot);
    
    toast.success('Call details updated and customer notified');
  };

  const handleDeleteSlot = (itemIdx: number, slotId: string) => {
    setDeleteConfirmInfo({ itemIdx, slotId });
  };

  const executeDeleteSlot = () => {
    if (!selectedBooking || !selectedBooking.items || !deleteConfirmInfo) return;

    const { itemIdx, slotId } = deleteConfirmInfo;
    const newItems = [...selectedBooking.items];
    const item = { ...newItems[itemIdx] };
    const slotToDelete = item.slots?.find(s => s.id === slotId);
    
    item.slots = item.slots?.filter(s => s.id !== slotId);
    item.minutesUsed = item.slots?.reduce((sum, s) => sum + (s.minutesUsed || 0), 0) || 0;
    item.status = calculateItemStatus(item);
    newItems[itemIdx] = item;

    const allCompleted = newItems.every(i => i.status === 'completed');
    const updates: Partial<ConsultationBooking> = { items: newItems };
    if (allCompleted) updates.status = 'completed';

    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, updates);
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updates } : b));
    setSelectedBooking(prev => prev ? { ...prev, ...updates } : null);
    
    if (slotToDelete) {
      sendCancelledEmail(selectedBooking, slotToDelete);
    }
    
    toast.success('Call deleted and customer notified');
    setDeleteConfirmInfo(null);
  };

  const handleAddSlot = () => {
    if (!selectedBooking || activeItemIdx === null || !selectedBooking.items) return;

    const newItems = [...selectedBooking.items];
    const item = newItems[activeItemIdx];
    if (!slotMeetingLink) {
      toast.error('Meeting link is required');
      return;
    }

    const newSlot = {
      id: uuidv4(),
      date: slotDate,
      time: slotTime,
      duration: parseInt(newSlotDuration) || item.duration,
      status: 'scheduled' as BookingStatus,
      meetingLink: slotMeetingLink,
      recordingUrl: slotRecordingLink,
    };

    const slots = item.slots ? [...item.slots, newSlot] : [newSlot];
    const updatedItem = { ...item, slots };
    updatedItem.status = calculateItemStatus(updatedItem);
    newItems[activeItemIdx] = updatedItem;

    const updates: Partial<ConsultationBooking> = { 
      items: newItems,
      status: 'scheduled' as BookingStatus // At least one call scheduled
    };

    LocalStorage.update<ConsultationBooking>('bookings', selectedBooking.id, updates);
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, ...updates } : b));
    setSelectedBooking(prev => prev ? { ...prev, ...updates } : null);

    addNotification({
      userId: selectedBooking.userId,
      title: 'Call Scheduled',
      message: `A new ${newSlot.duration}-min call has been scheduled for your ${item.label} session on ${new Date(slotDate).toLocaleDateString()}.`,
      type: 'success'
    });

    toast.success('Call scheduled successfully');
    
    // Send email notification
    sendScheduledEmail(selectedBooking, newSlot);
    
    setIsSlotModalOpen(false);
    setSlotMeetingLink('');
    setSlotRecordingLink('');
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
                <TableHead className="text-right">Amount</TableHead>
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
                      <div className="space-y-1">
                        {booking.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] h-4 font-bold border-brand-gold/20 text-brand-gold bg-brand-gold/5">
                              {item.duration}m
                            </Badge>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase truncate max-w-[100px]">
                              {item.urgency}
                            </span>
                          </div>
                        ))}
                        {(!booking.items || booking.items.length === 0) && (
                          <>
                            <div className="text-sm font-medium">{booking.duration} min</div>
                            <div className="text-xs capitalize text-brand-gold">{booking.urgency}</div>
                          </>
                        )}
                      </div>
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
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-sm">{formatPrice(booking.totalPrice ?? 0)}</span>
                        <StatusBadge status={booking.status} type="booking" className="scale-75 origin-right" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-brand-gold"
                        onClick={() => openDetailModal(booking)}
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
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No bookings found.</div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-4 space-y-3 active:bg-muted/30 transition-colors" onClick={() => openDetailModal(booking)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{booking.userName}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {booking.items?.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-[8px] h-3 px-1 border-brand-gold/20 text-brand-gold">
                          {item.duration}m {item.urgency.charAt(0)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-brand-gold text-sm">{formatPrice(booking.totalPrice ?? 0)}</p>
                    <StatusBadge status={booking.status} type="booking" className="scale-75 origin-right" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-muted-foreground">
                    {booking.items?.reduce((a, b) => a + (b.slots?.length || 0), 0) || 0} calls scheduled
                  </div>
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
            <div className="space-y-2">
              <Label className="text-xs font-bold">Meeting Link <span className="text-red-500">*</span></Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={slotMeetingLink}
                onChange={e => setSlotMeetingLink(e.target.value)}
                className="bg-background/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Recording Link (Optional)</Label>
              <Input
                placeholder="https://drive.google.com/..."
                value={slotRecordingLink}
                onChange={e => setSlotRecordingLink(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSlotModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-brand-gold hover:bg-brand-gold/90 text-white" 
              onClick={handleAddSlot} 
              disabled={!slotDate || !slotTime || !slotMeetingLink}
            >
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
                        <div className="text-right space-y-1">
                          <p className="text-xs font-bold text-brand-gold">{item.duration} mins total</p>
                          <Select 
                            value={item.status || 'payment_verified'} 
                            onValueChange={(val) => handleUpdateItemStatus(idx, val as BookingStatus)}
                          >
                            <SelectTrigger className="h-6 text-[9px] w-[110px] bg-background/50 border-brand-gold/20">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border">
                              {ALL_BOOKING_STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="text-[10px] capitalize">{BOOKING_STATUS_CONFIG[s].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground font-medium">Used: {item.minutesUsed || 0}m | Remaining: {item.duration - (item.minutesUsed || 0)}m</p>
                        </div>
                      </div>

                      {/* Scheduled Calls per breakdown */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scheduled Calls</p>
                        <div className="space-y-1.5">
                              {item.slots?.length ? item.slots.map(slot => (
                                <div key={slot.id} className="space-y-4 p-4 rounded bg-brand-gold/5 border border-brand-gold/10">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap gap-2 flex-1">
                                      <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Date</Label>
                                        <Input
                                          type="date"
                                          value={itemDates[slot.id] || ''}
                                          onChange={e => setItemDates(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                          className="h-7 text-[10px] w-36 bg-background"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Time</Label>
                                        <Input
                                          type="time"
                                          value={itemTimes[slot.id] || ''}
                                          onChange={e => setItemTimes(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                          className="h-7 text-[10px] w-28 bg-background"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Duration</Label>
                                        <Badge variant="outline" className="h-7 px-2 text-[10px] bg-background border-border">
                                          {slot.duration}m
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3 pt-2 border-t border-brand-gold/10">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex-1 space-y-1">
                                        <Label className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Meeting Link</Label>
                                        <div className="flex items-center gap-2">
                                          <Video className="h-3 w-3 text-brand-gold" />
                                          <a 
                                            href={slot.meetingLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[10px] truncate max-w-[150px] font-mono text-brand-gold hover:text-brand-gold-light hover:underline transition-colors"
                                            title="Click to join call"
                                          >
                                            {slot.meetingLink}
                                          </a>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Minutes</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            value={itemMinutes[slot.id] || '0'}
                                            onChange={e => setItemMinutes(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                            className="h-7 w-16 bg-background text-[11px]"
                                          />
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="mt-4 h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                          onClick={() => handleDeleteSlot(idx, slot.id)}
                                          title="Delete Call"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Recording Link</Label>
                                  <div className="flex gap-1.5">
                                    <div className="relative flex-1">
                                      <Eye className="absolute left-2 top-2 h-2.5 w-2.5 text-muted-foreground" />
                                      <Input
                                        placeholder="https://drive.google.com/..."
                                        value={itemRecordings[slot.id] || ''}
                                        onChange={e => setItemRecordings(prev => ({ ...prev, [slot.id]: e.target.value }))}
                                        className="h-7 pl-6 bg-background text-[9px]"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => handleUpdateSlotDetails(idx, slot.id)}
                                      size="sm"
                                      className="h-7 bg-brand-gold hover:bg-brand-gold/90 text-white font-bold px-3 text-[9px] uppercase"
                                    >
                                      Update Details
                                    </Button>
                                </div>
                              </div>
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
          <DialogFooter />
        </DialogContent>
      </Dialog>
      {/* Cancellation Confirmation Modal */}
      <Dialog open={!!deleteConfirmInfo} onOpenChange={(open) => !open && setDeleteConfirmInfo(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Call</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this call? This will notify the customer via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The session balance will be updated, and a cancellation notification will be sent immediately.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmInfo(null)}>Keep Call</Button>
            <Button variant="destructive" onClick={executeDeleteSlot}>Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
