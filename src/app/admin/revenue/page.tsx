'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, GraduationCap, Calendar, ArrowUpRight, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LocalStorage } from '@/mock-db/storage';
import { formatPrice } from '@/constants/pricing';
import type { Order, CourseEnrollment, ConsultationBooking } from '@/types';
import { Badge } from '@/components/ui/badge';

interface RevenueItem {
  id: string;
  type: 'product' | 'course' | 'consultation';
  name: string;
  userName: string;
  userEmail: string;
  amount: number;
  date: string;
  status: string;
}

export default function AdminRevenuePage() {
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RevenueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'course' | 'consultation'>('all');
  const [totals, setTotals] = useState({
    total: 0,
    products: 0,
    courses: 0,
    consultations: 0
  });

  useEffect(() => {
    const orders = LocalStorage.getAll<Order>('orders');
    const enrollments = LocalStorage.getAll<CourseEnrollment>('enrollments');
    const bookings = LocalStorage.getAll<ConsultationBooking>('bookings');

    const completedOrders: RevenueItem[] = orders
      .filter(o => ['payment_uploaded', 'verified', 'completed'].includes(o.status))
      .map(o => ({
        id: o.id,
        type: 'product',
        name: o.items.length === 1 ? o.items[0].productName : `${o.items.length} Species Order`,
        userName: o.userName,
        userEmail: o.userEmail,
        amount: o.totalPrice,
        date: o.createdAt,
        status: o.status
      }));

    const completedEnrollments: RevenueItem[] = enrollments
      .filter(e => ['payment_uploaded', 'verified', 'completed'].includes(e.status))
      .map(e => ({
        id: e.id,
        type: 'course',
        name: e.courseTitle,
        userName: e.userName,
        userEmail: e.userEmail,
        amount: e.totalPrice,
        date: e.createdAt,
        status: e.status
      }));

    const completedBookings: RevenueItem[] = bookings
      .filter(b => ['payment_uploaded', 'verified', 'completed'].includes(b.status))
      .map(b => ({
        id: b.id,
        type: 'consultation',
        name: `${b.duration} min Consultation`,
        userName: b.userName,
        userEmail: b.userEmail,
        amount: b.totalPrice || 0,
        date: b.createdAt,
        status: b.status
      }));

    const allItems = [...completedOrders, ...completedEnrollments, ...completedBookings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setRevenueItems(allItems);
    setFilteredItems(allItems);

    setTotals({
      total: allItems.reduce((acc, curr) => acc + curr.amount, 0),
      products: completedOrders.reduce((acc, curr) => acc + curr.amount, 0),
      courses: completedEnrollments.reduce((acc, curr) => acc + curr.amount, 0),
      consultations: completedBookings.reduce((acc, curr) => acc + curr.amount, 0),
    });
  }, []);

  useEffect(() => {
    let result = revenueItems;
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }
    setFilteredItems(result);
  }, [searchTerm, filterType, revenueItems]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Financial Overview</h1>
          <p className="text-muted-foreground text-sm">Detailed breakdown of all revenue sources.</p>
        </div>
        <Button variant="outline" className="gap-2 border-border bg-card/50">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-brand-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-gold">{formatPrice(totals.total)}</div>
            <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +15% vs last month
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.products)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">From order requests</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-brand-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.courses)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">From enrollments</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.consultations)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">From expert bookings</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="pl-9 bg-card/50 border-border"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'product', 'course', 'consultation'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className={`capitalize text-[10px] uppercase tracking-widest h-9 px-3 sm:px-4 ${
                filterType === type ? 'bg-brand-gold text-black hover:bg-brand-gold/90' : 'border-border'
              }`}
            >
              {type === 'all' ? 'All' : type === 'consultation' ? (
                <>
                  <span className="hidden sm:inline">Consultations</span>
                  <span className="sm:hidden">Consults</span>
                </>
              ) : `${type}s`}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead className="font-bold">Transaction Details</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                    No completed transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-border group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">#{item.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-widest border-0 ${
                        item.type === 'product' ? 'bg-brand-red/10 text-brand-red' :
                        item.type === 'course' ? 'bg-brand-gold/10 text-brand-gold' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{item.userName}</div>
                      <div className="text-xs text-muted-foreground">{item.userEmail}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-brand-gold">{formatPrice(item.amount)}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">No transactions found.</div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm">{item.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">#{item.id.slice(0, 8)}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-widest border-0 ${
                    item.type === 'product' ? 'bg-brand-red/10 text-brand-red' :
                    item.type === 'course' ? 'bg-brand-gold/10 text-brand-gold' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    {item.type}
                  </Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.userName}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-lg font-bold text-brand-gold">
                    {formatPrice(item.amount)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
