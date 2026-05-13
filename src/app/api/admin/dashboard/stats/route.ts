import { connectDB } from '@/lib/mongoose';
import { UserModel, ProductModel, CourseModel, OrderModel, BookingModel, RevenueModel } from '@/models';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const [userCount, productCount, courseCount, orders, bookings, revenues] = await Promise.all([
      UserModel.countDocuments(),
      ProductModel.countDocuments(),
      CourseModel.countDocuments(),
      OrderModel.find({}, 'status'),
      BookingModel.find({}, 'status'),
      RevenueModel.find({}, 'amount status sourceCreatedAt orderId')
    ]);

    const activeOrders = orders.filter(o => !['completed', 'cancelled', 'rejected', 'order_completed', 'order_cancelled'].includes(o.status)).length;
    const activeConsultations = bookings.filter(b => !['completed', 'cancelled', 'rejected'].includes(b.status)).length;

    const validOrderStatuses = ['payment_uploaded', 'verified', 'completed', 'payment_verified', 'order_shipped', 'order_completed'];
    const validEnrollmentStatuses = ['payment_uploaded', 'verified', 'completed', 'enrolled'];
    const validBookingStatuses = ['payment_uploaded', 'verified', 'completed', 'payment_verified', 'scheduled'];

    const isValidRevenue = (status: string) => {
      return validOrderStatuses.includes(status) || validEnrollmentStatuses.includes(status) || validBookingStatuses.includes(status);
    };

    const last7Months = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        name: d.toLocaleString('default', { month: 'short' }),
        total: 0
      };
    }).reverse();

    const monthMap = new Map();
    last7Months.forEach((m, index) => {
      monthMap.set(`${m.year}-${m.month}`, index);
    });

    let totalRevenue = 0;

    revenues.forEach(r => {
      if (isValidRevenue(r.status) && !r.orderId) {
        totalRevenue += r.amount;
        if (r.sourceCreatedAt) {
          const d = new Date(r.sourceCreatedAt);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthMap.has(key)) {
            last7Months[monthMap.get(key)].total += (r.amount || 0);
          }
        }
      }
    });

    return NextResponse.json({
      userCount,
      productCount,
      courseCount,
      totalRevenue,
      activeOrders,
      activeConsultations,
      revenueChartData: last7Months
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
