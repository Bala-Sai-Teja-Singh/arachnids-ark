import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductSize } from '@/types';

export interface CartItem {
  productId: string;
  name: string;
  scientificName: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size: ProductSize, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  updateItemSize: (productId: string, oldSize: string, newSize: ProductSize) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, size, quantity) => {
        const items = get().items;
        const existingItem = items.find(
          (item) => item.productId === product.id && item.size === size.size
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.productId === product.id && item.size === size.size
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                name: product.name,
                scientificName: product.scientificName,
                image: product.images[0] || '',
                size: size.size,
                price: size.price,
                quantity,
                stock: size.stock,
              },
            ],
          });
        }
      },
      removeItem: (productId, size) => {
        set({
          items: get().items.filter(
            (item) => !(item.productId === productId && item.size === size)
          ),
        });
      },
      updateQuantity: (productId, size, quantity) => {
        set({
          items: get().items.map((item) =>
            item.productId === productId && item.size === size
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        });
      },
      updateItemSize: (productId, oldSize, newSize) => {
        const items = get().items;
        const itemToUpdate = items.find(item => item.productId === productId && item.size === oldSize);
        if (!itemToUpdate) return;

        const otherItems = items.filter(item => !(item.productId === productId && item.size === oldSize));
        const existingTargetItem = otherItems.find(item => item.productId === productId && item.size === newSize.size);

        if (existingTargetItem) {
          // Merge with existing target size
          set({
            items: otherItems.map(item => 
              item.productId === productId && item.size === newSize.size
                ? { ...item, quantity: item.quantity + itemToUpdate.quantity }
                : item
            )
          });
        } else {
          // Update to new size
          set({
            items: items.map(item => 
              item.productId === productId && item.size === oldSize
                ? { ...item, size: newSize.size, price: newSize.price, stock: newSize.stock }
                : item
            )
          });
        }
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: 'arachnidsark-cart',
    }
  )
);
