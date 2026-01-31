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

const SIDEBAR_ICON_CLASS = 'size-5 shrink-0';

export function DashboardLayout({ children, navItems, pageTitle }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false); // default closed on mobile
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- client-only mount flag */
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Desktop: sidebar open by default. Mobile: closed (drawer).
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(min-width: 768px)');
    /* eslint-disable react-hooks/set-state-in-effect -- sync sidebar state from media query */
    setSidebarOpen(mq.matches);
    /* eslint-enable react-hooks/set-state-in-effect */
    const handler = () => setSidebarOpen(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mounted]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const closeSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay when sidebar open */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar: drawer on mobile, collapsible on desktop */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-[width,transform] duration-300 ease-out
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-[4.5rem]'}
        `}
      >
        <div className="flex h-14 md:h-16 items-center justify-between border-b border-sidebar-border px-3 md:px-4 shrink-0">
          <Link href="/dashboard" className="flex items-center justify-center flex-1 min-w-0" onClick={closeSidebar}>
            {sidebarOpen ? (
              <BlackbirdLogoSmall />
            ) : (
              <span className="text-lg font-bold text-primary">BB</span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                  ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
                `}
              >
                <span className={SIDEBAR_ICON_CLASS}>{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2 shrink-0">
          {sidebarOpen && (
            <div className="text-xs text-sidebar-foreground/70 mb-2">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-sidebar-foreground/50 capitalize">{user?.role}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-center bg-sidebar border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className={`size-4 ${sidebarOpen ? 'mr-2' : ''}`} />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 md:h-16 shrink-0 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="size-5" />
            </button>
            {pageTitle && (
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">{pageTitle}</h1>
            )}
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
