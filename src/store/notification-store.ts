'use client';

import { create } from 'zustand';
import type { Notification } from '@/types';
import { LocalStorage } from '@/mock-db/storage';
import { v4 as uuidv4 } from 'uuid';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  currentUserId: string | null;
  loadNotifications: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  clearAll: (userId: string) => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  currentUserId: null,

  loadNotifications: (userId: string) => {
    const all = LocalStorage.getAll<Notification>('notifications');
    const userNotifs = all.filter(n => n.userId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    set({
      currentUserId: userId,
      notifications: userNotifs,
      unreadCount: userNotifs.filter(n => !n.read).length,
    });
  },

  addNotification: (notif) => {
    const notification: Notification = {
      ...notif,
      id: uuidv4(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    LocalStorage.create('notifications', notification);
    
    const state = get();
    if (notification.userId === state.currentUserId) {
      set({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      });
    }
  },

  markAsRead: (id: string) => {
    LocalStorage.update<Notification>('notifications', id, { read: true });
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: (userId: string) => {
    const all = LocalStorage.getAll<Notification>('notifications');
    const updated = all.map(n => n.userId === userId ? { ...n, read: true } : n);
    LocalStorage.setAll('notifications', updated);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: (userId: string) => {
    const all = LocalStorage.getAll<Notification>('notifications');
    const filtered = all.filter(n => n.userId !== userId);
    LocalStorage.setAll('notifications', filtered);
    set({ notifications: [], unreadCount: 0 });
  },
}));
