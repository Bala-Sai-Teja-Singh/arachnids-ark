import { 
  Home, ShoppingBag, GraduationCap, Calendar, BookOpen,
  LayoutDashboard, Package, Users, Settings, Bell, ClipboardList, MessageSquare
} from 'lucide-react';

export const USER_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'Courses', href: '/courses', icon: GraduationCap },
  { label: 'Consultation', href: '/consultation', icon: Calendar },
  { label: 'Care Guides', href: '/care-guides', icon: BookOpen },
];

export const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'Courses', href: '/courses', icon: GraduationCap },
  { label: 'Consult', href: '/consultation', icon: Calendar },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Courses', href: '/admin/courses', icon: GraduationCap },
  { label: 'Consultations', href: '/admin/consultations', icon: Calendar },
  { label: 'Inquiries', href: '/admin/inquiries', icon: ClipboardList },
  { label: 'Enrollments', href: '/admin/enrollments', icon: MessageSquare },
  { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const DASHBOARD_NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Inquiries', href: '/dashboard/inquiries', icon: ClipboardList },
  { label: 'My Courses', href: '/dashboard/courses', icon: GraduationCap },
  { label: 'My Consultations', href: '/dashboard/consultations', icon: Calendar },

  { label: 'Profile', href: '/dashboard/profile', icon: Settings },
];
