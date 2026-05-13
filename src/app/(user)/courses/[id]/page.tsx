'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, GraduationCap, Clock, BookOpen, Lock, Unlock, CheckCircle, Heart, Star, Send, MessageSquare, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Db } from '@/lib/db';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { useReviewStore } from '@/store/review-store';
import { useCartStore } from '@/store/cart-store';
import { useFavoriteStore } from '@/store/favorite-store';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useModules } from '@/hooks/use-modules';
import { Separator } from '@/components/ui/separator';
import type { Course, CourseEnrollment, Order } from '@/types';
import { toast } from 'sonner';
import { formatPrice } from '@/constants/pricing';
import { VideoPlayer } from '@/components/shared/video-player';
import { getProxiedImageUrl } from '@/lib/utils';
import { ImageViewer } from '@/components/shared/molecules/image-viewer';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isVisible } = useModules();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { toggleLike, isLiked } = useFavoriteStore();
  const { addItem } = useCartStore();
  const { reviews, loadReviews, addReview } = useReviewStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  useEffect(() => {
      (async () => {
      const c = await Db.getById<Course>('courses', params.id as string);
      setCourse(c);
      setLoading(false);
      loadReviews(params.id as string, 'course');
  
      if (user && c) {
        const orders = await Db.getAll<Order>('orders');
        const enrollments = await Db.getAll<CourseEnrollment>('enrollments');
        
        const isEnrolled = enrollments.some(e => e.userId === user.id && e.courseId === c.id && e.status === 'enrolled');
        const hasPaidOrder = orders.some(
          (ord) => ord.userId === user.id && ord.items.some((item) => item.id === c.id && item.type === 'course') && ['payment_verified', 'order_shipped', 'order_completed'].includes(ord.status)
        );
        
        setHasPurchased(isEnrolled || hasPaidOrder);
      }
      })();
  }, [params.id, user, loadReviews]);

  if (loading) return <div className="container mx-auto px-4 py-8"><div className="h-96 animate-pulse bg-muted rounded-xl" /></div>;

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
        {isVisible('courses') && <Link href="/courses"><Button>Back to Courses</Button></Link>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        {isVisible('courses') && (
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Button>
        )}
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
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => toggleLike(course.id, 'course')}
                  className={`p-2 rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 ${isLiked(course.id, 'course')
                    ? 'bg-red-500 text-white border-red-400'
                    : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked(course.id, 'course') ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 shadow-xl">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  {course.likes || 0} Likes
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {course.duration}
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </motion.div>

          {/* Course Content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-bold mb-4">Course Video</h2>
            {hasPurchased && course.videoUrl ? (
              <div className="rounded-xl overflow-hidden border border-border bg-black shadow-2xl">
                <VideoPlayer 
                  src={course.videoUrl} 
                  title={course.title} 
                  userIdentifier={user ? `${user.email} | ${user.phone || 'No Phone'}` : undefined}
                />
              </div>
            ) : (
              <Card className="border-border bg-accent/5 overflow-hidden group">
                <CardContent className="p-0 relative aspect-video flex flex-col items-center justify-center text-center px-6">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                  <ImageViewer 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="absolute inset-0 w-full h-full"
                    imageClassName="transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="relative z-20 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-brand-red/90 flex items-center justify-center shadow-lg shadow-brand-red/20 group-hover:scale-110 transition-transform mx-auto">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-white">Content Locked</h3>
                      <p className="text-sm text-white/70 max-w-xs mx-auto">Purchase this course to unlock the full instructional video.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  'Full comprehensive video tutorial',
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

              {hasPurchased ? (
                <Button size="lg" disabled className="w-full bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle className="mr-2 h-5 w-5" /> Already Enrolled
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full bg-brand-red hover:bg-brand-red-light text-white font-bold h-14"
                  onClick={() => {
                    const success = addItem(course, 'course');
                    if (success) {
                      toast.success('Course added to cart!');
                      router.push('/checkout');
                    } else {
                      toast.info('This course is already in your cart');
                    }
                  }}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Enroll Now
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16 space-y-8 max-w-4xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-brand-red" />
            Course Reviews
          </h2>
          <div className="flex items-center gap-1 bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
            <Star className="h-4 w-4 text-brand-gold fill-brand-gold" />
            <span className="text-sm font-bold text-brand-gold">
              {reviews.filter(r => r.status === 'approved').length > 0
                ? (reviews.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.rating, 0) / reviews.filter(r => r.status === 'approved').length).toFixed(1)
                : 'No reviews'
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-border bg-card/50 h-fit">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                {isAuthenticated && user && (
                  <Avatar className="h-8 w-8 border border-brand-red/30">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-brand-red text-white text-[10px]">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <h3 className="font-semibold">Share your feedback</h3>
              </div>
              {isAuthenticated ? (
                hasPurchased ? (
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} className="hover:scale-110 transition-transform">
                          <Star className={`h-6 w-6 ${reviewRating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="What did you learn from this course?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-background/50"
                    />
                    <Button
                      className="w-full bg-brand-red text-white font-bold"
                      disabled={!reviewComment.trim() || submittingReview}
                      onClick={async () => {
                        setSubmittingReview(true);
                        await addReview({
                          targetId: course.id,
                          targetType: 'course',
                          userId: user!.id,
                          userName: user!.name,
                          userAvatar: user!.avatar,
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        toast.success('Review submitted for moderation!');
                        setReviewComment('');
                        setReviewRating(5);
                        setSubmittingReview(false);
                      }}
                    >
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Enroll in this course to leave a review.</p>
                )
              ) : (
                <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>Login to Review</Button>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {reviews.filter(r => r.status === 'approved').length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-accent/5">
                <p className="text-muted-foreground italic">No approved reviews yet.</p>
              </div>
            ) : (
              reviews.filter(r => r.status === 'approved').map((review) => (
                <Card key={review.id} className="border-border bg-card/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-brand-red/30">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback className="bg-brand-red text-white">
                            {review.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{review.userName}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-3 w-3 ${review.rating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      &quot;{review.comment}&quot;
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
