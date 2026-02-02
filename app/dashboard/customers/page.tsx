'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient, type UserCustomer, type Branch } from '@/app/lib/api';
import { UserCircle } from 'lucide-react';

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserCustomer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [branchFilter, setBranchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [userRes, branchList] = await Promise.all([
          apiClient.getUsers({
            branchId: branchFilter || undefined,
            page,
            limit,
          }),
          apiClient.getBranches(),
        ]);
        setUsers(userRes.users ?? []);
        setTotal(userRes.total ?? 0);
        setBranches(branchList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.role, branchFilter, page, limit]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Customers</CardTitle>
            <UserCircle className="size-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{total}</div>
            <p className="text-xs text-muted-foreground">From bookings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <CardTitle className="text-foreground">Customers</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-muted-foreground">Branch</label>
              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
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
            <div className="text-center py-8 text-muted-foreground">No customers yet</div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Phone</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Orders</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-2 md:px-4 text-foreground font-medium">{u.fullName}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{u.phone}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{u.email ?? '-'}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{u.totalOrders}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{u.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && total > limit && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / limit)} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="border-border text-foreground"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="border-border text-foreground"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
