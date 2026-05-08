'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen pt-16 pb-24 md:pt-0 md:pb-0">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
