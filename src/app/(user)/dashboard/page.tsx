'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, GraduationCap, Calendar, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { LocalStorage } from '@/mock-db/storage';
import type { Order, CourseEnrollment, ConsultationBooking } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ orders: 0, courses: 0, consultations: 0, pending: 0 });
  useEffect(() => {
    if (!user) return;
    const orders = LocalStorage.getAll<Order>('orders').filter(i => i.userId === user.id);
    const enrollments = LocalStorage.getAll<CourseEnrollment>('enrollments').filter(e => e.userId === user.id);
    const bookings = LocalStorage.getAll<ConsultationBooking>('bookings').filter(b => b.userId === user.id);
    const pending = [...orders, ...enrollments, ...bookings].filter(i => ['pending', 'awaiting_payment', 'payment_uploaded'].includes(i.status)).length;
    setTimeout(() => {
      setStats({ orders: orders.length, courses: enrollments.length, consultations: bookings.length, pending });
    }, 0);
  }, [user]);

  const cards = [
    { label: 'Orders', value: stats.orders, icon: ShoppingBag, color: 'from-brand-red/20 to-brand-red/5', iconColor: 'text-brand-red' },
    { label: 'Courses', value: stats.courses, icon: GraduationCap, color: 'from-brand-gold/20 to-brand-gold/5', iconColor: 'text-brand-gold' },
    { label: 'Consultations', value: stats.consultations, icon: Calendar, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
    { label: 'Pending Action', value: stats.pending, icon: ClipboardList, color: 'from-yellow-500/20 to-yellow-500/5', iconColor: 'text-yellow-400' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground text-sm mb-6">Here&apos;s an overview of your activity</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-border overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 + 0.3, type: 'spring' }}
                    className="text-2xl font-bold"
                  >
                    {card.value}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
