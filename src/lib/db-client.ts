'use client';

/**
 * DbClient — Async API client that replaces LocalStorage.
 * Drop-in replacement with the same method signatures (but async).
 * Calls the /api/db/[collection] routes for MongoDB Atlas operations.
 */

const API_BASE = '/api/db';

// Maps old LocalStorage collection names to API route paths
const COLLECTION_MAP: Record<string, string> = {
  users: 'users',
  products: 'products',
  orders: 'orders',
  courses: 'courses',
  enrollments: 'enrollments',
  bookings: 'bookings',
  notifications: 'notifications',
  reviews: 'reviews',
  care_guides: 'care-guides',
  system_settings: 'system-settings',
  consultation_settings: 'consultation-settings',
};

function getEndpoint(collection: string): string {
  return COLLECTION_MAP[collection] || collection;
}

export class DbClient {
  static async getAll<T>(collection: string, params?: Record<string, string>): Promise<T[]> {
    const endpoint = getEndpoint(collection);
    const url = new URL(`${API_BASE}/${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    try {
      const res = await fetch(url.toString());
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  static async getById<T>(collection: string, id: string): Promise<T | null> {
    const endpoint = getEndpoint(collection);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async create<T>(collection: string, item: any): Promise<T> {
    const endpoint = getEndpoint(collection);
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return await res.json();
  }

  static async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const endpoint = getEndpoint(collection);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async delete(collection: string, id: string): Promise<boolean> {
    const endpoint = getEndpoint(collection);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Singleton helpers for system_settings & consultation_settings ---

  static async getSettings<T>(collection: string): Promise<T | null> {
    const endpoint = getEndpoint(collection);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }

  static async updateSettings<T>(collection: string, updates: Partial<T>): Promise<T | null> {
    const endpoint = getEndpoint(collection);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // --- Bulk notification helpers ---

  static async markAllNotificationsRead(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'markAllRead' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async clearAllNotifications(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'clearAll' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Auth helpers ---

  static async login(email: string, password: string): Promise<{ user?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      return { user: data };
    } catch {
      return { error: 'Network error' };
    }
  }

  static async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/users/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await res.json();
    } catch {
      return { available: false };
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }
}
