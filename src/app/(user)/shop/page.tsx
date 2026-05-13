'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, X, Bug, SlidersHorizontal, ShoppingCart, Heart } from 'lucide-react';
import { Input } from '@/components/shared/atoms/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { TabMolecule, type TabOption } from '@/components/shared/molecules/tabs';
import { Modal } from '@/components/shared/molecules/modal';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import { ProductCard } from '@/components/shared/molecules/product-card';
import { Select as SharedSelect } from '@/components/shared/atoms/select';
import { Loading } from '@/components/shared/molecules/loading';
import { Db } from '@/lib/db';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatPrice } from '@/constants/pricing';
import type { Product, MainCategory, CareLevel } from '@/types';

const CATEGORIES: TabOption[] = [
  { value: 'All', label: 'All', icon: Bug },
  { value: 'Tarantulas', label: 'Tarantulas', icon: Bug },
  { value: 'Centipedes', label: 'Centipedes', icon: Bug },
  { value: 'Scorpions', label: 'Scorpions', icon: Bug },
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

const ORIGINS = [
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

const VENOM_POTENCIES = [
  { value: '', label: 'All Potencies' },
  { value: 'Mild', label: 'Mild' },
  { value: 'Potent', label: 'Potent' },
  { value: 'Medical', label: 'Medical Impact' },
];

function FilterPanel({ 
  mainCategory, 
  habitat, setHabitat, 
  origin, setOrigin, 
  careLevel, setCareLevel, 
  sortBy, setSortBy, 
  venomPotency, setVenomPotency,
  onReset
}: any) {
  const filteredHabitats = HABITATS.filter(h => {
    if (!h.value) return true;
    if (mainCategory === 'Tarantulas') return ['terrestrial', 'arboreal', 'fossorial'].includes(h.value);
    if (mainCategory === 'Scorpions') return ['tropical forest', 'desert'].includes(h.value);
    if (mainCategory === 'Centipedes') return ['tropical', 'arid'].includes(h.value);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Habitat</label>
        <SharedSelect options={filteredHabitats} value={habitat} onValueChange={(val) => setHabitat(val ?? '')} placeholder="All Habitats" />
      </div>
      {mainCategory === 'Tarantulas' && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">World</label>
          <SharedSelect options={ORIGINS} value={origin} onValueChange={(val) => setOrigin(val ?? '')} placeholder="All Worlds" />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Care Level</label>
        <SharedSelect 
          options={CARE_LEVELS.filter(c => !(mainCategory === 'Centipedes' && c.value === 'beginner'))} 
          value={careLevel} 
          onValueChange={(val) => setCareLevel(val ?? '')} 
          placeholder="All Levels" 
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Sort By</label>
        <SharedSelect 
          options={[
            { label: "Name", value: "" },
            { label: "Price: Low to High", value: "price-low" },
            { label: "Price: High to Low", value: "price-high" },
            { label: "Newest Arrivals", value: "newest" }
          ]} 
          value={sortBy} 
          onValueChange={(val) => setSortBy(val ?? '')} 
        />
      </div>

      <div className="pt-4">
        <Button 
          variant="outline" 
          onClick={onReset} 
          className="w-full h-12 border-brand-red/20 text-brand-red hover:bg-brand-red/5 font-bold uppercase tracking-widest text-xs rounded-xl"
        >
          <X className="h-4 w-4 mr-2" /> Reset All Filters
        </Button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [mainCategory, setMainCategory] = useState<string>('All');
  const [habitat, setHabitat] = useState('');
  const [origin, setOrigin] = useState('');
  const [careLevel, setCareLevel] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [venomPotency, setVenomPotency] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickSelectProduct, setQuickSelectProduct] = useState<Product | null>(null);
  const [selectedQuickSize, setSelectedQuickSize] = useState<number>(0);
  const [showLeftShade, setShowLeftShade] = useState(false);
  const [showRightShade, setShowRightShade] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const checkScroll = async () => {
    const el = tabsListRef.current;
    if (el) {
      setShowLeftShade(el.scrollLeft > 10);
      setShowRightShade(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  useEffect(() => {
    setTimeout(async () => {
      setProducts(await Db.getAll<Product>('products'));
      setLoading(false);
    }, 300);

    const savedLikes = localStorage.getItem('arachnidsark_liked_products');
    if (savedLikes) {
      setLikedIds(JSON.parse(savedLikes));
    }
  }, []);

  const handleLike = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to save favorites', {
        action: { label: 'Login', onClick: () => router.push('/login') },
      });
      return;
    }

    const isLiked = likedIds.includes(productId);
    let newLikedIds = isLiked ? likedIds.filter(id => id !== productId) : [...likedIds, productId];

    setLikedIds(newLikedIds);
    localStorage.setItem('arachnidsark_liked_products', JSON.stringify(newLikedIds));

    const product = products.find(p => p.id === productId);
    if (product) {
      const newLikes = isLiked ? Math.max(0, (product.likes || 0) - 1) : (product.likes || 0) + 1;
      await Db.update<Product>('products', productId, { likes: newLikes });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, likes: newLikes } : p));
      if (!isLiked) toast.success(`You liked ${product.name}!`, { icon: <Heart className="h-4 w-4 text-red-500 fill-red-500" /> });
    }
  };

  useEffect(() => {
    setHabitat('');
    setOrigin('');
    setCareLevel('');
    setVenomPotency('');
  }, [mainCategory]);

  const filtered = useMemo(() => {
    let result = products.filter(p => p.isVisible !== false && (mainCategory === 'All' || p.mainCategory === mainCategory));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q));
    }
    if (habitat) {
      result = result.filter(p => p.category === habitat || p.scorpionMeta?.habitatType === habitat || p.centipedeMeta?.habitatType === habitat);
    }
    if (origin) result = result.filter(p => p.origin === origin);
    if (careLevel) result = result.filter(p => p.careLevel === careLevel);
    if (venomPotency) {
      result = result.filter(p => p.scorpionMeta?.venomPotency === venomPotency || p.centipedeMeta?.venomPotency === venomPotency);
    }

    const getMinPrice = (p: Product) => (p.sizes?.length > 0 ? Math.min(...p.sizes.map(s => s.price)) : 0);
    const sort = sortBy || 'name';
    switch (sort) {
      case 'price-low': result.sort((a, b) => getMinPrice(a) - getMinPrice(b)); break;
      case 'price-high': result.sort((a, b) => getMinPrice(b) - getMinPrice(a)); break;
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      default: result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, search, mainCategory, habitat, origin, careLevel, sortBy, venomPotency]);

  const clearFilters = () => {
    setHabitat(''); setOrigin(''); setCareLevel(''); setVenomPotency(''); setSearch(''); setSortBy('');
  };

  const activeFilters = [habitat, origin, careLevel, venomPotency, search].filter(Boolean).length;

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation();
    if (product.sizes.length > 1) {
      setQuickSelectProduct(product); setSelectedQuickSize(0); return;
    }
    const size = product.sizes[0];
    addItem(product, 'product', { size, quantity: 1 });
    toast.success(`${product.name} added to cart`, { icon: <ShoppingCart className="h-4 w-4" /> });
  };

  const handleQuickAdd = () => {
    if (!quickSelectProduct) return;
    const size = quickSelectProduct.sizes[selectedQuickSize];
    addItem(quickSelectProduct, 'product', { size, quantity: 1 });
    toast.success(`${quickSelectProduct.name} added to cart`, { icon: <ShoppingCart className="h-4 w-4" /> });
    setQuickSelectProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-4">

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
        <TabMolecule
          options={CATEGORIES}
          value={mainCategory}
          onValueChange={setMainCategory}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-row items-center gap-2 sm:gap-3 mb-6">
        <div className="flex-1">
          <Input 
            placeholder={`Search ${mainCategory.toLowerCase()}...`} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="bg-card/40 border-border" 
            startContent={<Search className="h-4 w-4 text-muted-foreground" />}
            isClearable
            onClear={() => setSearch('')}
          />
        </div>

        <div className="hidden md:flex gap-2">
          <SharedSelect 
            value={habitat} onValueChange={(val) => setHabitat(val ?? '')} 
            placeholder="Habitats" className="w-[150px]" 
            options={HABITATS.filter(h => {
              if (!h.value) return true;
              if (mainCategory === 'Tarantulas') return ['terrestrial', 'arboreal', 'fossorial'].includes(h.value);
              if (mainCategory === 'Scorpions') return ['tropical forest', 'desert'].includes(h.value);
              if (mainCategory === 'Centipedes') return ['tropical', 'arid'].includes(h.value);
              return true;
            })} 
          />
          {mainCategory === 'Tarantulas' && (
            <SharedSelect value={origin} onValueChange={(val) => setOrigin(val ?? '')} placeholder="Worlds" className="w-[150px]" options={ORIGINS} />
          )}
          <SharedSelect value={careLevel} onValueChange={(val) => setCareLevel(val ?? '')} placeholder="All Levels" className="w-[160px]" options={CARE_LEVELS.filter(c => !(mainCategory === 'Centipedes' && c.value === 'beginner'))} />
          {(mainCategory === 'Scorpions' || mainCategory === 'Centipedes') && (
            <SharedSelect value={venomPotency} onValueChange={(val) => setVenomPotency(val ?? '')} placeholder="Potency" className="w-[160px]" options={VENOM_POTENCIES} />
          )}
          <SharedSelect 
            value={sortBy} onValueChange={(val) => setSortBy(val ?? '')} 
            placeholder="Sort By" className="w-[180px]" 
            options={[
              { label: "Name", value: "" },
              { label: "Price Low → High", value: "price-low" },
              { label: "Price High → Low", value: "price-high" },
              { label: "Newest", value: "newest" }
            ]} 
          />
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-brand-red hover:bg-brand-red/10 h-10 px-4 rounded-xl">
              <X className="h-4 w-4 mr-2" /> Clear
            </Button>
          )}
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          className="md:hidden relative border-border bg-card/40"
          onClick={() => setIsFilterOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-red">{activeFilters}</Badge>}
        </Button>

        <Modal 
          isOpen={isFilterOpen} 
          onClose={() => setIsFilterOpen(false)}
          variant="side-right"
          title="Filters"
          dismissible={true}
        >
          <FilterPanel 
            mainCategory={mainCategory} habitat={habitat} setHabitat={setHabitat} 
            origin={origin} setOrigin={setOrigin} careLevel={careLevel} setCareLevel={setCareLevel} 
            sortBy={sortBy} setSortBy={setSortBy} venomPotency={venomPotency} setVenomPotency={setVenomPotency} 
            onReset={clearFilters}
          />
        </Modal>
      </motion.div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} {mainCategory.toLowerCase()} found</p>

      {loading ? (
        <Loading text="Hunting for specimens..." />
      ) : filtered.length === 0 ? (
        <EmptyState title={`No ${mainCategory.toLowerCase()} found`} description="Try adjusting your filters or search query." action={{ label: "Clear Filters", onClick: clearFilters }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} isLiked={likedIds.includes(product.id)} onLike={(e) => handleLike(e, product.id)} onAddToCart={(e) => handleAddToCart(e, product)} />
          ))}
        </div>
      )}

      <Modal 
        isOpen={!!quickSelectProduct} 
        onClose={() => setQuickSelectProduct(null)}
        variant="small"
        title="Select Size"
        footer={<Button onClick={handleQuickAdd} className="w-full bg-brand-gold hover:bg-brand-gold/90 text-black font-bold h-12">Add to Cart</Button>}
      >
        {quickSelectProduct && (
          <div className="py-4 space-y-4">
            <div className="flex gap-4 items-center mb-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden border border-border"><img src={quickSelectProduct.images[0]} alt="" className="h-full w-full object-cover" /></div>
              <div><h4 className="font-bold uppercase tracking-tight">{quickSelectProduct.name}</h4><p className="text-xs text-muted-foreground italic">{quickSelectProduct.scientificName}</p></div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickSelectProduct.sizes.map((size, idx) => (
                <button key={idx} onClick={() => setSelectedQuickSize(idx)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedQuickSize === idx ? 'border-brand-gold bg-brand-gold/10 ring-1 ring-brand-gold' : 'border-border bg-card/40'}`}>
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
