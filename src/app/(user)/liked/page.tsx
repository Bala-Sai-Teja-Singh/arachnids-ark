'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Bug, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LocalStorage } from '@/mock-db/storage';
import type { Product } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

const careLevelColors: Record<string, string> = {
  beginner: 'bg-green-500 text-black hover:bg-green-400',
  intermediate: 'bg-blue-500 text-white hover:bg-blue-400',
  advanced: 'bg-orange-500 text-black hover:bg-orange-400',
  expert: 'bg-red-500 text-white hover:bg-red-400',
};

export default function LikedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickSelectProduct, setQuickSelectProduct] = useState<Product | null>(null);
  const [selectedQuickSize, setSelectedQuickSize] = useState<number>(0);
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/liked');
      return;
    }

    const all = LocalStorage.getAll<Product>('products');
    setProducts(all);
    
    const savedLikes = localStorage.getItem('arachnidsark_liked_products');
    if (savedLikes) {
      setLikedIds(JSON.parse(savedLikes));
    }
    setLoading(false);
  }, [isAuthenticated, router]);

  const likedProducts = useMemo(() => {
    return products.filter(p => likedIds.includes(p.id));
  }, [products, likedIds]);

  const handleUnlike = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newLikedIds = likedIds.filter(id => id !== productId);
    setLikedIds(newLikedIds);
    localStorage.setItem('arachnidsark_liked_products', JSON.stringify(newLikedIds));
    
    // Update the like count in the mock database
    const product = products.find(p => p.id === productId);
    if (product) {
      const newLikes = Math.max(0, (product.likes || 0) - 1);
      LocalStorage.update<Product>('products', productId, { likes: newLikes });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes: newLikes } : p));
    }
    
    toast.info('Removed from liked products');
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.sizes && product.sizes.length > 0) {
      if (product.sizes.length === 1) {
        // If only one size, add directly
        const size = product.sizes[0];
        addItem(product, size, 1);
        toast.success(`${product.name} added to cart!`, {
          description: `Size: ${size.size}`,
          icon: <ShoppingCart className="h-4 w-4" />,
        });
      } else {
        // Otherwise open quick select
        setQuickSelectProduct(product);
        setSelectedQuickSize(0);
      }
    }
  };

  const handleQuickAdd = () => {
    if (!quickSelectProduct) return;
    const size = quickSelectProduct.sizes[selectedQuickSize];
    addItem(quickSelectProduct, size, 1);
    toast.success(`${quickSelectProduct.name} added to cart`, {
      description: `Size: ${size.size} | Qty: 1`,
      icon: <ShoppingCart className="h-4 w-4" />,
    });
    setQuickSelectProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/shop" className="text-sm text-muted-foreground hover:text-brand-gold flex items-center gap-2 mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <h1 className="vibe-heading text-3xl sm:text-4xl font-bold">
            My <span className="text-gradient-red">Favorites</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            You have {likedProducts.length} species in your wishlist
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 rounded-xl bg-card/20 animate-pulse border border-border" />
          ))}
        </div>
      ) : likedProducts.length === 0 ? (
        <EmptyState 
          title="No favorites yet" 
          description="Start browsing the shop and click the heart icon to save species you love!"
          action={
            <Link href="/shop">
              <Button className="bg-brand-red hover:bg-brand-red/90 text-white font-bold px-8">
                Go to Shop
              </Button>
            </Link>
          }
        />
      ) : (
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
                    onClick={(e) => handleUnlike(e, product.id)}
                    className="absolute bottom-3 left-3 z-10 p-2 rounded-full bg-red-500 text-white border border-red-400 shadow-xl transition-all duration-300 hover:scale-110"
                    title="Remove from favorites"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    <Badge variant="outline" className="border-white/30 bg-black/70 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-md px-2 py-0.5 shadow-2xl w-fit">
                      {product.mainCategory}
                    </Badge>
                  </div>
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
      )}

      {/* Quick Select Dialog */}
      <Dialog open={!!quickSelectProduct} onOpenChange={(open) => !open && setQuickSelectProduct(null)}>
        <DialogContent className="glass border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-widest text-lg">Select Size</DialogTitle>
          </DialogHeader>
          {quickSelectProduct && (
            <div className="py-4 space-y-4">
              <div className="flex gap-4 items-center mb-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden border border-border">
                  <img src={quickSelectProduct.images[0]} alt={quickSelectProduct.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-tight">{quickSelectProduct.name}</h4>
                  <p className="text-xs text-muted-foreground italic">{quickSelectProduct.scientificName}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {quickSelectProduct.sizes.map((size, idx) => (
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
          <DialogFooter>
            <Button onClick={handleQuickAdd} className="w-full bg-brand-gold hover:bg-brand-gold/90 text-black font-bold h-12">
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
