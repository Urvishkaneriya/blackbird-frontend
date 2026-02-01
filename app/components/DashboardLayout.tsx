'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { BlackbirdLogoSmall } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const SIDEBAR_WIDTH = 260;

export function DashboardLayout({ children, navItems, pageTitle }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(min-width: 768px)');
    if (mq.matches) setDrawerOpen(false);
    const handler = () => { if (mq.matches) setDrawerOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mounted]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const closeDrawer = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setDrawerOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay when drawer open */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-200 ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Side drawer */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border
          transition-[transform,width] duration-200 ease-out
          md:translate-x-0 md:shrink-0
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: SIDEBAR_WIDTH }}
      >
        <div className="flex h-14 md:h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0">
          <Link href="/dashboard" className="flex items-center min-w-0" onClick={closeDrawer}>
            <BlackbirdLogoSmall />
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeDrawer}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/80'}
                `}
              >
                <span className="size-5 shrink-0 flex items-center justify-center [&>svg]:size-5">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border shrink-0 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/70 capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4 mr-2 shrink-0" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            className="p-2 -ml-1 rounded-lg hover:bg-muted text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-foreground truncate flex-1 min-w-0">
            {pageTitle ?? 'Dashboard'}
          </h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
