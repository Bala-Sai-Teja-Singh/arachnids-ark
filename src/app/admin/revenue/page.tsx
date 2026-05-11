'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, GraduationCap, Calendar, ArrowUpRight, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableMolecule } from '@/components/shared/molecules/table';
import { Input } from '@/components/shared/atoms/input';
import { Button } from '@/components/ui/button';
import { LocalStorage } from '@/mock-db/storage';
import { formatPrice } from '@/constants/pricing';
import type { Order, CourseEnrollment, ConsultationBooking } from '@/types';
import { Badge } from '@/components/ui/badge';
import { TabMolecule, type TabOption } from '@/components/shared/molecules/tabs';

const REVENUE_CATEGORIES: TabOption[] = [
  { value: 'all', label: 'All', icon: DollarSign },
  { value: 'product', label: 'Products', icon: ShoppingBag },
  { value: 'course', label: 'Courses', icon: GraduationCap },
  { value: 'consultation', label: 'Consultations', icon: Calendar },
];

interface RevenueItem {
  id: string;
  type: 'product' | 'course' | 'consultation' | 'mixed';
  name: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
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
      .filter(o => ['payment_verified', 'order_shipped', 'order_completed'].includes(o.status))
      .flatMap(o => {
        const itemsByType = o.items.reduce((acc, item) => {
          if (!acc[item.type]) acc[item.type] = [];
          acc[item.type].push(item);
          return acc;
        }, {} as Record<string, typeof o.items>);

        const rows: RevenueItem[] = [];

        // 1. Group products into one row
        if (itemsByType['product']) {
          const products = itemsByType['product'];
          const totalQty = products.reduce((acc, i) => acc + (i.quantity || 1), 0);
          const totalAmount = products.reduce((acc, i) => acc + (i.price * (i.quantity || 1)), 0);
          
          rows.push({
            id: `${o.id}-products`,
            type: 'product',
            name: products.length === 1 && products[0].quantity === 1 
              ? products[0].name 
              : `${totalQty} Items (${products.length} Species)`,
            userName: o.userName,
            userEmail: o.userEmail,
            userPhone: o.deliveryPhone,
            amount: totalAmount + (o.shippingCharge || 0), // Add shipping to product row
            date: o.createdAt,
            status: o.status
          });
        }

        // 2. Individual rows for courses and consultations
        ['course', 'consultation'].forEach(type => {
          if (itemsByType[type]) {
            itemsByType[type].forEach((item, idx) => {
              rows.push({
                id: `${o.id}-${type}-${idx}`,
                type: type as any,
                name: item.name + (item.quantity > 1 ? ` (x${item.quantity})` : ''),
                userName: o.userName,
                userEmail: o.userEmail,
                userPhone: o.deliveryPhone,
                amount: item.price * (item.quantity || 1),
                date: o.createdAt,
                status: o.status
              });
            });
          }
        });

        return rows;
      });

    const completedEnrollments: RevenueItem[] = enrollments
      .filter(e => e.status === 'enrolled' && !e.orderId)
      .map(e => ({
        id: e.id,
        type: 'course',
        name: e.courseTitle,
        userName: e.userName,
        userEmail: e.userEmail,
        userPhone: (e as any).userPhone,
        amount: e.totalPrice,
        date: e.createdAt,
        status: e.status
      }));

    const completedBookings: RevenueItem[] = bookings
      .filter(b => ['payment_verified', 'scheduled', 'completed'].includes(b.status) && !b.orderId)
      .map(b => {
        let name = `${b.duration} min Consultation`;
        if (b.items && b.items.length > 0) {
          if (b.items.length === 1) {
            name = b.items[0].label;
          } else {
            const totalMins = b.items.reduce((acc, curr) => acc + (curr.duration * (curr.quantity || 1)), 0);
            name = `${b.items.length} Sessions (${totalMins} mins)`;
          }
        }
        
        return {
          id: b.id,
          type: 'consultation',
          name,
          userName: b.userName,
          userEmail: b.userEmail,
          userPhone: (b as any).userPhone,
          amount: b.totalPrice || 0,
          date: b.createdAt,
          status: b.status
        };
      });

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
      const query = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.userName.toLowerCase().includes(query) ||
        item.userEmail.toLowerCase().includes(query) ||
        item.userPhone?.includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    }
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }
    setFilteredItems(result);
  }, [searchTerm, filterType, revenueItems]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(184, 134, 11); // Brand gold
    doc.text('Revenue Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('ArachnidsArk Administration Dashboard', 14, 30);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);
    doc.text(`Category: ${filterType === 'all' ? 'All Categories' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}`, 14, 46);
    
    // Stats Summary
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 52, 182, 20, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Total Transactions:', 20, 60);
    doc.text('Total Revenue:', 110, 60);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`${filteredItems.length}`, 20, 66);
    doc.text(`Rs. ${filteredItems.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}`, 110, 66);

    const tableData = filteredItems.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.name,
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item.userName,
      `Rs. ${item.amount.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Date', 'Description', 'Category', 'Customer', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [184, 134, 11],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    const fileName = `revenue-report-${filterType}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        {/* Header content if any */}
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
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by client name, email or phone..." 
            className="pl-10 bg-card/50 border-border"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <TabMolecule
          options={REVENUE_CATEGORIES}
          value={filterType}
          onValueChange={(val) => setFilterType(val as any)}
          className="w-full sm:w-auto"
        />
        <Button 
          variant="outline" 
          className="gap-2 border-border bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold ml-auto"
          onClick={exportToPDF}
        >
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <TableMolecule
        data={filteredItems}
        columns={[
          {
            header: 'Transaction Details',
            cell: (item) => (
              <>
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">#{item.id.slice(0, 8)}</div>
              </>
            )
          },
          {
            header: 'Category',
            cell: (item) => (
              <Badge variant="outline" className={`text-[10px] uppercase tracking-widest border-0 ${
                item.type === 'product' ? 'bg-brand-red/10 text-brand-red' :
                item.type === 'course' ? 'bg-brand-gold/10 text-brand-gold' :
                item.type === 'consultation' ? 'bg-green-500/10 text-green-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {item.type}
              </Badge>
            )
          },
          {
            header: 'Customer',
            cell: (item) => (
              <>
                <div className="text-sm font-medium">{item.userName}</div>
                <div className="text-xs text-muted-foreground">{item.userEmail}</div>
              </>
            )
          },
          {
            header: 'Date',
            cell: (item) => <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
          },
          {
            header: 'Amount',
            align: 'right',
            cell: (item) => <span className="font-bold text-brand-gold">{formatPrice(item.amount)}</span>
          }
        ]}
        renderMobileItem={(item) => (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm">{item.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono">#{item.id.slice(0, 8)}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] uppercase tracking-widest border-0 ${
                item.type === 'product' ? 'bg-brand-red/10 text-brand-red' :
                item.type === 'course' ? 'bg-brand-gold/10 text-brand-gold' :
                item.type === 'consultation' ? 'bg-green-500/10 text-green-400' :
                'bg-blue-500/10 text-blue-400'
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
        )}
        emptyDescription="No transactions found."
      />
    </div>
  );
}
