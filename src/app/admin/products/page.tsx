'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Bug } from 'lucide-react';
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
import type { Product } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', scientificName: '', price: 0, stock: 0, images: [], description: ''
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
        price: product.price,
        stock: product.stock,
        images: product.images,
        description: product.description,
        category: product.category,
        careLevel: product.careLevel,
        temperament: product.temperament,
        humidity: product.humidity,
        temperature: product.temperature,
        feeding: product.feeding
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        scientificName: '',
        price: 0,
        stock: 0,
        images: [],
        description: '',
        category: 'terrestrial',
        careLevel: 'beginner',
        temperament: 'docile',
        humidity: '',
        temperature: '',
        feeding: ''
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      const updatedProduct = { ...editingProduct, ...formData };
      LocalStorage.update('products', updatedProduct.id, updatedProduct);
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      toast.success('Product updated');
    } else {
      const newProduct = {
        ...formData,
        id: `prod-${Date.now()}`,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Product;
      LocalStorage.create('products', newProduct);
      setProducts([newProduct, ...products]);
      toast.success('Product added');
    }
    setIsProductModalOpen(false);
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

      <div className="rounded-md border border-border bg-card">
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
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge className={product.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand-gold" onClick={() => handleOpenEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => setDeleteId(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val as any })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terrestrial">Terrestrial</SelectItem>
                    <SelectItem value="arboreal">Arboreal</SelectItem>
                    <SelectItem value="fossorial">Fossorial</SelectItem>
                    <SelectItem value="new-world">New World</SelectItem>
                    <SelectItem value="old-world">Old World</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Care Level</Label>
                <Select value={formData.careLevel} onValueChange={(val) => setFormData({ ...formData, careLevel: val as any })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperament</Label>
                <Select value={formData.temperament} onValueChange={(val) => setFormData({ ...formData, temperament: val as any })}>
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
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock || 0}
                  onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  value={formData.temperature || ''}
                  placeholder="24-28°C"
                  onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Humidity</Label>
                <Input
                  value={formData.humidity || ''}
                  placeholder="60-70%"
                  onChange={e => setFormData({ ...formData, humidity: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Feeding</Label>
              <Input
                value={formData.feeding || ''}
                placeholder="Crickets, roaches - Weekly"
                onChange={e => setFormData({ ...formData, feeding: e.target.value })}
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.price || 0}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct} className="bg-brand-red text-white">Save Changes</Button>
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
    </div>
  );
}
