'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalStorage } from '@/mock-db/storage';
import { useAuthStore } from '@/store/auth-store';
import { SystemSettings } from '@/types';

export function useModules() {
  const { user } = useAuthStore();
  const [modules, setModules] = useState({
    showCourses: true,
    showProducts: true,
    showConsultations: true,
  });

  useEffect(() => {
    const data = LocalStorage.getAll<SystemSettings>('system_settings');
    if (data.length > 0 && data[0].modules) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModules(data[0].modules);
    }
  }, []);

  const isVisible = useCallback((moduleName?: string) => {
    // Admins see everything
    if (user?.role === 'admin') return true;
    
    if (!moduleName) return true;
    switch (moduleName) {
      case 'courses': return modules.showCourses;
      case 'products': return modules.showProducts;
      case 'consultations': return modules.showConsultations;
      default: return true;
    }
  }, [user?.role, modules]);

  return { modules, isVisible };
}
