'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Bug, Package, Eye, EyeOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { LocalStorage } from '@/mock-db/storage';
import type { Product, CareLevel, Temperament } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MainCategory, TarantulaMetadata, ScorpionMetadata, CentipedeMetadata } from '@/types';

const CATEGORIES: { value: MainCategory; label: string }[] = [
  { value: 'Tarantulas', label: 'Tarantulas' },
  { value: 'Centipedes', label: 'Centipedes' },
  { value: 'Scorpions', label: 'Scorpions' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>('Tarantulas');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [toggleType, setToggleType] = useState<'visibility' | 'availability'>('visibility');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', scientificName: '', images: [], description: '', sizes: [],
    isVisible: true, available: true,
  });

  useEffect(() => {
    setProducts(LocalStorage.getAll<Product>('products'));
  }, []);

  const filtered = products.filter(p =>
    p.mainCategory === mainCategory &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.scientificName?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenEdit = (product: Product | null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        scientificName: product.scientificName,
        images: product.images,
        description: product.description,
        mainCategory: product.mainCategory,
        careLevel: product.careLevel,
        humidity: product.humidity,
        temperature: product.temperature,
        feeding: product.feeding,
        sizes: product.sizes,
        isVisible: product.isVisible ?? true,
        available: product.available ?? true,
        // Legacy
        category: product.category,
        origin: product.origin,
        temperament: product.temperament,
        // Entity metadata
        tarantulaMeta: product.tarantulaMeta,
        scorpionMeta: product.scorpionMeta,
        centipedeMeta: product.centipedeMeta,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        scientificName: '',
        images: [],
        description: '',
        sizes: [],
        isVisible: true,
        available: true,
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    // Map new fields to legacy fields for shop filters/badges compat
    let legacyFields: Partial<Product> = {};
    if (formData.mainCategory === 'Tarantulas' && formData.tarantulaMeta) {
      const meta = formData.tarantulaMeta;
      legacyFields = {
        category: meta.type?.toLowerCase() as any,
        origin: meta.world === 'New World' ? 'new-world' : 'old-world',
        temperament: meta.temperament,
        sizeCategory: meta.sizeCategory,
        gender: meta.gender
      };
    } else if (formData.mainCategory === 'Scorpions' && formData.scorpionMeta) {
      const meta = formData.scorpionMeta;
      legacyFields = {
        category: meta.habitatType?.toLowerCase() as any,
        sizeCategory: meta.sizeCategory,
        gender: meta.gender
      };
    } else if (formData.mainCategory === 'Centipedes' && formData.centipedeMeta) {
      const meta = formData.centipedeMeta;
      legacyFields = {
        category: meta.habitatType?.toLowerCase() as any,
        sizeCategory: meta.sizeCategory,
        gender: meta.gender
      };
    }

    if (editingProduct) {
      const updatedProduct = {
        ...editingProduct,
        ...formData,
        ...legacyFields,
        updatedAt: new Date().toISOString(),
      } as Product;
      LocalStorage.update('products', editingProduct.id, updatedProduct);
      toast.success('Product updated');
    } else {
      const newProduct = {
        ...formData,
        ...legacyFields,
        id: `prod-${Date.now()}`,
        featured: false,
        available: formData.available ?? true,
        isVisible: formData.isVisible ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
      LocalStorage.create('products', newProduct);
      toast.success('Product added');
    }
    // Refresh background content
    setProducts(LocalStorage.getAll<Product>('products'));
    setIsProductModalOpen(false);
  };

  const confirmToggleAvailability = () => {
    if (!toggleId) return;
    const product = products.find(p => p.id === toggleId);
    if (product) {
      const field = toggleType === 'visibility' ? 'isVisible' : 'available';
      const currentValue = product[field] !== false;
      const updatedProduct = {
        ...product,
        [field]: !currentValue
      };
      LocalStorage.update('products', toggleId, updatedProduct);
      toast.success(`${toggleType === 'visibility' ? 'Visibility' : 'Availability'} updated`);
      setProducts(LocalStorage.getAll<Product>('products'));
    }
    setToggleId(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
      LocalStorage.delete('products', deleteId);
      setProducts(products.filter(p => p.id !== deleteId));
      setDeleteId(null);
      toast.success('Product deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your tarantula inventory.</p>
        </div>
        <Button className="bg-brand-red hover:bg-brand-red-light text-white" onClick={() => handleOpenEdit(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${mainCategory.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border h-11"
          />
        </div>

        <Tabs value={mainCategory} onValueChange={(val) => setMainCategory(val as MainCategory)} className="w-full md:w-auto">
          <TabsList className="bg-black/40 border border-border p-1.5 pl-4 pr-4 gap-2 w-full sm:w-auto flex justify-start overflow-x-auto no-scrollbar rounded-xl sm:rounded-full backdrop-blur-md">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-brand-red data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300 font-heading uppercase tracking-widest text-[11px] px-6 sm:px-8 h-8 rounded-full border border-transparent data-[state=active]:border-white/20 whitespace-nowrap font-bold"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Bug className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.scientificName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-tighter">
                          {product.category || 'N/A'}
                        </Badge>
                        {product.mainCategory === 'Tarantulas' && product.tarantulaMeta && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-brand-gold/70">{product.tarantulaMeta.world}</span>
                            <span>•</span>
                            <span>{product.tarantulaMeta.growthRate} Growth</span>
                          </div>
                        )}
                        {product.mainCategory === 'Scorpions' && product.scorpionMeta && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-red-400/70">{product.scorpionMeta.venomPotency} Venom</span>
                            <span>•</span>
                            <span>{product.scorpionMeta.pincerType} Pincers</span>
                          </div>
                        )}
                        {product.mainCategory === 'Centipedes' && product.centipedeMeta && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-red-400/70">{product.centipedeMeta.venomPotency} Venom</span>
                            <span>•</span>
                            <span>{product.centipedeMeta.legPairs} Pairs</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {product.sizes?.map((s, i) => (
                          <div key={i} className="text-[10px] whitespace-nowrap">
                            <span className="text-muted-foreground mr-1">{s.size}:</span>
                            <span className="font-medium">{formatPrice(s.price)}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {product.sizes?.map((s, i) => (
                          <div key={i} className="text-[10px] whitespace-nowrap">
                            <span className="text-muted-foreground mr-1">{s.size}:</span>
                            <span className="font-medium">{s.stock}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 items-center">
                        {(() => {
                          const hasStock = product.sizes?.some(s => s.stock > 0);
                          return (
                            <Badge variant="outline" className={hasStock ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                              {hasStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          );
                        })()}
                        <Badge variant="outline" className={product.isVisible !== false ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
                          {product.isVisible !== false ? 'Visible' : 'Hidden'}
                        </Badge>
                        <Badge variant="outline" className={product.available !== false ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}>
                          {product.available !== false ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                          onClick={() => { setToggleId(product.id); setToggleType('visibility'); }}
                          title={product.isVisible !== false ? 'Hide from shop' : 'Show in shop'}
                        >
                          {product.isVisible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-purple-400"
                          onClick={() => { setToggleId(product.id); setToggleType('availability'); }}
                          title={product.available !== false ? 'Mark as unavailable' : 'Mark as available'}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-gold" onClick={() => handleOpenEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => setDeleteId(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">No products found.</div>
          ) : (
            filtered.map((product) => (
              <div key={product.id} className="p-4 space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm truncate">{product.name}</h3>
                        <p className="text-[10px] text-muted-foreground italic truncate">{product.scientificName}</p>
                      </div>
                      <Badge variant="outline" className={product.available !== false ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]'}>
                        {product.available !== false ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground capitalize font-medium">{product.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {product.mainCategory === 'Tarantulas' && product.tarantulaMeta && (
                          <Badge variant="outline" className="text-[9px] border-brand-gold/30 text-brand-gold py-0 h-4">
                            {product.tarantulaMeta.world}
                          </Badge>
                        )}
                        {product.mainCategory === 'Scorpions' && product.scorpionMeta && (
                          <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400 py-0 h-4">
                            {product.scorpionMeta.venomPotency} Venom
                          </Badge>
                        )}
                        {product.mainCategory === 'Centipedes' && product.centipedeMeta && (
                          <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400 py-0 h-4">
                            {product.centipedeMeta.venomPotency} Venom
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {product.sizes?.map((s, i) => (
                        <div key={i} className="text-[10px]">
                          <span className="text-muted-foreground">{s.size}:</span>
                          <span className="font-bold text-brand-gold ml-1">{formatPrice(s.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-muted-foreground">
                      Total Stock: {product.sizes?.reduce((acc, s) => acc + s.stock, 0) || 0}
                    </p>
                    {(() => {
                      const hasStock = product.sizes?.some(s => s.stock > 0);
                      return (
                        <Badge variant="outline" className={hasStock ? 'bg-green-500/10 text-green-400 border-green-500/20 text-[10px]' : 'bg-red-500/10 text-red-400 border-red-500/20 text-[10px]'}>
                          {hasStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 gap-2 text-xs border-border"
                    onClick={() => { setToggleId(product.id); setToggleType('visibility'); }}
                  >
                    {product.isVisible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {product.isVisible !== false ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-9 gap-2 text-xs border-border"
                    onClick={() => { setToggleId(product.id); setToggleType('availability'); }}
                  >
                    <Package className="h-4 w-4" />
                    {product.available !== false ? 'Disable' : 'Enable'}
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1 h-9 gap-2 text-xs text-muted-foreground border-border"
                      onClick={() => handleOpenEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-9 gap-2 text-xs text-muted-foreground border-border hover:text-red-400 hover:bg-red-400/5"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit/Add Sheet */}
      <Sheet open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <SheetContent className="glass border-border sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Scientific Name</Label>
              <Input
                value={formData.scientificName || ''}
                onChange={e => setFormData({ ...formData, scientificName: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Description / Care Guide</Label>
              <Textarea
                value={formData.description || ''}
                placeholder="Enter care instructions, feeding habits, etc..."
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50 min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="img">Image URLs (One per line)</Label>
              <Textarea
                id="img"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                value={formData.images?.join('\n')}
                onChange={(e) => setFormData({ ...formData, images: e.target.value.split('\n').filter(url => url.trim() !== '') })}
                className="bg-background/50 h-24"
              />
              <p className="text-[10px] text-muted-foreground">Add multiple URLs to create a gallery.</p>
            </div>
            <div className="space-y-2">
              <Label>Main Category <span className="text-red-400">*</span></Label>
              <Select value={formData.mainCategory} onValueChange={(val) => {
                const cat = val as MainCategory;
                setFormData({ ...formData, mainCategory: cat, tarantulaMeta: undefined, scorpionMeta: undefined, centipedeMeta: undefined });
              }}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select Main Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tarantulas">Tarantulas</SelectItem>
                  <SelectItem value="Scorpions">Scorpions</SelectItem>
                  <SelectItem value="Centipedes">Centipedes</SelectItem>
                </SelectContent>
              </Select>
              {!formData.mainCategory && <p className="text-[10px] text-brand-gold italic">Select a category to see entity-specific fields.</p>}
            </div>

            {/* ======== TARANTULA FIELDS ======== */}
            {formData.mainCategory === 'Tarantulas' && (
              <div className="space-y-4 pt-2 border-t border-brand-gold/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Tarantula Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>World</Label>
                    <Select value={formData.tarantulaMeta?.world} onValueChange={(val) => setFormData({ ...formData, tarantulaMeta: { ...formData.tarantulaMeta!, world: val as any, type: formData.tarantulaMeta?.type || 'Terrestrial', temperament: formData.tarantulaMeta?.temperament || 'docile' } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="New/Old World" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New World">New World</SelectItem>
                        <SelectItem value="Old World">Old World</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.tarantulaMeta?.type} onValueChange={(val) => setFormData({ ...formData, tarantulaMeta: { ...formData.tarantulaMeta!, type: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Terrestrial">Terrestrial</SelectItem>
                        <SelectItem value="Arboreal">Arboreal</SelectItem>
                        <SelectItem value="Fossorial">Fossorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperament</Label>
                    <Select value={formData.tarantulaMeta?.temperament} onValueChange={(val) => setFormData({ ...formData, tarantulaMeta: { ...formData.tarantulaMeta!, temperament: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docile">Docile</SelectItem>
                        <SelectItem value="semi-aggressive">Semi-Aggressive</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                        <SelectItem value="defensive">Defensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Growth Rate</Label>
                    <Select value={formData.tarantulaMeta?.growthRate} onValueChange={(val) => setFormData({ ...formData, tarantulaMeta: { ...formData.tarantulaMeta!, growthRate: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Slow">Slow</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Size Category</Label>
                    <Select value={formData.tarantulaMeta?.sizeCategory} onValueChange={(val) => setFormData({ ...formData, tarantulaMeta: { ...formData.tarantulaMeta!, sizeCategory: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Sling', 'Juvenile', 'Sub-adult', 'Adult'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.tarantulaMeta?.gender} onValueChange={(val) => setFormData({ ...formData, tarantulaMeta: { ...formData.tarantulaMeta!, gender: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Unsexed', 'Male', 'Female', 'Pair'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ======== SCORPION FIELDS ======== */}
            {formData.mainCategory === 'Scorpions' && (
              <div className="space-y-4 pt-2 border-t border-brand-gold/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Scorpion Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Habitat Type</Label>
                    <Select value={formData.scorpionMeta?.habitatType} onValueChange={(val) => setFormData({ ...formData, scorpionMeta: { ...formData.scorpionMeta!, habitatType: val as any, venomPotency: formData.scorpionMeta?.venomPotency || 'Mild', pincerType: formData.scorpionMeta?.pincerType || 'Medium', communal: formData.scorpionMeta?.communal ?? false } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Desert">Desert</SelectItem>
                        <SelectItem value="Tropical Forest">Tropical Forest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Venom Potency</Label>
                    <Select value={formData.scorpionMeta?.venomPotency} onValueChange={(val) => setFormData({ ...formData, scorpionMeta: { ...formData.scorpionMeta!, venomPotency: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mild">Mild</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Medically Significant">Medically Significant</SelectItem>
                        <SelectItem value="Lethal">Lethal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pincer Type</Label>
                    <Select value={formData.scorpionMeta?.pincerType} onValueChange={(val) => setFormData({ ...formData, scorpionMeta: { ...formData.scorpionMeta!, pincerType: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Thin">Thin (usually high venom)</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Thick">Thick (usually low venom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center gap-3 h-10">
                      <input type="checkbox" id="communal" checked={formData.scorpionMeta?.communal ?? false} onChange={e => setFormData({ ...formData, scorpionMeta: { ...formData.scorpionMeta!, communal: e.target.checked } })} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor="communal">Communal Species</Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Size Category</Label>
                    <Select value={formData.scorpionMeta?.sizeCategory} onValueChange={(val) => setFormData({ ...formData, scorpionMeta: { ...formData.scorpionMeta!, sizeCategory: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Scorpling', 'Juvenile', 'Sub-adult', 'Adult'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.scorpionMeta?.gender} onValueChange={(val) => setFormData({ ...formData, scorpionMeta: { ...formData.scorpionMeta!, gender: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Unsexed', 'Male', 'Female', 'Pair'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ======== CENTIPEDE FIELDS ======== */}
            {formData.mainCategory === 'Centipedes' && (
              <div className="space-y-4 pt-2 border-t border-brand-gold/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Centipede Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Habitat Type</Label>
                    <Select value={formData.centipedeMeta?.habitatType} onValueChange={(val) => setFormData({ ...formData, centipedeMeta: { ...formData.centipedeMeta!, habitatType: val as any, venomPotency: formData.centipedeMeta?.venomPotency || 'Moderate' } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tropical">Tropical</SelectItem>
                        <SelectItem value="Arid">Arid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Venom Potency</Label>
                    <Select value={formData.centipedeMeta?.venomPotency} onValueChange={(val) => setFormData({ ...formData, centipedeMeta: { ...formData.centipedeMeta!, venomPotency: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mild">Mild</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Severe">Severe</SelectItem>
                        <SelectItem value="Potent">Potent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Leg Pairs</Label>
                    <Input value={formData.centipedeMeta?.legPairs || ''} placeholder="e.g. 21" onChange={e => setFormData({ ...formData, centipedeMeta: { ...formData.centipedeMeta!, legPairs: e.target.value } })} className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Size Category</Label>
                    <Select value={formData.centipedeMeta?.sizeCategory} onValueChange={(val) => setFormData({ ...formData, centipedeMeta: { ...formData.centipedeMeta!, sizeCategory: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Pedeling', 'Juvenile', 'Sub-adult', 'Adult'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.centipedeMeta?.gender} onValueChange={(val) => setFormData({ ...formData, centipedeMeta: { ...formData.centipedeMeta!, gender: val as any } })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Unsexed', 'Male', 'Female'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ======== SHARED CARE FIELDS (only when category selected) ======== */}
            {formData.mainCategory && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Care Parameters</p>
                <div className="space-y-2">
                  <Label>Care Level</Label>
                  <Select value={formData.careLevel} onValueChange={(val) => setFormData({ ...formData, careLevel: val as CareLevel })}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select Care Level" /></SelectTrigger>
                    <SelectContent>
                      {formData.mainCategory === 'Centipedes' ? (
                        <>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Feeding</Label>
                  <Input value={formData.feeding || ''} onChange={e => setFormData({ ...formData, feeding: e.target.value })} placeholder="Crickets, roaches, etc." className="bg-background/50" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Humidity</Label>
                    <Input value={formData.humidity || ''} placeholder="60-70%" onChange={e => setFormData({ ...formData, humidity: e.target.value })} className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Input value={formData.temperature || ''} placeholder="24-28°C" onChange={e => setFormData({ ...formData, temperature: e.target.value })} className="bg-background/50" />
                  </div>
                </div>
              </div>
            )}

            {/* Sizes section */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-brand-gold font-bold uppercase tracking-widest text-[10px]">Product Sizes & Pricing</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] uppercase tracking-widest"
                  onClick={() => setFormData({
                    ...formData,
                    sizes: [...(formData.sizes || []), { size: '', price: 0, stock: 0 }]
                  })}
                >
                  Add Size
                </Button>
              </div>

              {formData.sizes && formData.sizes.length > 0 ? (
                <div className="space-y-3">
                  {formData.sizes.map((s, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-background/30 border border-border relative">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px]">Size Name</Label>
                        <Input
                          placeholder="Sling, Juvenile, etc."
                          value={s.size}
                          onChange={e => {
                            const newSizes = [...(formData.sizes || [])];
                            newSizes[idx].size = e.target.value;
                            setFormData({ ...formData, sizes: newSizes });
                          }}
                          className="bg-background/50 h-8 text-xs"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="w-24 space-y-1">
                          <Label className="text-[10px]">Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={s.price === 0 ? '' : s.price}
                            onChange={e => {
                              const newSizes = [...(formData.sizes || [])];
                              newSizes[idx] = { ...newSizes[idx], price: Math.max(0, Number(e.target.value)) };
                              setFormData({ ...formData, sizes: newSizes });
                            }}
                            className="bg-background/50 h-8 text-xs"
                          />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-[10px]">Stock</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={s.stock === 0 ? '' : s.stock}
                            onChange={e => {
                              const newSizes = [...(formData.sizes || [])];
                              newSizes[idx] = { ...newSizes[idx], stock: Math.max(0, Number(e.target.value)) };
                              setFormData({ ...formData, sizes: newSizes });
                            }}
                            className="bg-background/50 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border text-red-400 hover:text-red-300 shadow-sm"
                        onClick={() => {
                          const newSizes = formData.sizes?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, sizes: newSizes });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">No specific sizes added. Using base price.</p>
              )}
            </div>
          </div>
          <SheetFooter className="mt-8 border-t border-border pt-6">
            <Button variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct} className="bg-brand-red hover:bg-brand-red-light text-white px-8">Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Availability/Visibility Confirmation Modal */}
      <Dialog open={!!toggleId} onOpenChange={(open) => !open && setToggleId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update {toggleType === 'visibility' ? 'Visibility' : 'Availability'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to change the {toggleType === 'visibility' ? 'visibility' : 'availability'} of this product?
              {toggleType === 'visibility' ? (
                products.find(p => p.id === toggleId)?.isVisible !== false ?
                  ' This will hide it from the catalog.' :
                  ' This will make it visible in the catalog.'
              ) : (
                products.find(p => p.id === toggleId)?.available !== false ?
                  ' This will make it unavailable for purchase.' :
                  ' This will make it available for purchase.'
              )}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setToggleId(null)}>Cancel</Button>
            <Button
              className="bg-brand-red text-white hover:bg-brand-red-light"
              onClick={confirmToggleAvailability}
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
