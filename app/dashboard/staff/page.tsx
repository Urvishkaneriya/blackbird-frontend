'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, type Employee, type Branch } from '@/app/lib/api';
import { Users } from 'lucide-react';

export default function StaffPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [branchFilter, setBranchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    branchId: '',
  });

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
        const [empRes, branchList] = await Promise.all([
          apiClient.getEmployees({
            branchId: branchFilter || undefined,
            page,
            limit,
          }),
          apiClient.getBranches(),
        ]);
        setEmployees(empRes.employees ?? []);
        setTotal(empRes.total ?? 0);
        setBranches(branchList);
        if (branchList.length > 0) {
          setFormData((f) => (f.branchId ? f : { ...f, branchId: branchList[0]._id }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.role, branchFilter, page, limit]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId) {
      setError('Please create a branch first.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await apiClient.createEmployee(formData);
      if (created) {
        setEmployees((prev) => [...prev, created]);
        setFormData({ fullName: '', email: '', phoneNumber: '', password: '', branchId: formData.branchId });
        setShowForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await apiClient.deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

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
            <CardTitle className="text-sm font-medium text-foreground">Total Employees</CardTitle>
            <Users className="size-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{total}</div>
            <p className="text-xs text-muted-foreground">Registered staff</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Add New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name *</label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@blackbird.com"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone *</label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="1234567890"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Branch *</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    disabled={isSubmitting || branches.length === 0}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {branches.length === 0 && (
                    <p className="text-xs text-muted-foreground">Create a branch first in Branches.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
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
                  disabled={isSubmitting || !formData.fullName || !formData.email || !formData.phoneNumber || !formData.password || !formData.branchId}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? 'Creating...' : 'Create Employee'}
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
              <CardTitle className="text-foreground">All Employees</CardTitle>
              <Button
                onClick={() => { setShowForm(!showForm); setError(null); }}
                disabled={isLoading}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {showForm ? 'Cancel' : '+ Add Employee'}
              </Button>
            </div>
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
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No employees yet</div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Phone</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Employee ID</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Created</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-2 md:px-4 text-foreground font-medium">{emp.fullName}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{emp.email}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground">{emp.phoneNumber}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground text-xs">{emp.employeeNumber}</td>
                      <td className="py-3 px-2 md:px-4 text-foreground text-xs">{new Date(emp.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-2 md:px-4">
                        <Button
                          onClick={() => handleDeleteEmployee(emp._id)}
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </Button>
                      </td>
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
