'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, type MarketingTemplate, type MarketingSend, type Branch, MARKETING_DYNAMIC_FIELDS } from '@/app/lib/api';
import { Megaphone, Plus, Eye, Send, Trash2, X, CheckCircle, XCircle, Clock } from 'lucide-react';

type Tab = 'templates' | 'sends';

export default function MarketingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [sends, setSends] = useState<MarketingSend[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [totalSends, setTotalSends] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    name: '',
    displayName: '',
    channel: 'whatsapp',
    whatsappTemplateName: '',
    languageCode: 'en',
    bodyExample: '',
    parameters: [] as Array<{ key: string; position: number; type: string; required: boolean; description: string }>,
  });

  const [dynamicFields, setDynamicFields] = useState<Array<{ value: string; label: string }>>([]);
  const [parameterInputModes, setParameterInputModes] = useState<Record<string, 'type' | 'enum'>>({});
  const [sendForm, setSendForm] = useState({
    audienceType: 'single' as 'single' | 'list' | 'branch_customers' | 'all_customers',
    phone: '',
    phones: '',
    branchId: '',
    startDate: '',
    endDate: '',
    parameters: {} as Record<string, string>,
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
        const [templatesRes, sendsRes, branchList, fields] = await Promise.all([
          apiClient.getMarketingTemplates({ page, limit }),
          apiClient.getMarketingSends({ page, limit }),
          apiClient.getBranches(),
          apiClient.getDynamicFields(),
        ]);
        setTemplates(templatesRes.templates ?? []);
        setTotalTemplates(templatesRes.total ?? 0);
        setSends(sendsRes.sends ?? []);
        setTotalSends(sendsRes.total ?? 0);
        setBranches(branchList);
        setDynamicFields(fields ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.role, page, limit]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await apiClient.createMarketingTemplate({
        name: templateForm.name,
        displayName: templateForm.displayName,
        channel: templateForm.channel,
        whatsappTemplateName: templateForm.whatsappTemplateName,
        languageCode: templateForm.languageCode,
        bodyExample: templateForm.bodyExample,
        parameters: templateForm.parameters,
      });
      if (created) {
        setTemplates((prev) => [created, ...prev]);
        setShowTemplateForm(false);
        setTemplateForm({
          name: '',
          displayName: '',
          channel: 'whatsapp',
          whatsappTemplateName: '',
          languageCode: 'en',
          bodyExample: '',
          parameters: [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = async (template: MarketingTemplate) => {
    if (!template.parameters || template.parameters.length === 0) {
      setError('Template has no parameters to preview');
      return;
    }
    setSelectedTemplate(template);
    setShowSendForm(true);
    const params: Record<string, string> = {};
    const modes: Record<string, 'type' | 'enum'> = {};
    template.parameters.forEach((p) => {
      // Set sample values for preview
      if (p.type === 'number') {
        params[p.key] = '20';
      } else {
        params[p.key] = p.description || `Sample ${p.key}`;
      }
      modes[p.key] = 'type';
    });
    setSendForm((f) => ({ ...f, parameters: params }));
    setParameterInputModes(modes);
    // Call preview API with sample values
    try {
      const preview = await apiClient.previewMarketingTemplate(template._id, params);
      if (preview) setPreviewText(preview.renderedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview');
      setPreviewText(null);
    }
  };

  const handlePreviewUpdate = async () => {
    if (!selectedTemplate) return;
    try {
      const params: Record<string, unknown> = {};
      Object.entries(sendForm.parameters).forEach(([k, v]) => {
        if (v) {
          params[k] = parameterInputModes[k] === 'enum' ? v : v;
        }
      });
      const preview = await apiClient.previewMarketingTemplate(selectedTemplate._id, params);
      if (preview) setPreviewText(preview.renderedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const audience: Record<string, unknown> = { type: sendForm.audienceType };
      if (sendForm.audienceType === 'single') {
        if (!sendForm.phone) throw new Error('Phone required');
        audience.phone = sendForm.phone;
      } else if (sendForm.audienceType === 'list') {
        const phones = sendForm.phones.split(',').map((p) => p.trim()).filter(Boolean);
        if (phones.length === 0) throw new Error('At least one phone required');
        audience.phones = phones;
      } else if (sendForm.audienceType === 'branch_customers') {
        if (!sendForm.branchId) throw new Error('Branch required');
        audience.branchId = sendForm.branchId;
        if (sendForm.startDate && sendForm.endDate) {
          audience.dateFilter = { startDate: sendForm.startDate, endDate: sendForm.endDate };
        }
      } else if (sendForm.audienceType === 'all_customers') {
        if (sendForm.startDate && sendForm.endDate) {
          audience.dateFilter = { startDate: sendForm.startDate, endDate: sendForm.endDate };
        }
      }
      const params: Record<string, unknown> = {};
      Object.entries(sendForm.parameters).forEach(([k, v]) => {
        if (v) {
          params[k] = parameterInputModes[k] === 'enum' ? v : (selectedTemplate.parameters?.find((p) => p.key === k)?.type === 'number' ? Number(v) : v);
        }
      });
      const sent = await apiClient.sendMarketingMessage(selectedTemplate._id, {
        audience: audience as any,
        parameters: params,
      });
      if (sent) {
        setSends((prev) => [sent, ...prev]);
        setShowSendForm(false);
        setSelectedTemplate(null);
        setPreviewText(null);
        setSendForm({
          audienceType: 'single',
          phone: '',
          phones: '',
          branchId: '',
          startDate: '',
          endDate: '',
          parameters: {},
        });
        setParameterInputModes({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await apiClient.deleteMarketingTemplate(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const addParameter = () => {
    const pos = templateForm.parameters.length + 1;
    setTemplateForm({
      ...templateForm,
      parameters: [...templateForm.parameters, { key: '', position: pos, type: 'string', required: false, description: '' }],
    });
  };

  const updateParameter = (index: number, field: string, value: unknown) => {
    const updated = [...templateForm.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateForm({ ...templateForm, parameters: updated });
  };

  const removeParameter = (index: number) => {
    const updated = templateForm.parameters.filter((_, i) => i !== index).map((p, i) => ({ ...p, position: i + 1 }));
    setTemplateForm({ ...templateForm, parameters: updated });
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('sends')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sends'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Send History
        </button>
      </div>

      {activeTab === 'templates' && (
        <>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Megaphone className="size-5" />
                  Marketing Templates
                </CardTitle>
                <Button
                  onClick={() => { setShowTemplateForm(!showTemplateForm); setError(null); }}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-4 mr-2" />
                  {showTemplateForm ? 'Cancel' : 'New Template'}
                </Button>
              </div>
            </CardHeader>
            {showTemplateForm && (
              <CardContent>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Name (unique key) *</label>
                      <Input
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value.toUpperCase() })}
                        placeholder="WELCOME_DISCOUNT"
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Display Name *</label>
                      <Input
                        value={templateForm.displayName}
                        onChange={(e) => setTemplateForm({ ...templateForm, displayName: e.target.value })}
                        placeholder="Welcome Discount Offer"
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">WhatsApp Template Name *</label>
                      <Input
                        value={templateForm.whatsappTemplateName}
                        onChange={(e) => setTemplateForm({ ...templateForm, whatsappTemplateName: e.target.value })}
                        placeholder="blackbird_welcome_discount"
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Language Code</label>
                      <Input
                        value={templateForm.languageCode}
                        onChange={(e) => setTemplateForm({ ...templateForm, languageCode: e.target.value })}
                        placeholder="en"
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Body Example</label>
                      <Input
                        value={templateForm.bodyExample}
                        onChange={(e) => setTemplateForm({ ...templateForm, bodyExample: e.target.value })}
                        placeholder="Hello {{1}}, enjoy a {{2}}% discount until {{3}}!"
                        disabled={isSubmitting}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Parameters</label>
                      <Button type="button" onClick={addParameter} variant="outline" size="sm" className="border-border text-foreground">
                        <Plus className="size-4 mr-1" />
                        Add Parameter
                      </Button>
                    </div>
                    {templateForm.parameters.map((param, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                        <Input
                          placeholder="key"
                          value={param.key}
                          onChange={(e) => updateParameter(idx, 'key', e.target.value)}
                          className="bg-background border-border text-foreground text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="position"
                          value={param.position}
                          disabled
                          className="bg-background border-border text-foreground text-sm"
                        />
                        <select
                          value={param.type}
                          onChange={(e) => updateParameter(idx, 'type', e.target.value)}
                          className="h-9 px-2 rounded-md border border-border bg-background text-foreground text-sm"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="date">date</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => updateParameter(idx, 'required', e.target.checked)}
                            className="rounded border-border"
                          />
                          Required
                        </label>
                        <div className="flex gap-1">
                          <Input
                            placeholder="description"
                            value={param.description}
                            onChange={(e) => updateParameter(idx, 'description', e.target.value)}
                            className="bg-background border-border text-foreground text-sm flex-1"
                          />
                          <Button
                            type="button"
                            onClick={() => removeParameter(idx)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="submit" disabled={isSubmitting || !templateForm.name || !templateForm.displayName || !templateForm.whatsappTemplateName} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSubmitting ? 'Creating...' : 'Create Template'}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No templates yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Display Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">WhatsApp Template</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Parameters</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((t) => (
                        <tr key={t._id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground font-medium">{t.name}</td>
                          <td className="py-3 px-4 text-foreground">{t.displayName}</td>
                          <td className="py-3 px-4 text-foreground text-xs">{t.whatsappTemplateName}</td>
                          <td className="py-3 px-4 text-foreground text-xs">{t.parameters?.length ?? 0}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded ${t.isActive ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {t.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handlePreview(t)}
                                variant="outline"
                                size="sm"
                                className="border-border text-foreground"
                              >
                                <Eye className="size-3 mr-1" />
                                Preview
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedTemplate(t);
                                  setShowSendForm(true);
                                  const params: Record<string, string> = {};
                                  const modes: Record<string, 'type' | 'enum'> = {};
                                  t.parameters?.forEach((p) => {
                                    params[p.key] = '';
                                    modes[p.key] = 'type';
                                  });
                                  setSendForm((f) => ({ ...f, parameters: params }));
                                  setParameterInputModes(modes);
                                  setPreviewText(null);
                                }}
                                variant="outline"
                                size="sm"
                                className="border-border text-foreground"
                              >
                                <Send className="size-3 mr-1" />
                                Send
                              </Button>
                              <Button
                                onClick={() => handleDeleteTemplate(t._id)}
                                variant="outline"
                                size="sm"
                                className="border-destructive text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!isLoading && totalTemplates > limit && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(totalTemplates / limit)} ({totalTemplates} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border-border text-foreground">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(totalTemplates / limit)} className="border-border text-foreground">
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'sends' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Send History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : sends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No send jobs yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Template</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Audience</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Stats</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sends.map((s) => {
                      const template = typeof s.templateId === 'object' ? s.templateId : null;
                      return (
                        <tr key={s._id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground">{template?.displayName || '-'}</td>
                          <td className="py-3 px-4 text-foreground text-xs capitalize">{s.audienceType.replace('_', ' ')}</td>
                          <td className="py-3 px-4">
                            {s.status === 'completed' && <CheckCircle className="size-4 text-green-500" />}
                            {s.status === 'failed' && <XCircle className="size-4 text-red-500" />}
                            {(s.status === 'pending' || s.status === 'running') && <Clock className="size-4 text-yellow-500" />}
                            <span className="ml-2 text-xs capitalize">{s.status}</span>
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {s.stats.success}/{s.stats.total} success
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {s.createdAt ? new Date(s.createdAt).toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!isLoading && totalSends > limit && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(totalSends / limit)} ({totalSends} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border-border text-foreground">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(totalSends / limit)} className="border-border text-foreground">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showSendForm && selectedTemplate && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Send: {selectedTemplate.displayName}</CardTitle>
            {previewText && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                <p className="text-sm text-foreground">{previewText}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Audience Type *</label>
                <select
                  value={sendForm.audienceType}
                  onChange={(e) => setSendForm({ ...sendForm, audienceType: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                >
                  <option value="single">Single Phone</option>
                  <option value="list">List of Phones</option>
                  <option value="branch_customers">Branch Customers</option>
                  <option value="all_customers">All Customers</option>
                </select>
              </div>

              {sendForm.audienceType === 'single' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone *</label>
                  <Input
                    value={sendForm.phone}
                    onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              )}

              {sendForm.audienceType === 'list' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phones (comma-separated) *</label>
                  <Input
                    value={sendForm.phones}
                    onChange={(e) => setSendForm({ ...sendForm, phones: e.target.value })}
                    placeholder="9876543210, 9123456789"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              )}

              {sendForm.audienceType === 'branch_customers' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Branch *</label>
                    <select
                      value={sendForm.branchId}
                      onChange={(e) => setSendForm({ ...sendForm, branchId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Start Date (optional)</label>
                      <Input
                        type="date"
                        value={sendForm.startDate}
                        onChange={(e) => setSendForm({ ...sendForm, startDate: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">End Date (optional)</label>
                      <Input
                        type="date"
                        value={sendForm.endDate}
                        onChange={(e) => setSendForm({ ...sendForm, endDate: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                </>
              )}

              {sendForm.audienceType === 'all_customers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Start Date (optional)</label>
                    <Input
                      type="date"
                      value={sendForm.startDate}
                      onChange={(e) => setSendForm({ ...sendForm, startDate: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">End Date (optional)</label>
                    <Input
                      type="date"
                      value={sendForm.endDate}
                      onChange={(e) => setSendForm({ ...sendForm, endDate: e.target.value })}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
              )}

              {selectedTemplate.parameters && selectedTemplate.parameters.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Parameters</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePreviewUpdate}
                      className="border-border text-foreground"
                    >
                      <Eye className="size-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type a value OR select from dropdown (enum values resolved from database automatically)
                  </p>
                  {selectedTemplate.parameters.map((param) => {
                    const mode = parameterInputModes[param.key] || 'type';
                    const isEnum = mode === 'enum';
                    return (
                      <div key={param.key} className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-foreground">
                            {param.key} ({param.type}) {param.required && '*'}
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setParameterInputModes({ ...parameterInputModes, [param.key]: 'type' });
                                setSendForm({ ...sendForm, parameters: { ...sendForm.parameters, [param.key]: '' } });
                              }}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                !isEnum
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              Type Value
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setParameterInputModes({ ...parameterInputModes, [param.key]: 'enum' });
                                setSendForm({ ...sendForm, parameters: { ...sendForm.parameters, [param.key]: '' } });
                              }}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                isEnum
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              Select Enum
                            </button>
                          </div>
                        </div>
                        {param.description && <p className="text-xs text-muted-foreground">{param.description}</p>}
                        {!isEnum ? (
                          <Input
                            type={param.type === 'number' ? 'number' : 'text'}
                            value={sendForm.parameters[param.key] || ''}
                            onChange={(e) =>
                              setSendForm({
                                ...sendForm,
                                parameters: { ...sendForm.parameters, [param.key]: e.target.value },
                              })
                            }
                            placeholder={param.description || `Enter ${param.key}`}
                            className="bg-background border-border text-foreground"
                          />
                        ) : (
                          <select
                            value={sendForm.parameters[param.key] || ''}
                            onChange={(e) =>
                              setSendForm({
                                ...sendForm,
                                parameters: { ...sendForm.parameters, [param.key]: e.target.value },
                              })
                            }
                            className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground"
                          >
                            <option value="">Select enum...</option>
                            {dynamicFields.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowSendForm(false); setSelectedTemplate(null); setPreviewText(null); }}
                  disabled={isSubmitting}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
