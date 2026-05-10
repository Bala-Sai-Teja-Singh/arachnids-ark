'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Upload, Check, Copy, PlayCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VideoPlayer } from '@/components/shared/video-player';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { LocalStorage } from '@/mock-db/storage';
import type { ConsultationBooking, SystemSettings } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationStore } from '@/store/notification-store';
import { Badge } from '@/components/ui/badge';

export default function MyConsultationsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [selectedUPI, setSelectedUPI] = useState<string>('');
  const [copiedUPI, setCopiedUPI] = useState(false);

  useEffect(() => {
    if (!user) return;
    const data = LocalStorage.getAll<ConsultationBooking>('bookings')
      .filter(b => b.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(data);

    const settingsData = LocalStorage.getAll<SystemSettings>('system_settings');
    if (settingsData.length > 0) {
      setSystemSettings(settingsData[0]);
      const defaultUPI = settingsData[0].upiIds.find(u => u.isDefault) || settingsData[0].upiIds[0];
      if (defaultUPI) setSelectedUPI(defaultUPI.value);
    }
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
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
                      <h3 className="font-bold text-lg">Total Balance: {booking.duration} mins</h3>
                      <div className="flex flex-wrap gap-2 py-1">
                        {booking.items?.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-brand-gold/10 text-brand-gold border-brand-gold/20 text-[10px] uppercase">
                            {item.label} ({item.duration}m)
                          </Badge>
                        ))}
                      </div>
                      {booking.query && <p className="text-xs text-muted-foreground line-clamp-1 italic">"{booking.query}"</p>}
                      {booking.adminNote && <p className="text-xs text-brand-gold font-medium">Admin Note: {booking.adminNote}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-gold">{formatPrice(booking.totalPrice || 0)}</span>
                      <StatusBadge status={booking.status} type="booking" />
                    </div>
                  </div>

                  {/* Scheduled Calls & Usage */}
                  <div className="mt-4 pt-4 border-t border-border space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-brand-gold" />
                            Scheduled Calls
                          </p>
                          <div className="space-y-2">
                            {booking.items?.flatMap(i => i.slots || []).length ? (
                              booking.items.flatMap(i => i.slots || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(slot => (
                                <div key={slot.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/5 border border-border text-xs">
                                  <div>
                                    <p className="font-bold">{new Date(slot.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    <p className="text-muted-foreground">{slot.time}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[8px]">{slot.duration} mins</Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic">Your calls will be scheduled by the admin soon.</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <PlayCircle className="h-3 w-3 text-brand-red" />
                            Talktime Usage
                          </p>
                          <div className="p-3 rounded-lg bg-brand-gold/5 border border-brand-gold/10 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Total Minutes Used</span>
                              <span className="font-bold text-brand-red">{booking.minutesUsed || 0}m</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Remaining Balance</span>
                              <span className="font-bold text-brand-gold">{booking.duration - (booking.minutesUsed || 0)}m</span>
                            </div>
                            <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-2">
                              <div
                                className="bg-brand-gold h-full transition-all duration-500"
                                style={{ width: `${Math.min(100, ((booking.minutesUsed || 0) / booking.duration) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recording Section */}
                      {booking.recordingUrl && (
                        <div className="space-y-3 pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Eye className="h-3 w-3 text-brand-gold" />
                              Session Recording
                            </p>
                            <Badge variant="outline" className="bg-brand-red/10 text-brand-red border-brand-red/20 text-[9px] uppercase font-black">Private</Badge>
                          </div>
                          <div className="max-w-2xl mx-auto">
                            <VideoPlayer 
                              src={booking.recordingUrl} 
                              title={`Session Recording - ${new Date(booking.createdAt).toLocaleDateString()}`}
                            />
                          </div>
                          <p className="text-[10px] text-center text-muted-foreground italic">
                            This recording is private and visible only to you.
                          </p>
                        </div>
                      )}
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
