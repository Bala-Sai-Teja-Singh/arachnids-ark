'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Bug, Package, Eye, EyeOff, Pencil, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/shared/atoms/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/molecules/modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/shared/molecules/section-header';
import { TabMolecule, type TabOption } from '@/components/shared/molecules/tabs';
import { FormBuilder, type FormFieldConfig } from '@/components/shared/organisms/form-builder';
import { FormArray } from '@/components/shared/molecules/form-array';
import { Loading } from '@/components/shared/molecules/loading';
import { ProductSchema, type ProductSchemaType } from '@/schemas/product';
import { LocalStorage } from '@/mock-db/storage';
import { formatPrice } from '@/constants/pricing';
import { Label } from '@/components/ui/label';
import type { Product, MainCategory, CareLevel } from '@/types';

const CATEGORIES: TabOption[] = [
  { value: 'All', label: 'All' },
  { value: 'Tarantulas', label: 'Tarantulas' },
  { value: 'Centipedes', label: 'Centipedes' },
  { value: 'Scorpions', label: 'Scorpions' },
];

const CARE_LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mainCategory, setMainCategory] = useState<string>('All');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setProducts(LocalStorage.getAll<Product>('products'));
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const filtered = products.filter(p =>
    (mainCategory === 'All' || p.mainCategory === mainCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.scientificName?.toLowerCase().includes(search.toLowerCase()))
  );

  const initialValues: Partial<ProductSchemaType> = {
    name: '', scientificName: '', description: '', images: [],
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    humidity: '', temperature: '', feeding: '',
    isVisible: true, available: true,
    sizes: [{ size: '', price: 0, stock: 0 }]
  };

  const productFields: FormFieldConfig<ProductSchemaType>[] = [
    { name: 'name', label: 'Name', type: 'text', gridSpan: 'col-span-2 md:col-span-1' },
    { name: 'scientificName', label: 'Scientific Name', type: 'text', gridSpan: 'col-span-2 md:col-span-1' },
    { name: 'mainCategory', label: 'Main Category', type: 'select', options: CATEGORIES, gridSpan: 'col-span-2 md:col-span-1' },
    { name: 'careLevel', label: 'Care Level', type: 'select', options: CARE_LEVELS, gridSpan: 'col-span-2 md:col-span-1' },
    { name: 'description', label: 'Description', type: 'textarea', gridSpan: 'col-span-2' },

    // Tarantula Meta
    {
      name: 'tarantulaMeta.world', label: 'World', type: 'select',
      options: [{ label: 'New World', value: 'New World' }, { label: 'Old World', value: 'Old World' }],
      renderIf: (v) => v.mainCategory === 'Tarantulas'
    },
    {
      name: 'tarantulaMeta.type', label: 'Type', type: 'select',
      options: [{ label: 'Terrestrial', value: 'Terrestrial' }, { label: 'Arboreal', value: 'Arboreal' }, { label: 'Fossorial', value: 'Fossorial' }],
      renderIf: (v) => v.mainCategory === 'Tarantulas'
    },
    {
      name: 'tarantulaMeta.temperament', label: 'Temperament', type: 'select',
      options: [
        { label: 'Docile', value: 'docile' }, { label: 'Semi-Aggressive', value: 'semi-aggressive' },
        { label: 'Aggressive', value: 'aggressive' }, { label: 'Defensive', value: 'defensive' }
      ],
      renderIf: (v) => v.mainCategory === 'Tarantulas'
    },

    // Scorpion Meta
    {
      name: 'scorpionMeta.habitatType', label: 'Habitat Type', type: 'select',
      options: [{ label: 'Desert', value: 'Desert' }, { label: 'Tropical Forest', value: 'Tropical Forest' }],
      renderIf: (v) => v.mainCategory === 'Scorpions'
    },
    {
      name: 'scorpionMeta.venomPotency', label: 'Venom Potency', type: 'select',
      options: [
        { label: 'Mild', value: 'Mild' }, { label: 'Moderate', value: 'Moderate' },
        { label: 'Medically Significant', value: 'Medically Significant' }, { label: 'Lethal', value: 'Lethal' }
      ],
      renderIf: (v) => v.mainCategory === 'Scorpions'
    },

    { name: 'humidity', label: 'Humidity', type: 'text' },
    { name: 'temperature', label: 'Temperature', type: 'text' },
    { name: 'feeding', label: 'Feeding', type: 'text', gridSpan: 'col-span-2' },
  ];

  const handleToggle = (id: string, field: 'isVisible' | 'available') => {
    const product = products.find(p => p.id === id);
    if (product) {
      const updated = { ...product, [field]: !product[field] };
      LocalStorage.update('products', id, updated);
      setProducts(LocalStorage.getAll<Product>('products'));
      toast.success('Status updated');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      LocalStorage.delete('products', deleteId);
      setProducts(LocalStorage.getAll<Product>('products'));
      toast.success('Product deleted');
      setDeleteId(null);
    }
  };

  const handleFormSubmit = (data: ProductSchemaType) => {
    let legacyFields: Partial<Product> = {};
    if (data.mainCategory === 'Tarantulas' && data.tarantulaMeta) {
      legacyFields = {
        category: data.tarantulaMeta.type?.toLowerCase() as any,
        origin: data.tarantulaMeta.world === 'New World' ? 'new-world' : 'old-world',
        temperament: data.tarantulaMeta.temperament,
      };
    }

    if (editingProduct) {
      const updated = { ...editingProduct, ...data, ...legacyFields, updatedAt: new Date().toISOString() };
      LocalStorage.update('products', editingProduct.id, updated);
      toast.success('Product updated');
    } else {
      const newItem = {
        ...data, ...legacyFields, id: `prod-${Date.now()}`, featured: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        likes: 0
      };
      LocalStorage.create('products', newItem);
      toast.success('Product added');
    }
    setProducts(LocalStorage.getAll<Product>('products'));
    setIsProductModalOpen(false);
  };

  if (isLoading) {
    return <Loading text="Fetching inventory..." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        action={{
          label: "Add Product",
          onClick: () => { setEditingProduct(null); setIsProductModalOpen(true); },
          icon: Plus
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full md:w-auto">
          <div className="w-full md:w-80">
            <Input 
              placeholder="Search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="bg-card border-border h-10"
              startContent={<Search className="h-4 w-4 text-muted-foreground" />}
              isClearable
              onClear={() => setSearch('')}
            />
          </div>
          <TabMolecule
            options={CATEGORIES}
            value={mainCategory}
            onValueChange={setMainCategory}
            className="w-full md:w-auto"
          />
        </div>
      </SectionHeader>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Attributes</TableHead>
              <TableHead>Price/Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No products found.</TableCell></TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted overflow-hidden border border-border">
                        {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Bug className="m-auto h-4 w-4 opacity-20" />}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground italic">{product.scientificName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit text-[9px] uppercase">{product.mainCategory}</Badge>
                      <span className="text-[10px] text-muted-foreground">{product.careLevel} Care</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {product.sizes?.map((s, i) => (
                        <div key={i} className="text-[10px]"><span className="text-muted-foreground">{s.size}:</span> <span className="font-bold">{formatPrice(s.price)}</span> ({s.stock})</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className={product.isVisible ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gray-500/10 text-gray-400"}>{product.isVisible ? 'Visible' : 'Hidden'}</Badge>
                      <Badge variant="outline" className={product.available ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400"}>{product.available ? 'In Stock' : 'Out'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(product.id, 'isVisible')}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)}
        variant="extra-large"
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >

          <FormBuilder
            schema={ProductSchema}
            defaultValues={editingProduct || initialValues}
            fields={productFields}
            onSubmit={handleFormSubmit}
            submitLabel={editingProduct ? 'Save Changes' : 'Create Product'}
          >
            <div className="space-y-6">
              <FormArray
                name="sizes"
                label="Product Sizes & Stock"
                newItemDefault={{ size: '', price: 0, stock: 0 }}
                fields={[
                  { name: 'size', label: 'Size', type: 'text' },
                  { name: 'price', label: 'Price', type: 'number' },
                  { name: 'stock', label: 'Stock', type: 'number' }
                ]}
              />

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-1">Images (URLs)</Label>
                <FormArray
                  name="images"
                  newItemDefault=""
                  fields={[{ name: '', label: 'URL', type: 'text', gridSpan: 'col-span-3' }]}
                />
              </div>
            </div>
          </FormBuilder>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        variant="confirm"
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Product</Button>
          </div>
        )}
      >
        <div className="py-2" />
      </Modal>
    </div>
  );
}
