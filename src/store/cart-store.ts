import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductSize, Course } from '@/types';

export interface CartItem {
  id: string;
  name: string;
  scientificName?: string;
  image: string;
  price: number;
  quantity: number;
  type: 'product' | 'course' | 'consultation';
  stock?: number;
  metadata?: {
    size?: string;
    urgency?: string;
    query?: string;
    duration?: number;
    label?: string;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Product | Course | null, type: 'product' | 'course' | 'consultation', options?: Record<string, unknown>) => boolean;
  removeItem: (id: string, type: string, size?: string, urgency?: string) => void;
  updateQuantity: (id: string, type: string, quantity: number, size?: string, urgency?: string) => void;
  updateItemSize: (productId: string, oldSize: string, newSize: ProductSize) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item, type, options = {}) => {
        const items = get().items;
        let cartItem: CartItem;

        if (type === 'product') {
          const product = item as Product;
          const size = options.size as ProductSize;
          const quantity = (options.quantity as number) || 1;
          const existingItem = items.find(
            (i) => i.id === product.id && i.type === 'product' && i.metadata?.size === size.size
          );

          if (existingItem) {
            set({
              items: items.map((i) =>
                i.id === product.id && i.type === 'product' && i.metadata?.size === size.size
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            });
            return true;
          }

          cartItem = {
            id: product.id,
            name: product.name,
            scientificName: product.scientificName,
            image: product.images[0] || '',
            price: size.price,
            quantity: quantity,
            type: 'product',
            stock: size.stock,
            metadata: { size: size.size }
          };
        } else if (type === 'course') {
          const course = item as Course;
          const existingItem = items.find((i) => i.id === course.id && i.type === 'course');
          
          if (existingItem) return false; // Courses can only be added once

          cartItem = {
            id: course.id,
            name: course.title,
            image: course.thumbnail || '',
            price: course.price,
            quantity: 1,
            type: 'course',
            metadata: {}
          };
        } else {
          // Consultation
          const duration = options.duration as number;
          const label = options.label as string;
          const basePrice = options.basePrice as number;
          const urgency = options.urgency as string;
          const multiplier = options.multiplier as number;
          const query = options.query as string;
          const existingItem = items.find(
            (i) => i.id === 'consultation' && i.type === 'consultation' && i.metadata?.duration === duration && i.metadata?.urgency === urgency
          );

          if (existingItem) {
            set({
              items: items.map((i) =>
                i.id === 'consultation' && i.type === 'consultation' && i.metadata?.duration === duration && i.metadata?.urgency === urgency
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            });
            return true;
          }

          cartItem = {
            id: 'consultation',
            name: `Consultation: ${label}`,
            image: '',
            price: basePrice * multiplier,
            quantity: 1,
            type: 'consultation',
            metadata: { duration, label, urgency, query }
          };
        }

        set({ items: [...items, cartItem] });
        return true;
      },

      removeItem: (id, type, size, urgency) => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.type === type && i.metadata?.size === size && i.metadata?.urgency === urgency)
          ),
        });
      },

      updateQuantity: (id, type, quantity, size, urgency) => {
        set({
          items: get().items.map((i) =>
            i.id === id && i.type === type && i.metadata?.size === size && i.metadata?.urgency === urgency
              ? { ...i, quantity: Math.max(1, quantity) }
              : i
          ),
        });
      },

      updateItemSize: (productId, oldSize, newSize) => {
        const items = get().items;
        const itemToUpdate = items.find(i => i.id === productId && i.type === 'product' && i.metadata?.size === oldSize);
        if (!itemToUpdate) return;

        const otherItems = items.filter(i => !(i.id === productId && i.type === 'product' && i.metadata?.size === oldSize));
        const existingTargetItem = otherItems.find(i => i.id === productId && i.type === 'product' && i.metadata?.size === newSize.size);

        if (existingTargetItem) {
          set({
            items: otherItems.map(i => 
              i.id === productId && i.type === 'product' && i.metadata?.size === newSize.size
                ? { ...i, quantity: i.quantity + itemToUpdate.quantity }
                : i
            )
          });
        } else {
          set({
            items: items.map(i => 
              i.id === productId && i.type === 'product' && i.metadata?.size === oldSize
                ? { ...i, metadata: { ...i.metadata, size: newSize.size }, price: newSize.price, stock: newSize.stock }
                : i
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
