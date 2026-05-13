'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, SafeUser, UserRole } from '@/types';
import { DbClient } from '@/lib/db-client';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<SafeUser>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole) => boolean;
  checkEmailAvailability: (email: string) => Promise<{ available: boolean }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        const result = await DbClient.login(email, password);

        if (result.error || !result.user) {
          set({ isLoading: false });
          return { success: false, error: result.error || 'Invalid email or password' };
        }

        set({ user: result.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      },

      signup: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true });

        const newUser = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          phone,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          const created = await DbClient.create<User>('users', newUser);
          // Remove password from the response for safe user
          const { password: _, ...safeUser } = created as any;
          set({ user: safeUser, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch {
          set({ isLoading: false });
          return { success: false, error: 'Signup failed' };
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates: Partial<SafeUser>) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
        set({ user: updated });
        // Also update in DB
        DbClient.update('users', user.id, updates);
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true });

        const { user } = get();
        if (!user) {
          set({ isLoading: false });
          return { success: false, error: 'Not authenticated' };
        }

        const result = await DbClient.changePassword(user.id, currentPassword, newPassword);
        set({ isLoading: false });
        return result;
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
      },

      checkEmailAvailability: async (email: string) => {
        return DbClient.checkEmailAvailability(email);
      },
    }),
    {
      name: 'arachnidsark-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
