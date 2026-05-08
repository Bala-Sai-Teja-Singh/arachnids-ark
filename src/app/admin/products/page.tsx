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
import type { Product, ProductType, ProductOrigin, CareLevel, Temperament } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [toggleType, setToggleType] = useState<'visibility' | 'availability'>('visibility');

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', scientificName: '', images: [], description: '', sizes: [],
    isVisible: true, available: true
  });

  useEffect(() => {
    setProducts(LocalStorage.getAll<Product>('products'));
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenEdit = (product: Product | null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        scientificName: product.scientificName,
        images: product.images,
        description: product.description,
        category: product.category,
        careLevel: product.careLevel,
        temperament: product.temperament,
        humidity: product.humidity,
        temperature: product.temperature,
        feeding: product.feeding,
        sizes: product.sizes,
        isVisible: product.isVisible ?? true,
        available: product.available ?? true
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        scientificName: '',
        images: [],
        description: '',
        category: 'terrestrial',
        careLevel: 'beginner',
        temperament: 'docile',
        humidity: '',
        temperature: '',
        feeding: '',
        sizes: [],
        isVisible: true,
        available: true
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      const updatedProduct = { ...editingProduct, ...formData };
      LocalStorage.update('products', updatedProduct.id, updatedProduct);
      toast.success('Product updated');
    } else {
      const newProduct = {
        ...formData,
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

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
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
                    <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
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
                    <p className="text-muted-foreground capitalize">{product.category}</p>
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

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 gap-2 text-xs border-border"
                    onClick={() => setToggleId(product.id)}
                  >
                    {product.available !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {product.available !== false ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground border-border"
                    onClick={() => handleOpenEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground border-border hover:text-red-400"
                    onClick={() => setDeleteId(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val as ProductType })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terrestrial">Terrestrial</SelectItem>
                    <SelectItem value="arboreal">Arboreal</SelectItem>
                    <SelectItem value="fossorial">Fossorial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origin</Label>
                <Select value={formData.origin} onValueChange={(val) => setFormData({ ...formData, origin: val as ProductOrigin })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-world">New World</SelectItem>
                    <SelectItem value="old-world">Old World</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Care Level</Label>
                <Select value={formData.careLevel} onValueChange={(val) => setFormData({ ...formData, careLevel: val as CareLevel })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Care Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Temperament</Label>
                <Select value={formData.temperament} onValueChange={(val) => setFormData({ ...formData, temperament: val as Temperament })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Temperament" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docile">Docile</SelectItem>
                    <SelectItem value="semi-aggressive">Semi-Aggressive</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="defensive">Defensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Feeding</Label>
              <Input
                value={formData.feeding}
                onChange={e => setFormData({ ...formData, feeding: e.target.value })}
                placeholder="Roaches, crickets, etc."
                className="bg-background/50"
              />
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
