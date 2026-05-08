'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, Clock, BookOpen, Lock, Unlock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { LocalStorage } from '@/mock-db/storage';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import type { Course, CourseEnrollment } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);

  useEffect(() => {
    const c = LocalStorage.getById<Course>('courses', params.id as string);
    setCourse(c);
    setLoading(false);
  }, [params.id]);

  const handleEnroll = () => {
    if (!isAuthenticated || !user || !course) {
      toast.error('Please login to enroll');
      router.push('/login');
      return;
    }

    // Check if already enrolled
    const enrollments = LocalStorage.getAll<CourseEnrollment>('enrollments');
    const existing = enrollments.find(e => e.userId === user.id && e.courseId === course.id);
    if (existing) {
      toast.error('You are already enrolled in this course');
      setEnrollOpen(false);
      return;
    }

    const enrollment: CourseEnrollment = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      courseId: course.id,
      courseTitle: course.title,
      status: 'pending',
      totalPrice: course.price,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    LocalStorage.create('enrollments', enrollment);
    addNotification({
      userId: user.id,
      title: 'Enrollment Requested',
      message: `Your enrollment request for "${course.title}" has been submitted.`,
      type: 'success',
    });

    // Notify Admin
    addNotification({
      userId: 'admin',
      title: 'New Course Enrollment',
      message: `${user.name} requested enrollment for "${course.title}".`,
      type: 'info',
    });
    toast.success('Enrollment request submitted!');
    setEnrollOpen(false);
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><div className="h-96 animate-pulse bg-muted rounded-xl" /></div>;

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
        <Link href="/courses"><Button>Back to Courses</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Hero */}
            <div className="h-64 rounded-xl bg-gradient-to-br from-brand-gold/20 via-background to-brand-red/10 relative overflow-hidden flex items-center justify-center border border-border mb-6">
              <GraduationCap className="h-24 w-24 text-brand-gold/20" />
              <Badge className="absolute top-4 left-4 bg-brand-gold/20 text-brand-gold border-brand-gold/30">
                {course.difficulty}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {course.duration}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" /> {course.modules.length} modules
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </motion.div>

          {/* Modules */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-bold mb-4">Course Modules</h2>
            <div className="space-y-3">
              {course.modules.map((mod, i) => (
                <Card key={mod.id} className={`border-border ${mod.locked ? 'opacity-70' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      mod.locked ? 'bg-muted' : 'bg-brand-gold/10'
                    }`}>
                      {mod.locked ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Unlock className="h-4 w-4 text-brand-gold" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Module {i + 1}</span>
                        {!mod.locked && <Badge variant="outline" className="text-[10px] border-green-400/30 text-green-400">Preview</Badge>}
                      </div>
                      <h3 className="font-medium text-sm mt-1">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border bg-card sticky top-24">
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-3xl font-bold text-brand-gold">{formatPrice(course.price)}</span>
                <p className="text-xs text-muted-foreground mt-1">Lifetime access</p>
              </div>

              <Separator className="bg-accent/50" />

              <ul className="space-y-3">
                {[
                  `${course.modules.length} comprehensive modules`,
                  'Lifetime access to content',
                  'Certificate of completion',
                  'Community access',
                  'Email support',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
                <DialogTrigger render={<Button size="lg" className="w-full bg-brand-red hover:bg-brand-red-light text-white" />}>
                  Enroll Now
                </DialogTrigger>
                <DialogContent className="glass border-border">
                  <DialogHeader>
                    <DialogTitle>Enroll in {course.title}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="p-4 rounded-lg bg-background/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Course</span>
                        <span>{course.title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{course.duration}</span>
                      </div>
                      <Separator className="bg-accent/50" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-brand-gold">{formatPrice(course.price)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      After enrollment, our team will share payment details. Once payment is verified, you&apos;ll get full access to the course.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
                    <Button onClick={handleEnroll} className="bg-brand-red hover:bg-brand-red-light text-white">
                      Submit Enrollment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
