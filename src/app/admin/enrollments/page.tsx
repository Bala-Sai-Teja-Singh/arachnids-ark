'use client';

import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalStorage } from '@/mock-db/storage';
import { useNotificationStore } from '@/store/notification-store';
import { Input } from '@/components/ui/input';
import type { CourseEnrollment, EnrollmentStatus, Course } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { ALL_ENROLLMENT_STATUSES, ENROLLMENT_STATUS_CONFIG } from '@/constants/statuses';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, Mail, Calendar, CreditCard, BookOpen, Clock, Smartphone, MapPin } from 'lucide-react';

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState<CourseEnrollment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    setEnrollments(LocalStorage.getAll<CourseEnrollment>('enrollments').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const updateStatus = (id: string, status: EnrollmentStatus, userId: string, courseId: string) => {
    LocalStorage.update<CourseEnrollment>('enrollments', id, { status });
    // Refresh background content
    setEnrollments(LocalStorage.getAll<CourseEnrollment>('enrollments').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Course Enrollments</h1>
          <p className="text-muted-foreground text-sm">Manage hobbyist enrollments and course access.</p>
        </div>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by hobbyist name, email or phone..." 
            className="pl-10 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30 hover:bg-transparent">
                <TableHead className="font-bold">Hobbyist</TableHead>
                <TableHead className="font-bold">Course</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Amount</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments
                .filter(e => {
                  const query = searchQuery.toLowerCase();
                  return (
                    e.userName?.toLowerCase().includes(query) ||
                    e.userEmail?.toLowerCase().includes(query) ||
                    (e as any).userPhone?.includes(query) ||
                    e.id.toLowerCase().includes(query) ||
                    e.courseTitle.toLowerCase().includes(query)
                  );
                })
                .length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No enrollments found.</TableCell>
                </TableRow>
              ) : (
                enrollments
                  .filter(e => {
                    const query = searchQuery.toLowerCase();
                    return (
                      e.userName?.toLowerCase().includes(query) ||
                      e.userEmail?.toLowerCase().includes(query) ||
                      (e as any).userPhone?.includes(query) ||
                      e.id.toLowerCase().includes(query) ||
                      e.courseTitle.toLowerCase().includes(query)
                    );
                  })
                  .map((enr) => (
                  <TableRow key={enr.id} className="border-border hover:bg-muted/5 group transition-colors">
                    <TableCell>
                      <div className="font-medium">{enr.userName}</div>
                      <div className="text-xs text-muted-foreground">{enr.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{enr.courseTitle}</TableCell>
                    <TableCell className="text-xs">{new Date(enr.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{formatPrice(enr.totalPrice)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-brand-gold h-8 w-8"
                        onClick={() => setSelectedEnrollment(enr)}
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

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-border">
          {enrollments
            .filter(e => {
              const query = searchQuery.toLowerCase();
              return (
                e.userName?.toLowerCase().includes(query) ||
                e.userEmail?.toLowerCase().includes(query) ||
                (e as any).userPhone?.includes(query) ||
                e.id.toLowerCase().includes(query) ||
                e.courseTitle.toLowerCase().includes(query)
              );
            })
            .map((enr) => (
            <div key={enr.id} className="p-4 space-y-4">
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
          ))}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEnrollment} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
        <DialogContent className="glass border-border sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-gradient">Enrollment Details</DialogTitle>
            <DialogDescription>
              Course access request for {selectedEnrollment?.courseTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedEnrollment && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
