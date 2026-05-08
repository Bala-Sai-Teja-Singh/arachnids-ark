'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, X, Bug, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LocalStorage } from '@/mock-db/storage';
import type { Product, ProductType, ProductOrigin, CareLevel } from '@/types';
import { formatPrice } from '@/constants/pricing';

const HABITATS: { value: ProductType | ''; label: string }[] = [
  { value: '', label: 'All Habitats' },
  { value: 'terrestrial', label: 'Terrestrial' },
  { value: 'arboreal', label: 'Arboreal' },
  { value: 'fossorial', label: 'Fossorial' },
];

const ORIGINS: { value: ProductOrigin | ''; label: string }[] = [
  { value: '', label: 'All Origins' },
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

function FilterPanel({ category, setCategory, origin, setOrigin, careLevel, setCareLevel, sortBy, setSortBy }: {
  category: string; setCategory: (v: string) => void;
  origin: string; setOrigin: (v: string) => void;
  careLevel: string; setCareLevel: (v: string) => void;
  sortBy: string; setSortBy: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold">Habitat</label>
        <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="All Habitats" />
          </SelectTrigger>
          <SelectContent>
            {HABITATS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold">Origin</label>
        <Select value={origin} onValueChange={(val) => setOrigin(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="All Origins" />
          </SelectTrigger>
          <SelectContent>
            {ORIGINS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold">Care Level</label>
        <Select value={careLevel} onValueChange={(val) => setCareLevel(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            {CARE_LEVELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block text-gradient-gold">Sort By</label>
        <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? '')}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="Sort By: Name" />
          </SelectTrigger>
          <SelectContent>
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
  const [category, setCategory] = useState('');
  const [origin, setOrigin] = useState('');
  const [careLevel, setCareLevel] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setProducts(LocalStorage.getAll<Product>('products'));
      setLoading(false);
    }, 300);
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q));
    }
    if (category) result = result.filter(p => p.category === category);
    if (origin) result = result.filter(p => p.origin === origin);
    if (careLevel) result = result.filter(p => p.careLevel === careLevel);

    const sort = sortBy || 'name';
    switch (sort) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, search, category, origin, careLevel, sortBy]);

  const activeFilters = [category !== '', origin !== '', careLevel !== ''].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="vibe-heading text-3xl font-bold mb-2">
          Shop <span className="text-gradient-red">Tarantulas</span>
        </h1>
        <p className="text-muted-foreground">
          Browse our curated collection of {products.length} exotic species
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-2">
          <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue placeholder="Habitats" />
            </SelectTrigger>
            <SelectContent>
              {HABITATS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={origin} onValueChange={(val) => setOrigin(val ?? '')}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue placeholder="Origins" />
            </SelectTrigger>
            <SelectContent>
              {ORIGINS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={careLevel} onValueChange={(val) => setCareLevel(val ?? '')}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              {CARE_LEVELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? '')}>
            <SelectTrigger className="w-[220px] bg-card border-border">
              <SelectValue placeholder="Sort By: Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sort By: Name</SelectItem>
              <SelectItem value="price-low">Sort By: Price Low → High</SelectItem>
              <SelectItem value="price-high">Sort By: Price High → Low</SelectItem>
              <SelectItem value="newest">Sort By: Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filter Sheet */}
        <Sheet>
          <SheetTrigger className="md:hidden" render={<Button variant="outline" size="icon" className="relative border-border" />}>
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-red border-0">
                {activeFilters}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent className="glass border-l border-border">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanel
                category={category} setCategory={setCategory}
                origin={origin} setOrigin={setOrigin}
                careLevel={careLevel} setCareLevel={setCareLevel}
                sortBy={sortBy} setSortBy={setSortBy}
              />
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} species found</p>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No species found" description="Try adjusting your filters or search query." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/shop/${product.id}`}>
                <Card className="vibe-card group overflow-hidden border-border bg-card/40 backdrop-blur-sm h-full">
                  <div className="h-48 bg-gradient-to-br from-brand-red/20 via-background to-brand-gold/10 relative overflow-hidden">
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
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-heading font-bold text-base group-hover:text-brand-gold transition-colors line-clamp-1 uppercase tracking-wide">{product.name}</h3>
                    <p className="text-xs text-muted-foreground italic">{product.scientificName}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{product.temperament}</span>
                      <span>•</span>
                      <span>{product.humidity}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-brand-gold">{formatPrice(product.price)}</span>
                      <span className={`text-xs ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                      </span>
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
