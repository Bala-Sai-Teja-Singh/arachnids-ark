'use client';

import { useState, useEffect, useCallback } from 'react';
import { DbClient } from '@/lib/db-client';
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
    (async () => {
      const data = await DbClient.getSettings<SystemSettings>('system_settings');
      if (data && data.modules) {
        setModules(data.modules);
      }
    })();
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
