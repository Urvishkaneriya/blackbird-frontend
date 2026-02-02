'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiClient, type Settings } from '@/app/lib/api';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    whatsappEnabled: true,
    reminderEnabled: true,
    reminderTimeDays: 60,
    selfInvoiceMessageEnabled: true,
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
        const data = await apiClient.getSettings();
        setSettings(data ?? null);
        if (data) {
          setForm({
            whatsappEnabled: data.whatsappEnabled ?? true,
            reminderEnabled: data.reminderEnabled ?? true,
            reminderTimeDays: data.reminderTimeDays ?? 60,
            selfInvoiceMessageEnabled: data.selfInvoiceMessageEnabled ?? true,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await apiClient.updateSettings({
        whatsappEnabled: form.whatsappEnabled,
        reminderEnabled: form.reminderEnabled,
        reminderTimeDays: Math.max(1, Math.min(365, form.reminderTimeDays)),
        selfInvoiceMessageEnabled: form.selfInvoiceMessageEnabled,
      });
      if (updated) setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <SettingsIcon className="size-5" />
            Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            WhatsApp, reminders, and self-invoice behaviour. Admin only.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp" className="text-sm font-medium text-foreground cursor-pointer">
                    WhatsApp enabled
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send invoice and reminder via WhatsApp when enabled.
                  </p>
                </div>
                <Switch
                  id="whatsapp"
                  checked={form.whatsappEnabled}
                  onCheckedChange={(checked) => setForm({ ...form, whatsappEnabled: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="reminder" className="text-sm font-medium text-foreground cursor-pointer">
                    Reminder enabled
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow reminder cron to send checkup reminders.
                  </p>
                </div>
                <Switch
                  id="reminder"
                  checked={form.reminderEnabled}
                  onCheckedChange={(checked) => setForm({ ...form, reminderEnabled: checked })}
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <Label htmlFor="reminderDays" className="text-sm font-medium text-foreground">
                  Reminder days
                </Label>
                <input
                  id="reminderDays"
                  type="number"
                  min={1}
                  max={365}
                  value={form.reminderTimeDays}
                  onChange={(e) => setForm({ ...form, reminderTimeDays: Number(e.target.value) || 1 })}
                  className="w-full max-w-[120px] h-10 px-3 rounded-md border border-border bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Send reminder this many days after tattoo session (min 1).
                </p>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="selfInvoice" className="text-sm font-medium text-foreground cursor-pointer">
                    Self-invoice to your number
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Send a copy of the invoice to WHATSAPP_NUM when a booking is created.
                  </p>
                </div>
                <Switch
                  id="selfInvoice"
                  checked={form.selfInvoiceMessageEnabled}
                  onCheckedChange={(checked) => setForm({ ...form, selfInvoiceMessageEnabled: checked })}
                />
              </div>

              <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSaving ? 'Saving...' : 'Save settings'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
