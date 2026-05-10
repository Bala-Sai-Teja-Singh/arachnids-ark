'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Upload, Check, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { LocalStorage } from '@/mock-db/storage';
import type { CourseEnrollment, SystemSettings } from '@/types';
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
    if (!user) return;
    const data = LocalStorage.getAll<CourseEnrollment>('enrollments')
      .filter(e => e.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setEnrollments(data);

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
        <h1 className="vibe-heading text-2xl font-bold mb-1">My Courses</h1>
        <p className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Track your course enrollments</p>
      </motion.div>

      {enrollments.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No enrollments yet" description="Browse our courses and start your learning journey." />
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr, i) => (
            <motion.div key={enr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium">{enr.courseTitle}</h3>
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
