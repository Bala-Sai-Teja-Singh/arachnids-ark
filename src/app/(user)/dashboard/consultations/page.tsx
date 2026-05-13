'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/molecules/status-badge';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { Db } from '@/lib/db';
import type { ConsultationBooking } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { Badge } from '@/components/ui/badge';

export default function MyConsultationsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
    if (!user) return;
    const allBookings = await Db.getAll<ConsultationBooking>('bookings');
    const data = allBookings
      .filter(b => b.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookings(data);
    setLoading(false);
  })();
  }, [user]);

  return (
    <div className="container mx-auto">

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-24 w-full bg-card/20 animate-pulse rounded-xl border border-border" />)}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={Calendar} title="No consultations yet" description="Book a consultation with our experts to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/dashboard/consultations/${booking.id}`}>
                <Card className="border-border hover:border-brand-gold/50 transition-all duration-300 cursor-pointer group hover:bg-card/40">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg group-hover:text-brand-gold transition-colors">Consultation #{booking.id.slice(-6).toUpperCase()}</h3>
                          <StatusBadge status={booking.status} type="booking" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {booking.items?.map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-brand-gold/10 text-brand-gold border-brand-gold/20 text-[10px] font-bold">
                              {item.label} ({item.duration}m)
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Purchased on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Time Balance</p>
                          <p className="text-base font-bold text-brand-gold">
                            {booking.duration - (booking.minutesUsed || 0)} <span className="text-xs font-normal text-muted-foreground">/ {booking.duration}m</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Price</p>
                          <p className="text-sm font-bold">{formatPrice(booking.totalPrice || 0)}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold group-hover:text-black transition-all">
                          <Eye className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
