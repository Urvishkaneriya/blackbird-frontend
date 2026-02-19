'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { DashboardLayout, type NavItem } from '@/app/components/DashboardLayout';
import { LayoutDashboard, Users, Building2, CalendarCheck, UserCircle, Settings, Megaphone, Package, Gift } from 'lucide-react';

const iconClass = 'size-5 shrink-0';

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className={iconClass} /> },
  { label: 'Staff', href: '/dashboard/staff', icon: <Users className={iconClass} /> },
  { label: 'Branches', href: '/dashboard/branches', icon: <Building2 className={iconClass} /> },
  { label: 'Products', href: '/dashboard/products', icon: <Package className={iconClass} /> },
  { label: 'Bookings', href: '/dashboard/bookings', icon: <CalendarCheck className={iconClass} /> },
  { label: 'Birthdays', href: '/dashboard/birthdays', icon: <Gift className={iconClass} /> },
  { label: 'Customers', href: '/dashboard/customers', icon: <UserCircle className={iconClass} /> },
  { label: 'Marketing', href: '/dashboard/marketing', icon: <Megaphone className={iconClass} /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className={iconClass} /> },
];

const STAFF_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className={iconClass} /> },
  { label: 'Bookings', href: '/dashboard/bookings', icon: <CalendarCheck className={iconClass} /> },
  { label: 'Birthdays', href: '/dashboard/birthdays', icon: <Gift className={iconClass} /> },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/staff': 'Staff',
  '/dashboard/branches': 'Branches',
  '/dashboard/products': 'Products',
  '/dashboard/bookings': 'Bookings',
  '/dashboard/birthdays': 'Birthdays',
  '/dashboard/customers': 'Customers',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/settings': 'Settings',
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const pageTitle = TITLES[pathname ?? ''] ?? 'Dashboard';
  const navItems = user?.role === 'admin' ? ADMIN_NAV : STAFF_NAV;

  return (
    <ProtectedRoute>
      <DashboardLayout navItems={navItems} pageTitle={pageTitle}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
