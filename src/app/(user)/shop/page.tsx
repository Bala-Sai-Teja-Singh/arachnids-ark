'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, X, Bug, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LocalStorage } from '@/mock-db/storage';
import type { Product, ProductType, ProductOrigin, CareLevel, MainCategory, ProductSize } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CATEGORIES: { value: MainCategory; label: string }[] = [
  { value: 'Tarantulas', label: 'Tarantulas' },
  { value: 'Centipedes', label: 'Centipedes' },
  { value: 'Scorpions', label: 'Scorpions' },
];

const HABITATS: { value: string; label: string }[] = [
  { value: '', label: 'All Habitats' },
  { value: 'terrestrial', label: 'Terrestrial' },
  { value: 'arboreal', label: 'Arboreal' },
  { value: 'fossorial', label: 'Fossorial' },
  { value: 'tropical forest', label: 'Tropical Forest' },
  { value: 'desert', label: 'Desert' },
  { value: 'tropical', label: 'Tropical' },
  { value: 'arid', label: 'Arid' },
];

const ORIGINS: { value: string; label: string }[] = [
  { value: '', label: 'All Worlds' },
  { value: 'new-world', label: 'New World' },
  { value: 'old-world', label: 'Old World' },
];

const CARE_LEVELS: { value: CareLevel | ''; label: string }[] = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const careLevelColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/20 border-green-500/30 backdrop-blur-md',
  intermediate: 'text-blue-400 bg-blue-500/20 border-blue-500/30 backdrop-blur-md',
  advanced: 'text-orange-400 bg-orange-500/20 border-orange-500/30 backdrop-blur-md',
  expert: 'text-red-400 bg-red-500/20 border-red-500/30 backdrop-blur-md',
};

