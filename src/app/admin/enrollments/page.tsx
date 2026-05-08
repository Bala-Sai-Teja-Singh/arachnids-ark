'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalStorage } from '@/mock-db/storage';
import { useNotificationStore } from '@/store/notification-store';
import type { CourseEnrollment, EnrollmentStatus, Course } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { ALL_STATUSES } from '@/constants/statuses';
import { toast } from 'sonner';

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    setEnrollments(LocalStorage.getAll<CourseEnrollment>('enrollments').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const updateStatus = (id: string, status: EnrollmentStatus, userId: string, courseId: string) => {
    LocalStorage.update<CourseEnrollment>('enrollments', id, { status });
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    
    // If status is completed/verified, also unlock modules in course for user (handled abstractly here)
    if (status === 'verified' || status === 'completed') {
      addNotification({
        userId,
        title: 'Course Unlocked!',
        message: `Your enrollment has been verified. You now have full access to the course.`,
        type: 'success'
      });
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Enrollments</h1>
        <p className="text-muted-foreground">Manage student enrollments and course access.</p>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enr) => (
                <TableRow key={enr.id} className="border-border">
                  <TableCell>
                    <div className="font-medium">{enr.userName}</div>
                    <div className="text-xs text-muted-foreground">{enr.userEmail}</div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{enr.courseTitle}</TableCell>
                  <TableCell className="text-xs">{new Date(enr.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{formatPrice(enr.totalPrice)}</TableCell>
                  <TableCell>
                    <Select value={enr.status} onValueChange={(val) => val && updateStatus(enr.id, val as EnrollmentStatus, enr.userId, enr.courseId)}>
                      <SelectTrigger className="h-8 text-xs w-[140px] border-border">
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
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand-gold">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
