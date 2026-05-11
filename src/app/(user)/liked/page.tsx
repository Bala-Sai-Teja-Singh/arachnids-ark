'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Bug, ArrowLeft, Trash2, GraduationCap, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/molecules/modal';
import { LocalStorage } from '@/mock-db/storage';
import type { Product, Course, CourseEnrollment } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useFavoriteStore } from '@/store/favorite-store';

const careLevelColors: Record<string, string> = {
  beginner: 'bg-green-500 text-black hover:bg-green-400',
  intermediate: 'bg-blue-500 text-white hover:bg-blue-400',
  advanced: 'bg-orange-500 text-black hover:bg-orange-400',
  expert: 'bg-red-500 text-white hover:bg-red-400',
};

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickSelectProduct, setQuickSelectProduct] = useState<Product | null>(null);
  const [selectedQuickSize, setSelectedQuickSize] = useState<number>(0);
  
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, user } = useAuthStore();
  const { likedIds, toggleLike } = useFavoriteStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/liked');
      return;
    }

    const allProducts = LocalStorage.getAll<Product>('products');
    const allCourses = LocalStorage.getAll<Course>('courses');
    const allEnrollments = LocalStorage.getAll<CourseEnrollment>('enrollments');
    setProducts(allProducts);
    setCourses(allCourses);
    setEnrollments(allEnrollments);
    setLoading(false);
  }, [isAuthenticated, router]);

  const likedProducts = useMemo(() => {
    return products.filter(p => likedIds.product.includes(p.id));
  }, [products, likedIds.product]);

  const likedCourses = useMemo(() => {
    return courses.filter(c => likedIds.course.includes(c.id));
  }, [courses, likedIds.course]);

  const totalFavorites = likedProducts.length + likedCourses.length;

  const handleUnlike = (e: React.MouseEvent, id: string, type: 'product' | 'course') => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(id, type);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.sizes && product.sizes.length > 0) {
      if (product.sizes.length === 1) {
        const size = product.sizes[0];
        addItem(product, 'product', { size, quantity: 1 });
        toast.success(`${product.name} added to cart!`, {
          description: `Size: ${size.size}`,
          icon: <ShoppingCart className="h-4 w-4" />,
        });
      } else {
        setQuickSelectProduct(product);
        setSelectedQuickSize(0);
      }
    }
  };

  const handleAddCourseToCart = (e: React.MouseEvent, course: Course) => {
    e.preventDefault();
    e.stopPropagation();
    const success = addItem(course, 'course');
    if (success) {
      toast.success('Course added to cart!');
    } else {
      toast.info('This course is already in your cart');
    }
  };

  const handleQuickAdd = () => {
    if (!quickSelectProduct) return;
    const size = quickSelectProduct.sizes[selectedQuickSize];
    addItem(quickSelectProduct, 'product', { size, quantity: 1 });
    toast.success(`${quickSelectProduct.name} added to cart`, {
      description: `Size: ${size.size} | Qty: 1`,
      icon: <ShoppingCart className="h-4 w-4" />,
    });
    setQuickSelectProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/shop" className="text-sm text-muted-foreground hover:text-brand-gold flex items-center gap-2 mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <h1 className="vibe-heading text-3xl sm:text-4xl font-bold">
            My <span className="text-gradient-red">Favorites</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            You have {totalFavorites} items in your wishlist
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 rounded-xl bg-card/20 animate-pulse border border-border" />
          ))}
        </div>
      ) : totalFavorites === 0 ? (
        <EmptyState 
          title="No favorites yet" 
          description="Start browsing the shop and courses to save items you love!"
          action={
            <div className="flex gap-4">
              <Link href="/shop">
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white font-bold px-8">
                  Browse Shop
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline" className="border-border px-8">
                  View Courses
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-12">
          {likedProducts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-brand-gold">
                <Bug className="h-5 w-5" /> Favorite Species
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {likedProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="vibe-card group overflow-hidden border-border bg-card/30 backdrop-blur-sm h-full flex flex-col">
                      <Link href={`/shop/${product.id}`} className="block relative h-48 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <Bug className="h-16 w-16 text-muted-foreground/20" />
                          </div>
                        )}
                        
                        <Badge className={`absolute top-3 right-3 z-10 border border-white/20 shadow-xl capitalize px-3 py-1 text-[10px] font-bold ${careLevelColors[product.careLevel]}`}>
                          {product.careLevel}
                        </Badge>

                        <button
                          onClick={(e) => handleUnlike(e, product.id, 'product')}
                          className="absolute bottom-3 left-3 z-10 p-2 rounded-full bg-red-500 text-white border border-red-400 shadow-xl transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Link>

                      <CardContent className="p-4 flex-1 flex flex-col gap-2">
                        <Link href={`/shop/${product.id}`}>
                          <h3 className="font-heading font-bold text-base group-hover:text-brand-gold transition-colors line-clamp-1 uppercase tracking-wide">{product.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground italic line-clamp-1">{product.scientificName}</p>

                        <div className="flex items-center justify-between mt-auto pt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Price</span>
                            <span className="text-lg font-bold text-brand-gold leading-none">
                              {product.sizes?.length > 0
                                ? formatPrice(Math.min(...product.sizes.map(s => s.price)))
                                : 'N/A'}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.available === false || !product.sizes?.some(s => s.stock > 0)}
                            className="bg-brand-red hover:bg-brand-red/90 text-white font-bold h-9 px-4 flex items-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" /> Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {likedCourses.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-brand-gold">
                <GraduationCap className="h-5 w-5" /> Favorite Courses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {likedCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="vibe-card group overflow-hidden border-border bg-card/30 backdrop-blur-sm h-full flex flex-col">
                      <Link href={`/courses/${course.id}`} className="block relative h-48 overflow-hidden">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <Badge className="absolute top-3 right-3 z-10 bg-brand-gold text-black border border-brand-gold/30 shadow-xl px-3 py-1 text-[10px] font-bold">
                          Course
                        </Badge>
                        <button
                          onClick={(e) => handleUnlike(e, course.id, 'course')}
                          className="absolute bottom-3 left-3 z-10 p-2 rounded-full bg-red-500 text-white border border-red-400 shadow-xl transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Link>

                      <CardContent className="p-4 flex-1 flex flex-col gap-2">
                        <Link href={`/courses/${course.id}`}>
                          <h3 className="font-heading font-bold text-base group-hover:text-brand-gold transition-colors line-clamp-1 uppercase tracking-wide">{course.title}</h3>
                        </Link>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {course.duration}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Price</span>
                            <span className="text-lg font-bold text-brand-gold leading-none">
                              {formatPrice(course.price)}
                            </span>
                          </div>

                          {user && enrollments.some(e => e.courseId === course.id && e.status === 'enrolled') ? (
                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                              <CheckCircle className="h-3 w-3" /> Enrolled
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => handleAddCourseToCart(e, course)}
                              className="bg-brand-red hover:bg-brand-red/90 text-white font-bold h-9 px-4 flex items-center gap-2"
                            >
                              <ShoppingCart className="h-4 w-4" /> Add
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Quick Select Modal */}
      <Modal 
        isOpen={!!quickSelectProduct} 
        onClose={() => setQuickSelectProduct(null)}
        variant="small"
        title="Select Size"
        footer={(
          <Button onClick={handleQuickAdd} className="w-full bg-brand-gold hover:bg-brand-gold/90 text-black font-bold h-12">
            Add to Cart
          </Button>
        )}
      >
        {quickSelectProduct && (
          <div className="space-y-4">
            <div className="flex gap-4 items-center mb-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden border border-border">
                <img src={quickSelectProduct.images?.[0]} alt={quickSelectProduct.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-tight">{quickSelectProduct.name}</h4>
                <p className="text-xs text-muted-foreground italic">{quickSelectProduct.scientificName}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickSelectProduct.sizes?.map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedQuickSize(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedQuickSize === idx 
                      ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold' 
                      : 'border-border bg-card/40 hover:bg-card/60'
                  }`}
                >
                  <span className="font-medium text-sm">{size.size}</span>
                  <span className="font-bold text-brand-gold">{formatPrice(size.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
