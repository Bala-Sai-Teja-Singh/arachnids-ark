'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, PlayCircle, Eye, Clock, MessageSquare, GraduationCap, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { VideoPlayer } from '@/components/shared/video-player';
import { LocalStorage } from '@/mock-db/storage';
import { useAuthStore } from '@/store/auth-store';
import type { ConsultationBooking } from '@/types';
import { formatPrice } from '@/constants/pricing';

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<ConsultationBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.id) return;
    const data = LocalStorage.getById<ConsultationBooking>('bookings', params.id as string);
    if (data && data.userId === user.id) {
      setBooking(data);
    }
    setLoading(false);
  }, [user, params.id]);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading details...</div>;

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Consultation Not Found</h2>
        <Button onClick={() => router.push('/dashboard/consultations')}>Back to Consultations</Button>
      </div>
    );
  }

  const remainingBalance = booking.duration - (booking.minutesUsed || 0);
  const usagePercentage = Math.min(100, ((booking.minutesUsed || 0) / booking.duration) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="ghost" onClick={() => router.push('/dashboard/consultations')} className="mb-6 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Consultations
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30 pb-4">
                <div>
                  <CardTitle className="text-xl font-bold">Consultation Details</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">ID: #{booking.id.toUpperCase()}</p>
                </div>
                <StatusBadge status={booking.status} type="booking" />
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Purchased Sessions</h4>
                      <div className="flex flex-wrap gap-2">
                        {booking.items?.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-brand-gold/10 text-brand-gold border-brand-gold/20">
                            {item.label} ({item.duration}m)
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {booking.query && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Initial Query
                        </h4>
                        <p className="text-sm italic text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border/50">
                          "{booking.query}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Card className="border-brand-gold/20 bg-brand-gold/5">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold flex items-center gap-2">
                          <Clock className="h-3 w-3" /> Talktime Usage
                        </h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Used</span>
                            <span className="font-bold text-brand-red">{booking.minutesUsed || 0}m</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining</span>
                            <span className="font-bold text-brand-gold">{remainingBalance}m</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-2">
                            <div
                              className="bg-brand-gold h-full transition-all duration-500"
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {booking.adminNote && (
                      <div className="p-3 rounded-lg border border-brand-gold/30 bg-brand-gold/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">Admin Note</h4>
                        <p className="text-sm font-medium">{booking.adminNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-gold" /> Scheduled Calls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.items?.flatMap(i => i.slots || []).length ? (
                booking.items.flatMap(i => i.slots || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((slot, idx) => (
                  <Card key={slot.id || idx} className="border-border bg-card/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{new Date(slot.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {slot.time} ({slot.duration} mins)
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={slot.status} type="booking" />
                        {slot.meetingLink && (
                          <a href={slot.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-brand-gold/30 hover:bg-brand-gold/10">
                              <Video className="h-3 w-3" /> Join Call
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-8 text-center rounded-xl border border-dashed border-border bg-muted/10">
                  <p className="text-sm text-muted-foreground italic">Your calls will be scheduled by our expert soon.</p>
                </div>
              )}
            </div>
          </motion.div>

          {booking.recordingUrl && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-border bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-brand-red" /> Session Recording
                    </CardTitle>
                    <Badge variant="outline" className="bg-brand-red/10 text-brand-red border-brand-red/20 text-[9px] uppercase font-black tracking-widest">Private Access</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-w-3xl mx-auto rounded-xl overflow-hidden border border-border shadow-2xl">
                    <VideoPlayer 
                      src={booking.recordingUrl} 
                      title={`Consultation Recording - ${new Date(booking.createdAt).toLocaleDateString()}`}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-4 italic flex items-center justify-center gap-2">
                    <Eye className="h-3 w-3" /> This recording is private and visible only to you.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card sticky top-24">
            <CardHeader className="pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Summary</h4>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date Booked</span>
                <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-bold text-brand-gold">{formatPrice(booking.totalPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Time</span>
                <span className="font-medium">{booking.duration} mins</span>
              </div>
              <hr className="border-border" />
              <div className="pt-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Need to reschedule? Please contact our support team at least 24 hours before your session.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
