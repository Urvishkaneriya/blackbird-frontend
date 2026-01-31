'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { apiClient } from '@/app/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Database, Server, Users } from 'lucide-react';

interface HealthData {
  database: { status: string; name: string; host: string };
  server: { uptime: number; environment: string; timestamp: string };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [employees, setEmployees] = useState<{ _id: string; fullName: string; email: string; employeeNumber: string; createdAt: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [healthData, empList] = await Promise.all([
          apiClient.healthCheck(),
          user?.role === 'admin' ? apiClient.getEmployees() : Promise.resolve([]),
        ]);
        setHealth(healthData ?? null);
        setEmployees(empList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.role]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">Welcome, {user?.name}!</h2>
        <p className="text-muted-foreground">
          {user?.role === 'admin' ? 'System overview & management' : 'Your dashboard'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Employees</CardTitle>
              <Users className="size-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{employees.length}</div>
              <p className="text-xs text-muted-foreground">Registered staff</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">System Status</CardTitle>
              <Server className="size-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-primary">
                {isLoading ? 'Loading...' : health ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">Backend & database</p>
            </CardContent>
          </Card>
        </div>
      )}

      {health && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="mt-1">
                  {health.database.status === 'connected' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4" />
                    <p className="font-semibold text-foreground">Database</p>
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                      {health.database.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {health.database.name} @ {health.database.host}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="mt-1">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-4 h-4" />
                    <p className="font-semibold text-foreground">Server</p>
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                      {health.server.environment}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uptime: {health.server.uptime.toFixed(2)}s · {new Date(health.server.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'admin' && employees.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.slice(0, 5).map((emp) => (
                <div
                  key={emp._id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{emp.fullName}</p>
                    <p className="text-xs text-muted-foreground">{emp.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                    {emp.employeeNumber}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
