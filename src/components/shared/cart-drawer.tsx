'use client';

import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { formatPrice } from '@/constants/pricing';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalStorage } from '@/mock-db/storage';
import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { toast } from 'sonner';

export function CartDrawer() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, updateItemSize } = useCartStore();
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const count = totalItems();

  useEffect(() => {
    // Load full product details for size switching
    const details: Record<string, Product> = {};
    items.forEach(item => {
      if (!productDetails[item.productId]) {
        const p = LocalStorage.getById<Product>('products', item.productId);
        if (p) details[item.productId] = p;
      }
    });
    if (Object.keys(details).length > 0) {
      setProductDetails(prev => ({ ...prev, ...details }));
    }
  }, [items]);

  const handleSizeChange = (productId: string, oldSize: string, newSizeName: string) => {
    const product = productDetails[productId];
    if (!product) return;
    const newSize = product.sizes.find(s => s.size === newSizeName);
    if (newSize) {
      updateItemSize(productId, oldSize, newSize);
      toast.info(`Updated size for ${product.name}`);
    }
  };

  return (
    <Sheet>
      <SheetTrigger
        nativeButton={true}
        render={
          <Button variant="outline" size="icon" className="relative border-border bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300" />
        }
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-brand-red border-2 border-background animate-in zoom-in duration-300">
            {count}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent className="glass border-l border-border flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-heading tracking-tight">
            <ShoppingBag className="h-5 w-5 text-brand-red" />
            Your <span className="text-gradient-red">Cart</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-brand-red/10 flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-brand-red/40" />
              </div>
              <div>
                <p className="font-heading font-bold text-lg">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Looks like you haven't added any eight-legged friends yet.</p>
              </div>
              <SheetClose nativeButton={true} render={<Button variant="outline" className="border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10" />}>
                Continue Shopping
              </SheetClose>
            </div>
          ) : (
            <ScrollArea className="h-full p-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex gap-4 group">
                    <div className="h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">?</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm truncate uppercase tracking-wide group-hover:text-brand-gold transition-colors">{item.name}</h4>
                          <p className="text-xs text-muted-foreground italic truncate mb-1">{item.scientificName}</p>
                          <Select
                            value={item.size}
                            onValueChange={(val) => handleSizeChange(item.productId, item.size, val || '')}
                          >
                            <SelectTrigger className="h-6 w-auto min-w-[60px] text-[10px] px-2 py-0 bg-brand-gold/5 border-brand-gold/30 text-brand-gold font-bold uppercase hover:bg-brand-gold/10 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-border">
                              {productDetails[item.productId]?.sizes.map((s, idx) => (
                                <SelectItem key={idx} value={s.size} className="text-[10px] uppercase font-bold">
                                  {s.size} - {formatPrice(s.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.size)}
                          className="text-muted-foreground hover:text-brand-red transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-1 bg-card/50 border border-border rounded-md p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-sm hover:bg-brand-red/10 hover:text-brand-red"
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-sm hover:bg-brand-gold/10 hover:text-brand-gold"
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-bold text-brand-gold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-6 border-t border-border flex-col sm:flex-col gap-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold text-brand-gold">{formatPrice(totalPrice())}</span>
            </div>
            <SheetClose nativeButton={false} render={<Link href="/checkout" className="w-full" />}>
              <Button className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold h-12 shadow-lg shadow-brand-red/20 group">
                Proceed to Checkout
                <ShoppingBag className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
