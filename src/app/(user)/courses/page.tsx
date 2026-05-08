'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { LocalStorage } from '@/mock-db/storage';
import type { Course } from '@/types';
import { formatPrice } from '@/constants/pricing';

const diffColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10',
  intermediate: 'text-blue-400 bg-blue-400/10',
  advanced: 'text-orange-400 bg-orange-400/10',
  expert: 'text-red-400 bg-red-400/10',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCourses(LocalStorage.getAll<Course>('courses'));
      setLoading(false);
    }, 300);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge variant="outline" className="border-brand-gold/30 text-brand-gold mb-4">
          <GraduationCap className="h-3 w-3 mr-2" />
          Expert Courses
        </Badge>
        <h1 className="text-3xl font-bold mb-2">
          Tarantula <span className="text-gradient">Courses</span>
        </h1>
        <p className="text-muted-foreground">
          Master the art of tarantula keeping with our comprehensive courses
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/courses/${course.id}`}>
                <Card className="group overflow-hidden border-border bg-card hover:border-brand-gold/30 transition-all duration-500 h-full hover:shadow-[0_0_30px_-5px_rgba(197,150,58,0.15)]">
                  <div className="h-44 bg-gradient-to-br from-brand-gold/20 via-background to-brand-red/10 relative overflow-hidden flex items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-brand-gold/20 group-hover:scale-110 transition-transform duration-500" />
                    <Badge className={`absolute top-3 left-3 ${diffColors[course.difficulty]}`}>
                      {course.difficulty}
                    </Badge>
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{course.duration}</span>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-lg group-hover:text-brand-gold transition-colors">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.contentPreview}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {course.modules.length} modules
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xl font-bold text-brand-gold">{formatPrice(course.price)}</span>
                      <span className="text-xs text-brand-red font-medium">Enroll Now →</span>
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
