'use client';

import { create } from 'zustand';
import type { Review, ReviewStatus } from '@/types';
import { DbClient } from '@/lib/db-client';
import { v4 as uuidv4 } from 'uuid';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  loadReviews: (targetId?: string, targetType?: 'product' | 'course' | 'consultation') => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateReviewStatus: (id: string, status: ReviewStatus) => void;
  deleteReview: (id: string) => void;
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  reviews: [],
  isLoading: false,

  loadReviews: (targetId, targetType) => {
    set({ isLoading: true });
    (async () => {
      const params: Record<string, string> = {};
      if (targetId) params.targetId = targetId;
      if (targetType) params.targetType = targetType;

      const all = await DbClient.getAll<Review>('reviews', params);
      set({
        reviews: all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        isLoading: false,
      });
    })();
  },

  addReview: async (reviewData) => {
    set({ isLoading: true });

    const newReview: Review = {
      ...reviewData,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await DbClient.create('reviews', newReview);
    const { reviews } = get();
    set({ reviews: [newReview, ...reviews], isLoading: false });
  },

  updateReviewStatus: (id, status) => {
    DbClient.update('reviews', id, { status });
    set(state => ({
      reviews: state.reviews.map(r => r.id === id ? { ...r, status } : r),
    }));
  },

  deleteReview: (id) => {
    DbClient.delete('reviews', id);
    set(state => ({
      reviews: state.reviews.filter(r => r.id !== id),
    }));
  },
}));
