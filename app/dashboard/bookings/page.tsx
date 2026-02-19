'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, type Booking, type Branch, type Product } from '@/app/lib/api';
import { CalendarCheck, Plus, Trash2 } from 'lucide-react';

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

type BookingLineForm = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

const makeEmptyLine = (productId = ''): BookingLineForm => ({
  productId,
  quantity: '1',
  unitPrice: '',
});

function numberFromInput(value: string): number {
  if (!value.trim()) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.NaN;
}

function normalizeQuantityForProduct(product: Product | undefined, quantity: string): string {
  if (!product) return quantity;
  if (product.isDefault) return '1';
  return quantity;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
    birthday: '',
    fullName: '',
    email: '',
    size: '',
    artistName: '',
    branchId: '',
    cashAmount: '',
    upiAmount: '',
    items: [makeEmptyLine()],
  });

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive || p.isDefault),
    [products]
  );
  const productMap = useMemo(
    () => new Map(activeProducts.map((p) => [p._id, p])),
    [activeProducts]
  );
  const defaultProductId = useMemo(
    () => activeProducts.find((p) => p.isDefault)?._id ?? '',
    [activeProducts]
  );

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
          isAdmin ? apiClient.getBranches() : Promise.resolve([] as Branch[]),
        ]);
        const productList = await apiClient.getProducts();
        setBookings(bookingRes.bookings ?? []);
        setTotal(bookingRes.total ?? 0);
        setBranches(branchList);
        setProducts(productList);
        if (isAdmin && branchList.length > 0) {
          setFormData((f) => (f.branchId ? f : { ...f, branchId: branchList[0]._id }));
        }
        setFormData((f) => {
          if (f.items.length > 0 && f.items.some((it) => it.productId)) return f;
          const defaultId = productList.find((p) => p.isDefault && p.isActive)?._id
            ?? productList.find((p) => p.isActive)?._id
            ?? '';
          return { ...f, items: [makeEmptyLine(defaultId)] };
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAdmin, branchFilter, startDate, endDate, page, limit]);

  const effectiveBranchId = isAdmin ? formData.branchId : user?.branchId;
  const cashAmount = numberFromInput(formData.cashAmount);
  const upiAmount = numberFromInput(formData.upiAmount);

  const itemTotal = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      const qty = numberFromInput(item.quantity);
      if (!product || !Number.isFinite(qty) || qty < 1) return sum;
      const editablePrice = numberFromInput(item.unitPrice);
      const unitPrice = product.isDefault ? editablePrice : product.basePrice;
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return sum;
      return sum + qty * unitPrice;
    }, 0);
  }, [formData.items, productMap]);

  const paymentTotal = (Number.isFinite(cashAmount) ? cashAmount : 0) + (Number.isFinite(upiAmount) ? upiAmount : 0);
  const paymentMismatch = Math.abs(paymentTotal - itemTotal) > 0.001;

  const setLine = (index: number, patch: Partial<BookingLineForm>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  };

  const addLine = () => {
    const fallbackId = defaultProductId || activeProducts[0]?._id || '';
    setFormData((prev) => ({ ...prev, items: [...prev.items, makeEmptyLine(fallbackId)] }));
  };

  const removeLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const size = formData.size.trim() ? Number(formData.size) : undefined;
    if (!effectiveBranchId) {
      setError(isAdmin ? 'Fill required fields correctly.' : 'Your branch is not set. Contact admin.');
      return;
    }
    if (!formData.fullName || !formData.phone || !formData.artistName || !formData.birthday) {
      setError('Please fill all required fields.');
      return;
    }
    if (size !== undefined && (Number.isNaN(size) || size < 0)) {
      setError('Size must be a valid number.');
      return;
    }
    if (formData.items.length === 0) {
      setError('At least one product item is required.');
      return;
    }

    const normalizedItems: Array<{ productId: string; quantity: number; unitPrice?: number }> = [];
    for (const line of formData.items) {
      const product = productMap.get(line.productId);
      const quantity = Number(line.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        setError('Each line item must have product and quantity >= 1.');
        return;
      }
      if (product.isDefault) {
        if (quantity !== 1) {
          setError('Default Tattoo product quantity must be 1.');
          return;
        }
        const unitPrice = Number(line.unitPrice);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          setError('Tattoo item requires editable unit price.');
          return;
        }
        normalizedItems.push({ productId: product._id, quantity, unitPrice });
      } else {
        normalizedItems.push({ productId: product._id, quantity });
      }
    }

    if (!Number.isFinite(cashAmount) || cashAmount < 0 || !Number.isFinite(upiAmount) || upiAmount < 0) {
      setError('Cash/UPI values must be zero or positive.');
      return;
    }
    if (cashAmount <= 0 && upiAmount <= 0) {
      setError('At least one payment amount must be greater than zero.');
      return;
    }
    if (paymentMismatch) {
      setError('Payment total must exactly match item total.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await apiClient.createBooking({
        phone: formData.phone,
        birthday: formData.birthday,
        fullName: formData.fullName,
        artistName: formData.artistName,
        branchId: effectiveBranchId,
        email: formData.email || undefined,
        size,
        items: normalizedItems,
        payment: {
          cashAmount,
          upiAmount,
        },
      });
      if (created) {
        setBookings((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        setFormData({
          phone: '',
          birthday: '',
          fullName: '',
          email: '',
          size: '',
          artistName: '',
          branchId: isAdmin ? formData.branchId : '',
          cashAmount: '',
          upiAmount: '',
          items: [makeEmptyLine(defaultProductId || activeProducts[0]?._id || '')],
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
  const resolveProductPrice = (line: BookingLineForm) => {
    const product = productMap.get(line.productId);
    if (!product) return Number.NaN;
    return product.isDefault ? numberFromInput(line.unitPrice) : product.basePrice;
  };
  const bookingTotal = (b: Booking) => b.payment?.totalAmount ?? b.amount ?? 0;
  const bookingPaymentLabel = (b: Booking) => {
    if (b.payment?.paymentMode === 'SPLIT') return 'CASH + UPI';
    if (b.payment?.paymentMode) return b.payment.paymentMode;
    return b.paymentMethod ?? '-';
  };

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
                  <label className="text-sm font-medium text-foreground">Birthday *</label>
                  <Input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
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

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Items *</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLine}
                    disabled={isSubmitting || activeProducts.length === 0}
                    className="border-border text-foreground"
                  >
                    <Plus className="size-4 mr-1" />
                    Add item
                  </Button>
                </div>

                {formData.items.map((line, index) => {
                  const selected = productMap.get(line.productId);
                  const unitPrice = resolveProductPrice(line);
                  const qty = numberFromInput(line.quantity);
                  const lineTotal =
                    Number.isFinite(unitPrice) && Number.isFinite(qty) && qty > 0
                      ? unitPrice * qty
                      : 0;

                  return (
                    <div key={`${index}-${line.productId}`} className="rounded-lg border border-border p-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-xs text-muted-foreground">Product</label>
                          <select
                            value={line.productId}
                            onChange={(e) => {
                              const nextId = e.target.value;
                              const nextProduct = productMap.get(nextId);
                              setLine(index, {
                                productId: nextId,
                                quantity: normalizeQuantityForProduct(nextProduct, line.quantity),
                                unitPrice: nextProduct && !nextProduct.isDefault
                                  ? String(nextProduct.basePrice)
                                  : line.unitPrice,
                              });
                            }}
                            disabled={isSubmitting || activeProducts.length === 0}
                            className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                          >
                            <option value="">Select product</option>
                            {activeProducts.map((p) => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-xs text-muted-foreground">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={selected?.isDefault ? '1' : line.quantity}
                            onChange={(e) => setLine(index, { quantity: normalizeQuantityForProduct(selected, e.target.value) })}
                            disabled={isSubmitting || !!selected?.isDefault}
                            className="bg-background border-border text-foreground"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-xs text-muted-foreground">
                            Unit Price {selected?.isDefault ? '(editable)' : '(fixed)'}
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={selected && !selected.isDefault ? String(selected.basePrice) : line.unitPrice}
                            onChange={(e) => setLine(index, { unitPrice: e.target.value })}
                            disabled={isSubmitting || (!!selected && !selected.isDefault)}
                            className="bg-background border-border text-foreground"
                          />
                        </div>
                        <div className="sm:col-span-2 flex sm:justify-end sm:items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(index)}
                            disabled={isSubmitting || formData.items.length === 1}
                            className="w-full sm:w-auto border-border text-foreground"
                          >
                            <Trash2 className="size-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Line total: INR {INR.format(lineTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cash Amount *</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.cashAmount}
                    onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                    placeholder="0"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">UPI Amount *</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.upiAmount}
                    onChange={(e) => setFormData({ ...formData, upiAmount: e.target.value })}
                    placeholder="0"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 text-sm bg-muted/30 space-y-1">
                <p className="text-foreground">Items total: <span className="font-semibold">INR {INR.format(itemTotal)}</span></p>
                <p className="text-foreground">Payment total: <span className="font-semibold">INR {INR.format(paymentTotal)}</span></p>
                {paymentMismatch && (
                  <p className="text-destructive text-xs">Payment total must match items total exactly.</p>
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
                    !formData.birthday ||
                    !formData.artistName ||
                    formData.items.length === 0 ||
                    activeProducts.length === 0 ||
                    paymentMismatch ||
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
            <>
              <div className="space-y-3 md:hidden">
                {bookings.map((b) => (
                  <div key={b._id} className="rounded-lg border border-border p-3 bg-background/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{b.fullName}</p>
                        <p className="text-xs text-muted-foreground">{b.bookingNumber}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">INR {INR.format(bookingTotal(b))}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <p className="text-muted-foreground">Phone: <span className="text-foreground">{b.phone}</span></p>
                      <p className="text-muted-foreground">Size: <span className="text-foreground">{b.size ?? '-'}</span></p>
                      <p className="text-muted-foreground">Artist: <span className="text-foreground">{b.artistName}</span></p>
                      <p className="text-muted-foreground">Payment: <span className="text-foreground">{bookingPaymentLabel(b)}</span></p>
                      {isAdmin && (
                        <p className="text-muted-foreground col-span-2">Branch: <span className="text-foreground">{branchName(b.branchId)}</span></p>
                      )}
                      {b.payment && (
                        <p className="text-muted-foreground col-span-2">
                          Cash {INR.format(b.payment.cashAmount)} + UPI {INR.format(b.payment.upiAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">#</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Customer</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Phone</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Items</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Total</th>
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
                      <td className="py-3 px-2 md:px-4 text-foreground text-xs">
                        {b.items?.length ? b.items.map((it) => `${it.productName ?? 'Item'} x${it.quantity}`).join(', ') : '-'}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-foreground">INR {INR.format(bookingTotal(b))}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{b.size ?? '-'}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{b.artistName}</td>
                      {isAdmin && (
                        <td className="py-3 px-2 md:px-4 text-foreground text-xs">{branchName(b.branchId)}</td>
                      )}
                      <td className="py-3 px-2 md:px-4 text-foreground text-xs">{bookingPaymentLabel(b)}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
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
