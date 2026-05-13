'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Db } from '@/lib/db';
import { useNotificationStore } from '@/store/notification-store';
import { Input } from '@/components/shared/atoms/input';
import type { CourseEnrollment, EnrollmentStatus, Course } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { ALL_ENROLLMENT_STATUSES, ENROLLMENT_STATUS_CONFIG } from '@/constants/statuses';
import { toast } from 'sonner';
import { Modal } from '@/components/shared/molecules/modal';
import { TableMolecule } from '@/components/shared/molecules/table';
import { User, Mail, Calendar, CreditCard, BookOpen, Clock, Smartphone, MapPin, Eye, Search } from 'lucide-react';

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    (async () => {
    setEnrollments((await Db.getAll<CourseEnrollment>('enrollments')).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  })();
  }, []);

  const updateStatus = async (id: string, status: EnrollmentStatus, userId: string, courseId: string) => {
    await Db.update<CourseEnrollment>('enrollments', id, { status });
    // Refresh background content
    setEnrollments((await Db.getAll<CourseEnrollment>('enrollments')).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    // If status is enrolled, also unlock modules in course for user (handled abstractly here)
    if (status === 'enrolled') {
      const enr = enrollments.find(e => e.id === id);
      if (enr) {
        // Trigger course unlocked email
        fetch('/api/emails/course-unlocked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: enr.userEmail,
            userName: enr.userName,
            courses: [enr.courseTitle],
            enrollmentId: enr.id
          })
        }).catch(console.error);

        addNotification({
          userId,
          title: 'Course Unlocked!',
          message: `Your enrollment has been verified. You now have full access to the course.`,
          type: 'success'
        });
      }
    } else {
      addNotification({
        userId,
        title: 'Enrollment Status Updated',
        message: `Your course enrollment status has been updated to ${status.replace('_', ' ')}`,
        type: 'info'
      });
    }

    toast.success('Status updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search by hobbyist name, email or phone..."
            className="bg-card border-border h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="h-4 w-4 text-muted-foreground" />}
            isClearable
            onClear={() => setSearchQuery('')}
          />
        </div>
      </div>

      <TableMolecule
        data={enrollments.filter(e => {
          const query = searchQuery.toLowerCase();
          return (
            e.userName?.toLowerCase().includes(query) ||
            e.userEmail?.toLowerCase().includes(query) ||
            (e as any).userPhone?.includes(query) ||
            e.id.toLowerCase().includes(query) ||
            e.courseTitle.toLowerCase().includes(query)
          );
        })}
        columns={[
          {
            header: 'Hobbyist',
            cell: (enr) => (
              <>
                <div className="font-medium">{enr.userName}</div>
                <div className="text-xs text-muted-foreground">{enr.userEmail}</div>
              </>
            )
          },
          {
            header: 'Course',
            cell: (enr) => <div className="font-medium max-w-[200px] truncate">{enr.courseTitle}</div>
          },
          {
            header: 'Date',
            cell: (enr) => <span className="text-xs">{new Date(enr.createdAt).toLocaleDateString()}</span>
          },
          {
            header: 'Amount',
            cell: (enr) => formatPrice(enr.totalPrice)
          },
          {
            header: 'Status',
            cell: (enr) => (
              <Select value={enr.status} onValueChange={(val) => val && updateStatus(enr.id, val as EnrollmentStatus, enr.userId, enr.courseId)}>
                <SelectTrigger className="h-8 text-xs w-[140px] border-border bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {ALL_ENROLLMENT_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{ENROLLMENT_STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            cell: (enr) => (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-brand-gold h-8 w-8"
                onClick={() => setSelectedEnrollment(enr)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )
          }
        ]}
        renderMobileItem={(enr) => (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm">{enr.userName}</h3>
                <p className="text-[10px] text-muted-foreground">{enr.userEmail}</p>
              </div>
              {(() => {
                const config = ENROLLMENT_STATUS_CONFIG[enr.status as EnrollmentStatus] || ENROLLMENT_STATUS_CONFIG.enrolled;
                return (
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <BookOpen className="h-3 w-3 text-brand-gold" />
              <p className="text-xs font-medium truncate">{enr.courseTitle}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(enr.createdAt).toLocaleDateString()}
              </div>
              <p className="text-sm font-bold text-brand-gold">{formatPrice(enr.totalPrice)}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Select value={enr.status} onValueChange={(val) => val && updateStatus(enr.id, val as EnrollmentStatus, enr.userId, enr.courseId)}>
                <SelectTrigger className="h-9 text-xs flex-1 border-border bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {ALL_ENROLLMENT_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{ENROLLMENT_STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 text-muted-foreground border-border"
                onClick={() => setSelectedEnrollment(enr)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        emptyDescription="No enrollments found."
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
        variant="extra-large"
        title="Enrollment Details"
        description={`Course access request for ${selectedEnrollment?.courseTitle}`}
      >
        {selectedEnrollment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border/50 pb-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enrollment ID</p>
                <p className="text-sm font-mono">{selectedEnrollment.id.slice(0, 8)}</p>
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</p>
                <p className="text-sm">{new Date(selectedEnrollment.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
                <User className="h-3 w-3" /> Hobbyist Information
              </h4>
              <div className="p-4 rounded-xl border border-border bg-background/30 space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium">{selectedEnrollment.userName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="text-sm font-medium">{selectedEnrollment.userEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedEnrollment.paymentScreenshot && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Payment Verification
                </h4>
                <div className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                  <img
                    src={selectedEnrollment.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white" onClick={() => window.open(selectedEnrollment.paymentScreenshot, '_blank')}>
                      View Full Image
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-xl bg-brand-gold/5 border border-brand-gold/20">
              <div className="text-sm">
                <span className="text-muted-foreground">Course Fee</span>
              </div>
              <div className="text-xl font-bold text-brand-gold">
                {formatPrice(selectedEnrollment.totalPrice)}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Update Access Status</p>
              <div className="flex gap-2">
                <Select
                  value={selectedEnrollment.status}
                  onValueChange={(val) => val && updateStatus(selectedEnrollment.id, val as EnrollmentStatus, selectedEnrollment.userId, selectedEnrollment.courseId)}
                >
                  <SelectTrigger className="flex-1 border-border bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {ALL_ENROLLMENT_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{ENROLLMENT_STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="bg-brand-red text-white" onClick={() => setSelectedEnrollment(null)}>Done</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
