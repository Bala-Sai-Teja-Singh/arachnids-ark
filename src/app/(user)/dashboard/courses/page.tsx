'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Upload, Check, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/shared/atoms/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/molecules/status-badge';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import { SectionHeader } from '@/components/shared/molecules/section-header';
import { useAuthStore } from '@/store/auth-store';
import { Db } from '@/lib/db';
import type { CourseEnrollment, Order, OrderStatus, SystemSettings } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [selectedUPI, setSelectedUPI] = useState<string>('');
  const [copiedUPI, setCopiedUPI] = useState(false);

  useEffect(() => {
      (async () => {
      if (!user) return;
  
      // --- SELF-HEALING SYNC LOGIC ---
      // Check for paid orders that might have missed the enrollment trigger
      const orders = await Db.getAll<Order>('orders');
      const existingEnrollments = await Db.getAll<CourseEnrollment>('enrollments');
      const paidStatuses: OrderStatus[] = ['payment_verified', 'order_shipped', 'order_completed'];
  
      let syncNeeded = false;
      for (const order of orders.filter(o => o.userId === user.id && paidStatuses.includes(o.status))) {
        for (const item of order.items) {
          if (item.type === 'course') {
            const alreadyEnrolled = existingEnrollments.some(e => e.userId === user.id && e.courseId === item.id);
            if (!alreadyEnrolled) {
              await Db.create<CourseEnrollment>('enrollments', {
                id: `enr-${Date.now()}-${item.id}`,
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                courseId: item.id,
                courseTitle: item.name,
                status: 'enrolled',
                totalPrice: item.price,
                orderId: order.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as CourseEnrollment);
              syncNeeded = true;
            }
          }
        }
      }
  
      if (syncNeeded) {
        toast.success('Course list synchronized!');
      }
      // --- END SYNC LOGIC ---
  
      const allEnrollments = await Db.getAll<CourseEnrollment>('enrollments');
      const data = allEnrollments
        .filter(e => e.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEnrollments(data);
  
      const settingsData = await Db.getSettings<SystemSettings>('system_settings');
      if (settingsData) {
        setSystemSettings(settingsData);
        const defaultUPI = settingsData.upiIds.find(u => u.isDefault) || settingsData.upiIds[0];
        if (defaultUPI) setSelectedUPI(defaultUPI.value);
      }
      })();
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  return (
    <div>

      {enrollments.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No enrollments yet" description="Browse our courses and start your learning journey." />
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr, i) => (
            <motion.div key={enr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/courses/${enr.courseId}`}>
                <Card className="border-border hover:border-brand-gold/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-medium group-hover:text-brand-gold transition-colors">{enr.courseTitle}</h3>
                        <p className="text-xs text-muted-foreground">{new Date(enr.createdAt).toLocaleDateString()}</p>
                        {enr.adminNote && <p className="text-xs text-brand-gold">Admin: {enr.adminNote}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-brand-gold">{formatPrice(enr.totalPrice)}</span>
                        <StatusBadge status={enr.status} type="enrollment" />
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
