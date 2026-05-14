import { create } from 'zustand';
import { Db } from '@/lib/db';
import { toast } from 'sonner';

type ItemType = 'product' | 'course' | 'consultation';

interface Favorite {
  id: string;
  userId: string;
  targetId: string;
  targetType: ItemType;
}

interface FavoriteStore {
  likedIds: Record<ItemType, string[]>;
  isLoading: boolean;
  loadFavorites: (userId: string) => Promise<void>;
  toggleLike: (id: string, type: ItemType, userId?: string) => Promise<void>;
  isLiked: (id: string, type: ItemType) => boolean;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteStore>()((set, get) => ({
  likedIds: {
    product: [],
    course: [],
    consultation: [],
  },
  isLoading: false,

  isLiked: (id, type) => {
    return get().likedIds[type].includes(id);
  },

  loadFavorites: async (userId: string) => {
    set({ isLoading: true });
    try {
      const favorites = await Db.getAll<Favorite>('favorites', { userId });
      const likedIds = {
        product: favorites.filter(f => f.targetType === 'product').map(f => f.targetId),
        course: favorites.filter(f => f.targetType === 'course').map(f => f.targetId),
        consultation: favorites.filter(f => f.targetType === 'consultation').map(f => f.targetId),
      };
      set({ likedIds, isLoading: false });
    } catch (error) {
      console.error('Failed to load favorites:', error);
      set({ isLoading: false });
    }
  },

  clearFavorites: () => {
    set({
      likedIds: {
        product: [],
        course: [],
        consultation: [],
      }
    });
  },

  toggleLike: async (id, type, userId) => {
    if (!userId) {
      toast.error('Please login to save favorites');
      return;
    }

    const { likedIds } = get();
    const currentLikes = likedIds[type];
    const isCurrentlyLiked = currentLikes.includes(id);

    let newLikes: string[];
    let delta: number;

    if (isCurrentlyLiked) {
      newLikes = currentLikes.filter((i) => i !== id);
      delta = -1;
      toast.info('Removed from favorites');
      
      // Update DB
      await Db.delete('favorites', `${id}?userId=${userId}`);
    } else {
      newLikes = [...currentLikes, id];
      delta = 1;
      toast.success('Added to favorites');
      
      // Update DB
      await Db.create('favorites', {
        userId,
        targetId: id,
        targetType: type
      });
    }

    // Update the like count on the item itself (Product or Course)
    const collection = type === 'product' ? 'products' : type === 'course' ? 'courses' : null;
    if (collection) {
      (async () => {
        const item = await Db.getById<{ likes?: number }>(collection, id);
        if (item) {
          await Db.update(collection, id, {
            likes: Math.max(0, (item.likes || 0) + delta),
          });
        }
      })();
    }

    set({
      likedIds: {
        ...likedIds,
        [type]: newLikes,
      },
    });
  },
}));
