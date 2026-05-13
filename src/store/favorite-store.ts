'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DbClient } from '@/lib/db-client';
import { toast } from 'sonner';

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

        // Update likes count in DB (fire and forget)
        const collection = type === 'product' ? 'products' : type === 'course' ? 'courses' : 'bookings';
        (async () => {
          const item = await DbClient.getById<any>(collection, id);
          if (item) {
            await DbClient.update(collection, id, {
              likes: Math.max(0, (item.likes || 0) + delta),
            });
          }
        })();

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
