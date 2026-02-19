'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient, type UserCustomer } from '@/app/lib/api';
import { CalendarCheck, Gift } from 'lucide-react';

function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
}

export default function BirthdaysPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryDate, setQueryDate] = useState(() => toLocalYMD(new Date()));

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.getUsers({
          birthday: queryDate,
          page: 1,
          limit: 100,
        });
        setUsers(res.users ?? []);
        setTotal(res.total ?? res.count ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load birthdays');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, queryDate]);

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Birthdays</CardTitle>
            <Gift className="size-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{total}</div>
            <p className="text-xs text-muted-foreground">Matching customers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-foreground">Birthday Customers</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="date"
                value={queryDate}
                onChange={(e) => setQueryDate(e.target.value)}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQueryDate(toLocalYMD(new Date()))}
                className="border-border text-foreground"
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No birthdays found for selected date</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {users.map((u) => (
                  <div key={u._id} className="rounded-lg border border-border p-3 bg-background/60">
                    <p className="font-medium text-foreground">{u.fullName}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <p className="text-muted-foreground">Phone: <span className="text-foreground">{u.phone}</span></p>
                      <p className="text-muted-foreground">Birthday: <span className="text-foreground">{formatDate(u.birthday)}</span></p>
                      <p className="text-muted-foreground col-span-2">Email: <span className="text-foreground">{u.email ?? '-'}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Phone</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Email</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Birthday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-2 md:px-4 text-foreground font-medium">{u.fullName}</td>
                        <td className="py-3 px-2 md:px-4 text-foreground">{u.phone}</td>
                        <td className="py-3 px-2 md:px-4 text-foreground">{u.email ?? '-'}</td>
                        <td className="py-3 px-2 md:px-4 text-foreground">{formatDate(u.birthday)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
