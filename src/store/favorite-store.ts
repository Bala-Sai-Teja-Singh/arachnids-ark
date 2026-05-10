'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocalStorage } from '@/mock-db/storage';
import { toast } from 'sonner';
import type { Product, Course, ConsultationBooking } from '@/types';

type ItemType = 'product' | 'course' | 'consultation';

interface FavoriteStore {
  likedIds: Record<ItemType, string[]>;
  toggleLike: (id: string, type: ItemType) => void;
  isLiked: (id: string, type: ItemType) => boolean;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      likedIds: {
        product: [],
        course: [],
        consultation: [],
      },

      isLiked: (id, type) => {
        return get().likedIds[type].includes(id);
      },

      toggleLike: (id, type) => {
        const { likedIds } = get();
        const currentLikes = likedIds[type];
        const isCurrentlyLiked = currentLikes.includes(id);

        let newLikes: string[];
        let delta: number;

        if (isCurrentlyLiked) {
          newLikes = currentLikes.filter((i) => i !== id);
          delta = -1;
          toast.info('Removed from favorites');
        } else {
          newLikes = [...currentLikes, id];
          delta = 1;
          toast.success('Added to favorites');
        }

        // Update local storage for the specific collection
        const collection = type === 'product' ? 'products' : type === 'course' ? 'courses' : 'bookings';
        
        // Note: For consultations, we might not have a base 'consultation' collection 
        // since bookings are per-user. But courses and products do.
        if (collection !== 'bookings') {
          const item = LocalStorage.getById<Product | Course>(collection, id);
          if (item) {
            LocalStorage.update<Product | Course>(collection, id, { 
              likes: Math.max(0, (item.likes || 0) + delta) 
            });
          }
        } else {
          // If it's a consultation booking, we update the specific booking
          const booking = LocalStorage.getById<ConsultationBooking>('bookings', id);
          if (booking) {
             LocalStorage.update<ConsultationBooking>('bookings', id, { 
               likes: Math.max(0, (booking.likes || 0) + delta) 
             });
          }
        }

        set({
          likedIds: {
            ...likedIds,
            [type]: newLikes,
          },
        });
      },
    }),
    {
      name: 'arachnidsark-favorites',
    }
  )
);