function FilterPanel({ mainCategory, category, setCategory, origin, setOrigin, careLevel, setCareLevel, sortBy, setSortBy }: {
  mainCategory: MainCategory;
  category: string; setCategory: (v: string) => void;
  origin: string; setOrigin: (v: string) => void;
  careLevel: string; setCareLevel: (v: string) => void;
  sortBy: string; setSortBy: (v: string) => void;
}) {
  const filteredHabitats = HABITATS.filter(h => {
    if (!h.value) return true;
    if (mainCategory === 'Tarantulas') return ['terrestrial', 'arboreal', 'fossorial'].includes(h.value);
    if (mainCategory === 'Scorpions') return ['tropical forest', 'desert'].includes(h.value);
    if (mainCategory === 'Centipedes') return ['tropical', 'arid'].includes(h.value);
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold uppercase tracking-wider">Habitat</label>
        <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50 border-border">
            <SelectValue placeholder="All Habitats" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {filteredHabitats.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {mainCategory === 'Tarantulas' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold uppercase tracking-wider">World</label>
          <Select value={origin} onValueChange={(val) => setOrigin(val ?? '')}>
            <SelectTrigger className="w-full bg-background/50 border-border">
              <SelectValue placeholder="All Worlds" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {ORIGINS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold uppercase tracking-wider">Care Level</label>
        <Select value={careLevel} onValueChange={(val) => setCareLevel(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50 border-border">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {CARE_LEVELS.map(c => {
              if (mainCategory === 'Centipedes' && c.value === 'beginner') return null;
              return <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold uppercase tracking-wider">Sort By</label>
        <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50 border-border">
            <SelectValue placeholder="Sort By: Name" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="">Sort By: Name</SelectItem>
            <SelectItem value="price-low">Sort By: Price Low to High</SelectItem>
            <SelectItem value="price-high">Sort By: Price High to Low</SelectItem>
            <SelectItem value="newest">Sort By: Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('Tarantulas');
  const [habitat, setHabitat] = useState('');
  const [origin, setOrigin] = useState('');
  const [careLevel, setCareLevel] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [quickSelectProduct, setQuickSelectProduct] = useState<Product | null>(null);
  const [selectedQuickSize, setSelectedQuickSize] = useState<number>(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    setTimeout(() => {
      setProducts(LocalStorage.getAll<Product>('products'));
      setLoading(false);
    }, 300);
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter(p => p.isVisible !== false && p.mainCategory === mainCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q));
    }
    if (habitat) result = result.filter(p => p.category === habitat);
    if (origin) result = result.filter(p => p.origin === origin);
    if (careLevel) result = result.filter(p => p.careLevel === careLevel);

    const getMinPrice = (p: Product) => {
      if (!p.sizes || p.sizes.length === 0) return 0;
      return Math.min(...p.sizes.map(s => s.price));
    };

    const sort = sortBy || 'name';
    switch (sort) {
      case 'price-low': result.sort((a, b) => getMinPrice(a) - getMinPrice(b)); break;
      case 'price-high': result.sort((a, b) => getMinPrice(b) - getMinPrice(a)); break;
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, search, mainCategory, habitat, origin, careLevel, sortBy]);

  const activeFilters = [habitat !== '', origin !== '', careLevel !== ''].filter(Boolean).length;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.sizes.length > 1) {
      setQuickSelectProduct(product);
      setSelectedQuickSize(0);
      return;
    }

    const size = product.sizes[0];
    addItem(product, size, 1);
    toast.success(`${product.name} added to cart`, {
      description: `Size: ${size.size} | Qty: 1`,
      icon: <ShoppingCart className="h-4 w-4" />,
    });
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="vibe-heading text-3xl font-bold mb-2">
          Shop <span className="text-gradient-red">Exotics</span>
        </h1>
        <p className="text-muted-foreground">
          Browse our curated collection of {products.length} exotic species
        </p>
      </motion.div>

      {/* Tabs for Main Categories */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
        <Tabs value={mainCategory} onValueChange={(val) => setMainCategory(val as MainCategory)} className="w-full">
          <TabsList className="bg-black/40 border border-border p-1.5 pl-4 pr-4 gap-2 w-full sm:w-auto flex justify-start overflow-x-auto no-scrollbar rounded-xl sm:rounded-full backdrop-blur-md">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-brand-gold data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(197,150,58,0.4)] transition-all duration-300 font-heading uppercase tracking-widest text-[11px] px-6 sm:px-10 h-9 rounded-full border border-transparent data-[state=active]:border-black/10 whitespace-nowrap font-bold"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${mainCategory.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card/40 border-border focus:border-brand-gold/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-2">
          <Select value={habitat} onValueChange={(val) => setHabitat(val ?? '')}>
            <SelectTrigger className="w-[150px] bg-card/40 border-border">
              <SelectValue placeholder="Habitats" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {HABITATS.filter(h => {
                if (!h.value) return true;
                if (mainCategory === 'Tarantulas') return ['terrestrial', 'arboreal', 'fossorial'].includes(h.value);
                if (mainCategory === 'Scorpions') return ['tropical forest', 'desert'].includes(h.value);
                if (mainCategory === 'Centipedes') return ['tropical', 'arid'].includes(h.value);
                return true;
              }).map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {mainCategory === 'Tarantulas' && (
            <Select value={origin} onValueChange={(val) => setOrigin(val ?? '')}>
              <SelectTrigger className="w-[150px] bg-card/40 border-border">
                <SelectValue placeholder="Worlds" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {ORIGINS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={careLevel} onValueChange={(val) => setCareLevel(val ?? '')}>
            <SelectTrigger className="w-[160px] bg-card/40 border-border">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {CARE_LEVELS.map(c => {
                if (mainCategory === 'Centipedes' && c.value === 'beginner') return null;
                return <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? '')}>
            <SelectTrigger className="w-[220px] bg-card/40 border-border">
              <SelectValue placeholder="Sort By: Name" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="">Sort By: Name</SelectItem>
              <SelectItem value="price-low">Sort By: Price Low → High</SelectItem>
              <SelectItem value="price-high">Sort By: Price High → Low</SelectItem>
              <SelectItem value="newest">Sort By: Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filter Sheet */}
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden relative border-border bg-card/40" />}>
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-red border-0">
                {activeFilters}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent className="glass border-l border-border">
            <SheetHeader>
              <SheetTitle className="font-heading uppercase tracking-widest text-sm">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanel
                mainCategory={mainCategory}
                category={habitat} setCategory={setHabitat}
                origin={origin} setOrigin={setOrigin}
                careLevel={careLevel} setCareLevel={setCareLevel}
                sortBy={sortBy} setSortBy={setSortBy}
              />
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} {mainCategory.toLowerCase()} found</p>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${mainCategory.toLowerCase()} found`} description="Try adjusting your filters or search query." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="vibe-card group overflow-hidden border-border bg-card/30 backdrop-blur-sm h-full flex flex-col">
                <Link href={`/shop/${product.id}`} className="block relative h-48 bg-gradient-to-br from-brand-red/20 via-background to-brand-gold/10 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Bug className="h-16 w-16 text-brand-red/20 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <Badge className={`absolute top-3 right-3 z-10 border border-white/20 shadow-xl capitalize px-3 py-1 text-[10px] font-bold ${careLevelColors[product.careLevel]}`}>
                    {product.careLevel}
                  </Badge>
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    <Badge variant="outline" className="border-white/30 bg-black/70 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-md px-2 py-0.5 shadow-2xl w-fit">
                      {product.category}
                    </Badge>
                    {product.origin && (
                      <Badge variant="outline" className="border-brand-gold/40 bg-black/80 text-brand-gold text-[9px] font-black uppercase tracking-widest backdrop-blur-md px-2 py-0.5 shadow-2xl w-fit">
                        {product.origin.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4 flex-1 flex flex-col gap-2">
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="font-heading font-bold text-base group-hover:text-brand-gold transition-colors line-clamp-1 uppercase tracking-wide">{product.name}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground italic line-clamp-1">{product.scientificName}</p>

                  <div className="flex items-center justify-between mt-auto pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Starts at</span>
                      <span className="text-lg font-bold text-brand-gold leading-none">
                        {product.sizes?.length > 0
                          ? formatPrice(Math.min(...product.sizes.map(s => s.price)))
                          : 'N/A'}
                      </span>
                    </div>

                    {(() => {
                      const totalStock = product.sizes?.reduce((acc, s) => acc + s.stock, 0) || 0;
                      const isAvailable = product.available !== false && totalStock > 0;

                      return isAvailable ? (
                        <Button
                          size="sm"
                          onClick={(e) => handleAddToCart(e, product)}
                          className="bg-brand-red hover:bg-brand-red/90 text-white font-bold h-9 px-4"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      ) : (
                        <Button size="sm" disabled variant="outline" className="opacity-50 h-9">
                          Sold Out
                        </Button>
                      );
                    })()}
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
