'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, SafeUser, UserRole } from '@/types';
import { LocalStorage } from '@/mock-db/storage';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<SafeUser>) => void;
  hasRole: (role: UserRole) => boolean;
}

function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));

        const users = LocalStorage.getAll<User>('users');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
          set({ isLoading: false });
          return { success: false, error: 'Invalid email or password' };
        }

        set({ user: toSafeUser(user), isAuthenticated: true, isLoading: false });
        return { success: true };
      },

      signup: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true });
        await new Promise(r => setTimeout(r, 500));

        const users = LocalStorage.getAll<User>('users');
        if (users.find(u => u.email === email)) {
          set({ isLoading: false });
          return { success: false, error: 'Email already registered' };
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          phone,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        LocalStorage.create('users', newUser);
        set({ user: toSafeUser(newUser), isAuthenticated: true, isLoading: false });
        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates: Partial<SafeUser>) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
        set({ user: updated });
        // Also update in storage
        LocalStorage.update<User>('users', user.id, updates as Partial<User>);
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
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
