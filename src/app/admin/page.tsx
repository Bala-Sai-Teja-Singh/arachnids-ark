'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';
import { Users, ShoppingBag, GraduationCap, Calendar, DollarSign, ArrowUpRight, TrendingUp, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Db } from '@/lib/db';
import { formatPrice } from '@/constants/pricing';
import type { User, Product, Course, Order, CourseEnrollment, ConsultationBooking } from '@/types';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

import { StatCard } from '@/components/shared/molecules/stat-card';
import { SectionHeader } from '@/components/shared/molecules/section-header';

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    users: 0, products: 0, courses: 0,
    totalRevenue: 0, activeOrders: 0, activeConsultations: 0
  });
  const [revenueData, setRevenueData] = useState<{ name: string, total: number }[]>([]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setStats({
        users: data.userCount,
        products: data.productCount,
        courses: data.courseCount,
        totalRevenue: data.totalRevenue,
        activeOrders: data.activeOrders,
        activeConsultations: data.activeConsultations
      });
      setRevenueData(data.revenueChartData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message || 'Failed to connect to the analytical engine.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 border-4 border-brand-gold/20 border-t-brand-gold rounded-full"
        />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Calibrating Dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <Bug className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">Telemetery Interrupted</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchStats}
          className="border-red-500/20 hover:bg-red-500/5 text-red-500 font-bold uppercase text-[10px] tracking-widest"
        >
          Attempt Re-calibration
        </Button>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-brand-gold', trend: '+12.5%', href: '/admin/revenue' },
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400', trend: '+5.2%', href: '/admin/users' },
    { title: 'Active Orders', value: stats.activeOrders, icon: ShoppingBag, color: 'text-brand-red', trend: '+18.1%', href: '/admin/orders' },
    { title: 'Upcoming Consults', value: stats.activeConsultations, icon: Calendar, color: 'text-green-400', trend: '+2.4%', href: '/admin/bookings' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.color}
            trend={stat.trend}
            href={stat.href}
            delay={i * 0.1}
            description="from last month"
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-border lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-0 pb-4">
            <div className="h-[300px] w-full min-h-[300px]" style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-gold)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--brand-gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => [formatPrice(value || 0), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--brand-gold)" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-brand-red/10 flex items-center justify-center mr-4">
                  <Bug className="h-5 w-5 text-brand-red" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Total Products</p>
                  <p className="text-sm text-muted-foreground">{stats.products} species</p>
                </div>
                <div className="font-medium">
                  <Link href="/admin/products" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Manage <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center mr-4">
                  <GraduationCap className="h-5 w-5 text-brand-gold" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">Active Courses</p>
                  <p className="text-sm text-muted-foreground">{stats.courses} published</p>
                </div>
                <div className="font-medium">
                  <Link href="/admin/courses" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Manage <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
