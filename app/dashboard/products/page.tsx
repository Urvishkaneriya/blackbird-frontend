'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, type Product } from '@/app/lib/api';
import { Package } from 'lucide-react';

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', basePrice: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', basePrice: '' });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const list = await apiClient.getProducts();
        setProducts(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.role]);

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [products]
  );

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;

  const resetCreateForm = () => setFormData({ name: '', basePrice: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const basePrice = Number(formData.basePrice);

    if (!name) {
      setError('Product name is required.');
      return;
    }
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError('Base price must be zero or more.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await apiClient.createProduct({ name, basePrice });
      if (created) {
        setProducts((prev) => [...prev, created]);
        resetCreateForm();
        setShowForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setEditData({ name: product.name, basePrice: String(product.basePrice) });
  };

  const handleUpdate = async (id: string) => {
    const name = editData.name.trim();
    const basePrice = Number(editData.basePrice);
    if (!name) {
      setError('Product name is required.');
      return;
    }
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError('Base price must be zero or more.');
      return;
    }

    setActionProductId(id);
    setError(null);
    try {
      const updated = await apiClient.updateProduct(id, { name, basePrice });
      if (updated) {
        setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
        setEditingId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setActionProductId(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    if (product.isDefault) return;

    setActionProductId(product._id);
    setError(null);
    try {
      const updated = await apiClient.updateProductStatus(product._id, !product.isActive);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? updated : p)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product status');
    } finally {
      setActionProductId(null);
    }
  };

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
            <CardTitle className="text-sm font-medium text-foreground">Total Products</CardTitle>
            <Package className="size-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Catalog items</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Active Products</CardTitle>
            <Package className="size-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">Available in booking form</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Add Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Product Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Aftercare Kit"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Base Price (INR) *</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.basePrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="400"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                    resetCreateForm();
                  }}
                  disabled={isSubmitting}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || formData.basePrice === ''}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-foreground">Products</CardTitle>
            <Button
              onClick={() => {
                setShowForm((v) => !v);
                setError(null);
              }}
              disabled={isLoading}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {showForm ? 'Cancel' : '+ Add Product'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No products yet</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {sortedProducts.map((p) => {
                  const rowBusy = actionProductId === p._id;
                  return (
                    <div key={p._id} className="rounded-lg border border-border p-3 bg-background/60 space-y-3">
                      {editingId === p._id ? (
                        <>
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                            className="bg-background border-border text-foreground"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={editData.basePrice}
                            onChange={(e) => setEditData((prev) => ({ ...prev, basePrice: e.target.value }))}
                            className="bg-background border-border text-foreground"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(p._id)}
                              disabled={rowBusy}
                              className="bg-primary text-primary-foreground"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              disabled={rowBusy}
                              className="border-border text-foreground"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{p.name}</p>
                              <p className="text-sm text-muted-foreground">INR {INR.format(p.basePrice)}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full border ${p.isActive ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(p)}
                              disabled={rowBusy}
                              className="border-border text-foreground"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(p)}
                              disabled={rowBusy || p.isDefault}
                              className="border-border text-foreground"
                            >
                              {p.isDefault ? 'Default Product' : p.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-3 font-semibold text-foreground">Base Price</th>
                      <th className="text-left py-3 px-3 font-semibold text-foreground">Type</th>
                      <th className="text-left py-3 px-3 font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-3 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((p) => {
                      const rowBusy = actionProductId === p._id;
                      return (
                        <tr key={p._id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-3">
                            {editingId === p._id ? (
                              <Input
                                value={editData.name}
                                onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                                className="bg-background border-border text-foreground"
                              />
                            ) : (
                              <span className="text-foreground font-medium">{p.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {editingId === p._id ? (
                              <Input
                                type="number"
                                min={0}
                                value={editData.basePrice}
                                onChange={(e) => setEditData((prev) => ({ ...prev, basePrice: e.target.value }))}
                                className="bg-background border-border text-foreground"
                              />
                            ) : (
                              <span className="text-foreground">INR {INR.format(p.basePrice)}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-foreground text-xs">{p.isDefault ? 'Default' : 'Custom'}</td>
                          <td className="py-3 px-3">
                            <span className={`text-xs px-2 py-1 rounded-full border ${p.isActive ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground'}`}>
                              {p.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {editingId === p._id ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdate(p._id)}
                                  disabled={rowBusy}
                                  className="bg-primary text-primary-foreground"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  disabled={rowBusy}
                                  className="border-border text-foreground"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(p)}
                                  disabled={rowBusy}
                                  className="border-border text-foreground"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleStatus(p)}
                                  disabled={rowBusy || p.isDefault}
                                  className="border-border text-foreground"
                                >
                                  {p.isDefault ? 'Default Product' : p.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
