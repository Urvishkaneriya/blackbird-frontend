'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { apiClient, type DashboardData, type BranchDashboardData } from '@/app/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building2,
  CalendarCheck,
  IndianRupee,
  UserCircle,
  Download,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type DatePreset = 'today' | 'week' | 'month' | 'custom';

/** Format date as YYYY-MM-DD in local time (not UTC) so "Today" matches the user's calendar. */
function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateRange(preset: DatePreset, customStart?: string, customEnd?: string): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toYMD = toLocalYMD;

  if (preset === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  if (preset === 'today') {
    return { start: toYMD(today), end: toYMD(today) };
  }
  if (preset === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start: toYMD(start), end: toYMD(end) };
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: toYMD(start), end: toYMD(end) };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: toYMD(start), end: toYMD(end) };
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const CHART_COLORS = ['#d4a574', '#8b6f47', '#c9956f', '#b8956b', '#a0825f'];

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | BranchDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { start, end } = useMemo(
    () => getDateRange(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dash = await apiClient.getDashboard(start, end);
        setDashboardData(dash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [start, end]);

  const handleDownloadCSV = () => {
    const isBranchData = (d: DashboardData | BranchDashboardData): d is BranchDashboardData => 'branchInfo' in d;
    const summary = dashboardData?.summary;
    const rows: string[][] = [
      ['Dashboard Export', `${start} to ${end}`],
      [],
      ['Summary', ''],
      ['Total Bookings', String(summary?.totalBookings ?? 0)],
      ['Total Revenue', String(summary?.totalRevenue ?? 0)],
      ['Unique Customers', String(summary?.uniqueCustomersInRange ?? 0)],
      ['Average Order Value', String(summary?.averageOrderValue ?? 0)],
      [],
    ];
    if (dashboardData && !isBranchData(dashboardData) && dashboardData.byBranch?.length) {
      rows.push(['By Branch', '', '', '']);
      rows.push(['Branch', 'Bookings', 'Revenue', '']);
      dashboardData.byBranch.forEach((r) => {
        rows.push([r.branchName, String(r.bookingCount), String(r.revenue), '']);
      });
      rows.push([]);
    }
    if (dashboardData?.byPaymentMethod?.length) {
      rows.push(['By Payment Method', '', '']);
      rows.push(['Method', 'Count', 'Total Amount']);
      dashboardData.byPaymentMethod.forEach((r) => {
        rows.push([r.paymentMethod, String(r.count), String(r.totalAmount)]);
      });
    }
    downloadCSV(rows, `dashboard-${start}-to-${end}.csv`);
  };

  const summary = dashboardData?.summary ?? { totalBookings: 0, totalRevenue: 0, uniqueCustomersInRange: 0, averageOrderValue: 0 };
  const byPaymentMethod = dashboardData?.byPaymentMethod ?? [];
  const byBranch = dashboardData && 'byBranch' in dashboardData ? (dashboardData as DashboardData).byBranch ?? [] : [];
  const branchInfo = dashboardData && 'branchInfo' in dashboardData ? (dashboardData as BranchDashboardData).branchInfo : null;
  const totals = dashboardData && 'totals' in dashboardData ? (dashboardData as DashboardData).totals : null;

  const paymentChartData = byPaymentMethod.map((p) => ({ name: p.paymentMethod, value: p.totalAmount, count: p.count }));
  const branchChartData = byBranch.map((b) => ({ name: b.branchName || b.branchNumber, revenue: b.revenue, bookings: b.bookingCount }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Welcome, {user?.name}!</h2>
        <p className="text-muted-foreground text-sm md:text-base">
          {isAdmin ? 'System overview & management' : branchInfo ? `${branchInfo.branchName} · Your dashboard` : 'Your dashboard'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base md:text-lg">Date range</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {(['today', 'week', 'month', 'custom'] as const).map((preset) => (
                <Button
                  key={preset}
                  variant={datePreset === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDatePreset(preset);
                    if (preset === 'custom' && !customStart) {
                      const t = new Date();
                      const s = new Date(t.getFullYear(), t.getMonth(), 1);
                      const e = new Date(t.getFullYear(), t.getMonth() + 1, 0);
                      setCustomStart(toLocalYMD(s));
                      setCustomEnd(toLocalYMD(e));
                    }
                  }}
                  className="capitalize"
                >
                  {preset === 'today' ? 'Today' : preset === 'week' ? 'This week' : preset === 'month' ? 'This month' : 'Custom'}
                </Button>
              ))}
              {datePreset === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                  />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!dashboardData} className="border-border text-foreground">
                <Download className="size-4 mr-1.5" />
                Download CSV
              </Button>
            </div>
          </div>
          {dashboardData && (
            <p className="text-xs text-muted-foreground mt-1">
              {start} → {end}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Charts – between date range and stats */}
      {!isLoading && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <BarChart3 className="size-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Charts & graphs</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader>
                <CardTitle className="text-foreground">Revenue by payment method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  {paymentChartData.length > 0 && paymentChartData.some((d) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          label={({ name, value }) => `${name}: ${Number(value).toLocaleString()}`}
                        >
                          {paymentChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => Number(v).toLocaleString()} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No payment data in selected range</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(isAdmin || branchChartData.length > 0) ? (
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-foreground">Revenue by branch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full">
                    {branchChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={branchChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => Number(v).toLocaleString()} stroke="var(--muted-foreground)" />
                          <Tooltip formatter={(v: number) => Number(v).toLocaleString()} />
                          <Bar dataKey="revenue" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No branch data in selected range</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded mt-2 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Bookings</CardTitle>
              <CalendarCheck className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalBookings}</div>
              <p className="text-xs text-muted-foreground">In selected range</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
              <IndianRupee className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">In selected range</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Customers</CardTitle>
              <UserCircle className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.uniqueCustomersInRange}</div>
              <p className="text-xs text-muted-foreground">Unique in range</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Avg. order</CardTitle>
              <IndianRupee className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.averageOrderValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per booking</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && !isLoading && totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Branches</CardTitle>
              <Building2 className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-primary">{totals.totalBranches}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Employees</CardTitle>
              <Users className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-primary">{totals.totalEmployees}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
