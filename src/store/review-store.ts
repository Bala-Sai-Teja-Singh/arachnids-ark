'use client';

import { create } from 'zustand';
import type { Review, ReviewStatus } from '@/types';
import { LocalStorage } from '@/mock-db/storage';
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
    const all = LocalStorage.getAll<Review>('reviews');
    
    let filtered = all;
    if (targetId && targetType) {
      filtered = all.filter(r => r.targetId === targetId && r.targetType === targetType);
    } else if (targetId) {
      // Fallback for old calls if any
      filtered = all.filter(r => r.targetId === targetId);
    }
    
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
    // Since we don't have target info here, we reload all for simplicity in the store 
    // or the caller should handle it.
    const all = LocalStorage.getAll<Review>('reviews');
    set({ reviews: all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  },

  deleteReview: (id) => {
    LocalStorage.delete('reviews', id);
    const all = LocalStorage.getAll<Review>('reviews');
    set({ reviews: all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  }
}));
