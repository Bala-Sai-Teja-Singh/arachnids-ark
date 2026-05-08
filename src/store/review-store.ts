'use client';

import { create } from 'zustand';
import type { Review, ReviewStatus } from '@/types';
import { LocalStorage } from '@/mock-db/storage';
import { v4 as uuidv4 } from 'uuid';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  loadReviews: (productId?: string) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateReviewStatus: (id: string, status: ReviewStatus) => void;
  deleteReview: (id: string) => void;
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  reviews: [],
  isLoading: false,

  loadReviews: (productId?: string) => {
    set({ isLoading: true });
    const all = LocalStorage.getAll<Review>('reviews');
    const filtered = productId 
      ? all.filter(r => r.productId === productId)
      : all;
    
    set({ 
      reviews: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
      isLoading: false 
    });
  },

  addReview: async (reviewData) => {
    set({ isLoading: true });
    // Simulate delay
    await new Promise(r => setTimeout(r, 500));

    const newReview: Review = {
      ...reviewData,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    LocalStorage.create('reviews', newReview);
    const { reviews } = get();
    set({ reviews: [newReview, ...reviews], isLoading: false });
  },

  updateReviewStatus: (id, status) => {
    LocalStorage.update<Review>('reviews', id, { status });
    get().loadReviews();
  },

  deleteReview: (id) => {
    LocalStorage.delete('reviews', id);
    get().loadReviews();
  }
}));
