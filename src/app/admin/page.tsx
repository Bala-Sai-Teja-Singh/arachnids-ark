'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, GraduationCap, Calendar, DollarSign, ArrowUpRight, TrendingUp, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalStorage } from '@/mock-db/storage';
import { formatPrice } from '@/constants/pricing';
import type { User, Product, Course, Inquiry, CourseEnrollment, ConsultationBooking } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0, products: 0, courses: 0,
    totalRevenue: 0, activeInquiries: 0, activeConsultations: 0
  });
  const [revenueData, setRevenueData] = useState<{ name: string, total: number }[]>([]);

  useEffect(() => {
    const users = LocalStorage.getAll<User>('users');
    const products = LocalStorage.getAll<Product>('products');
    const courses = LocalStorage.getAll<Course>('courses');
    const inquiries = LocalStorage.getAll<Inquiry>('inquiries');
    const enrollments = LocalStorage.getAll<CourseEnrollment>('enrollments');
    const bookings = LocalStorage.getAll<ConsultationBooking>('bookings');

    const totalRevenue =
      inquiries.filter(i => ['payment_uploaded', 'verified', 'completed'].includes(i.status)).reduce((acc, curr) => acc + curr.totalPrice, 0) +
      enrollments.filter(e => ['payment_uploaded', 'verified', 'completed'].includes(e.status)).reduce((acc, curr) => acc + curr.totalPrice, 0) +
      bookings.filter(b => ['payment_uploaded', 'verified', 'completed'].includes(b.status)).reduce((acc, curr) => acc + (curr?.totalPrice || 0), 0);

    const activeInquiries = inquiries.filter(i => !['completed', 'cancelled', 'rejected'].includes(i.status)).length;
    const activeConsultations = bookings.filter(b => !['completed', 'cancelled', 'rejected'].includes(b.status)).length;

    setStats({
      users: users.length, products: products.length, courses: courses.length,
      totalRevenue, activeInquiries, activeConsultations
    });

    // Mock revenue data for chart
    const data = [
      { name: 'Jan', total: Math.floor(Math.random() * 50000) + 10000 },
      { name: 'Feb', total: Math.floor(Math.random() * 50000) + 15000 },
      { name: 'Mar', total: Math.floor(Math.random() * 50000) + 20000 },
      { name: 'Apr', total: Math.floor(Math.random() * 50000) + 25000 },
      { name: 'May', total: Math.floor(Math.random() * 50000) + 30000 },
      { name: 'Jun', total: Math.floor(Math.random() * 50000) + 40000 },
      { name: 'Jul', total: totalRevenue || 50000 }, // Current month
    ];
    setRevenueData(data);
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-brand-gold', trend: '+12.5%', href: '/admin/revenue' },
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400', trend: '+5.2%', href: '/admin/users' },
    { title: 'Active Order Requests', value: stats.activeInquiries, icon: ShoppingBag, color: 'text-brand-red', trend: '+18.1%', href: '/admin/inquiries' },
    { title: 'Upcoming Consults', value: stats.activeConsultations, icon: Calendar, color: 'text-green-400', trend: '+2.4%', href: '/admin/bookings' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor your business metrics and activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={stat.href}>
                <Card className="border-border hover:border-brand-gold/50 transition-all cursor-pointer group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs flex items-center gap-1 mt-1 text-green-400">
                      <TrendingUp className="h-3 w-3" /> {stat.trend} from last month
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
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
