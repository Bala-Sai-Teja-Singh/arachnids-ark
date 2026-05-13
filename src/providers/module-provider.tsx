'use client';

import { createContext, useContext, ReactNode } from 'react';

type ModuleSettings = {
  showCourses: boolean;
  showProducts: boolean;
  showConsultations: boolean;
};

const defaultModules: ModuleSettings = {
  showCourses: true,
  showProducts: true,
  showConsultations: true,
};

const ModuleContext = createContext<ModuleSettings>(defaultModules);

export function ModuleProvider({ children, initialModules }: { children: ReactNode, initialModules?: ModuleSettings }) {
  return (
    <ModuleContext.Provider value={initialModules || defaultModules}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useGlobalModules() {
  return useContext(ModuleContext);
}
