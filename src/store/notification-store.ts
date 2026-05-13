'use client';

import { create } from 'zustand';
import type { Notification } from '@/types';
import { DbClient } from '@/lib/db-client';
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
    (async () => {
      const all = await DbClient.getAll<Notification>('notifications', { userId });
      const sorted = all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      set({
        currentUserId: userId,
        notifications: sorted,
        unreadCount: sorted.filter(n => !n.read).length,
      });
    })();
  },

  addNotification: (notif) => {
    const notification: Notification = {
      ...notif,
      id: uuidv4(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Save to DB
    DbClient.create('notifications', notification);

    const state = get();
    if (notification.userId === state.currentUserId) {
      set({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      });
    }
  },

  markAsRead: (id: string) => {
    DbClient.update('notifications', id, { read: true });
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: (userId: string) => {
    DbClient.markAllNotificationsRead(userId);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: (userId: string) => {
    DbClient.clearAllNotifications(userId);
    set({ notifications: [], unreadCount: 0 });
  },
}));
