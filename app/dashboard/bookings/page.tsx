'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, type Booking, type Branch } from '@/app/lib/api';
import { CalendarCheck } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [branchFilter, setBranchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    fullName: '',
    email: '',
    amount: '',
    size: '',
    artistName: '',
    paymentMethod: 'CASH' as 'CASH' | 'UPI',
    branchId: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [bookingRes, branchList] = await Promise.all([
          apiClient.getBookings({
            ...(isAdmin && branchFilter ? { branchId: branchFilter } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
            page,
            limit,
          }),
          isAdmin ? apiClient.getBranches() : Promise.resolve([]),
        ]);
        setBookings(bookingRes.bookings ?? []);
        setTotal(bookingRes.total ?? 0);
        setBranches(branchList);
        if (isAdmin && branchList.length > 0) {
          setFormData((f) => (f.branchId ? f : { ...f, branchId: branchList[0]._id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAdmin, branchFilter, startDate, endDate, page, limit]);

  const effectiveBranchId = isAdmin ? formData.branchId : user?.branchId;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    const size = Number(formData.size);
    if (!effectiveBranchId || Number.isNaN(amount) || Number.isNaN(size)) {
      setError(isAdmin ? 'Fill required fields correctly.' : 'Your branch is not set. Contact admin.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await apiClient.createBooking({
        phone: formData.phone,
        fullName: formData.fullName,
        amount,
        size,
        artistName: formData.artistName,
        paymentMethod: formData.paymentMethod,
        branchId: effectiveBranchId,
        email: formData.email || undefined,
      });
      if (created) {
        setBookings((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        setFormData({
          phone: '',
          fullName: '',
          email: '',
          amount: '',
          size: '',
          artistName: '',
          paymentMethod: 'CASH',
          branchId: isAdmin ? formData.branchId : '',
        });
        setShowForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchName = (b: Booking['branchId']) =>
    typeof b === 'object' && b !== null && 'name' in b ? b.name : '-';

  const canCreate = isAdmin || (user?.branchId && user.role === 'employee');

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
            <CardTitle className="text-sm font-medium text-foreground">Total Bookings</CardTitle>
            <CalendarCheck className="size-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{total}</div>
            <p className="text-xs text-muted-foreground">Invoices (filtered)</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">New Booking</CardTitle>
          </CardHeader>
          <CardContent>
            {!isAdmin && !user?.branchId && (
              <p className="text-sm text-muted-foreground mb-4">Your branch is not set. Contact admin.</p>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Customer Name *</label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Jane Doe"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Amount *</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="5000"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Size *</label>
                  <Input
                    type="number"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="5"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Artist Name *</label>
                  <Input
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    placeholder="Artist"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Payment *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'CASH' | 'UPI' })}
                    disabled={isSubmitting}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Branch *</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      disabled={isSubmitting || branches.length === 0}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); setError(null); }}
                  disabled={isSubmitting}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.fullName ||
                    !formData.phone ||
                    !formData.amount ||
                    formData.size === '' ||
                    !formData.artistName ||
                    !effectiveBranchId
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-foreground">Bookings</CardTitle>
              <Button
                onClick={() => { setShowForm(!showForm); setError(null); }}
                disabled={isLoading || !canCreate}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {showForm ? 'Cancel' : '+ New Booking'}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <>
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
                </>
              )}
              <label className="text-sm text-muted-foreground ml-0 sm:ml-2">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
              />
              <label className="text-sm text-muted-foreground">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">#</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Customer</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Phone</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Amount</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Size</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Artist</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Branch</th>
                    )}
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-2 md:px-4 text-foreground text-xs">{b.bookingNumber}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground font-medium">{b.fullName}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{b.phone}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{b.amount}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{b.size}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{b.artistName}</td>
                      {isAdmin && (
                        <td className="py-3 px-2 md:px-4 text-foreground text-xs">{branchName(b.branchId)}</td>
                      )}
                      <td className="py-3 px-2 md:px-4 text-foreground text-xs">{b.paymentMethod}</td>
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
