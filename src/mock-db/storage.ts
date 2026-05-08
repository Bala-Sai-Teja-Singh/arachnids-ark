'use client';

/**
 * LocalStorage wrapper providing a generic CRUD interface.
 * This abstraction makes it easy to swap with a real database later.
 */

const PREFIX = 'arachnidsark_';

export class LocalStorage {
  static getAll<T>(collection: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(`${PREFIX}${collection}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static setAll<T>(collection: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(data));
  }

  static getById<T extends { id: string }>(collection: string, id: string): T | null {
    const items = this.getAll<T>(collection);
    return items.find(item => item.id === id) || null;
  }

  static create<T extends { id: string }>(collection: string, item: T): T {
    const items = this.getAll<T>(collection);
    items.push(item);
    this.setAll(collection, items);
    return item;
  }

  static update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): T | null {
    const items = this.getAll<T>(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() } as T;
    this.setAll(collection, items);
    return items[index];
  }

  static delete<T extends { id: string }>(collection: string, id: string): boolean {
    const items = this.getAll<T>(collection);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    this.setAll(collection, filtered);
    return true;
  }

  static clear(collection: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${PREFIX}${collection}`);
  }

  static isSeeded(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`${PREFIX}seeded`) === 'true';
  }

  static markSeeded(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${PREFIX}seeded`, 'true');
  }

  static reset(): void {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}
