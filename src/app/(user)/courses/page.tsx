'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Clock, BookOpen, Heart, ShoppingCart, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useFavoriteStore } from '@/store/favorite-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { LocalStorage } from '@/mock-db/storage';
import { useAuthStore } from '@/store/auth-store';
import type { Course, CourseEnrollment } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';

const diffColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-400/10',
  intermediate: 'text-blue-400 bg-blue-400/10',
  advanced: 'text-orange-400 bg-orange-400/10',
  expert: 'text-red-400 bg-red-400/10',
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const { toggleLike, isLiked } = useFavoriteStore();
  const { user } = useAuthStore();

  useEffect(() => {
    setTimeout(() => {
      setCourses(LocalStorage.getAll<Course>('courses'));
      setEnrollments(LocalStorage.getAll<CourseEnrollment>('enrollments'));
      setLoading(false);
    }, 300);
  }, []);

  return (
    <div className="container mx-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Badge variant="outline" className="border-brand-gold/30 text-brand-gold mb-2">
          <GraduationCap className="h-3 w-3 mr-2" />
          Expert Courses
        </Badge>
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

                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLike(course.id, 'course');
                      }}
                      className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 ${isLiked(course.id, 'course')
                          ? 'bg-red-500 text-white border-red-400'
                          : 'bg-black/60 text-white hover:bg-black/80'
                        }`}
                    >
                      <Heart className={`h-3 w-3 ${isLiked(course.id, 'course') ? 'fill-current' : ''}`} />
                    </button>

                    {/* Like Count */}
                    <div className="absolute bottom-3 right-12 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-2 py-0.5 shadow-xl">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                        {course.likes || 0}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-lg group-hover:text-brand-gold transition-colors">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.contentPreview}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xl font-bold text-brand-gold">{formatPrice(course.price)}</span>
                      {user && enrollments.some(e => e.courseId === course.id && e.status === 'enrolled') ? (
                        <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const success = addItem(course, 'course');
                            if (success) {
                              toast.success('Course added to cart!');
                            } else {
                              toast.info('This course is already in your cart');
                            }
                          }}
                          className="text-xs text-brand-red font-medium flex items-center gap-1 hover:underline"
                        >
                          <ShoppingCart className="h-3 w-3" /> Add to Cart
                        </button>
                      )}
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
