const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * API client aligned with Postman collection: backend/postman/blackbird-tattoo.postman_collection.json
 * All endpoints (Auth, Dashboard, Bookings, Branches, Employees, Users, Health) are implemented per that spec.
 */

export interface ApiResponse<T = unknown> {
  message: string;
  data: T | null;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
    role: string;
  };
}

export interface Employee {
  _id: string;
  uniqueId?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  employeeNumber: string;
  branchId?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  branchNumber: string;
  employeeCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCustomer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  phone: string;
  fullName: string;
  amount: number;
  size: number;
  artistName: string;
  paymentMethod: string;
  branchId: string | { name: string; branchNumber: string };
  userId?: string | UserCustomer;
  employeeId?: string;
  date?: string;
  reminderSentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Settings (admin only) – single doc in DB */
export interface Settings {
  _id: string;
  whatsappEnabled: boolean;
  reminderEnabled: boolean;
  reminderTimeDays: number;
  selfInvoiceMessageEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Paginated list response shape (bookings, employees, users, templates, sends) */
export interface PaginatedResponse<T> {
  count: number;
  total: number;
  page: number;
  limit: number;
  bookings?: T[];
  employees?: T[];
  users?: T[];
  templates?: T[];
  sends?: T[];
}

/** Marketing Template Parameter */
export interface MarketingTemplateParameter {
  key: string;
  position: number;
  type?: 'string' | 'number' | 'date';
  required?: boolean;
  description?: string;
}

/** Marketing Dynamic Field Enums */
export const MARKETING_DYNAMIC_FIELDS = {
  USER_FULLNAME: 'user_fullName',
  USER_PHONE: 'user_phone',
  USER_EMAIL: 'user_email',
  BRANCH_NAME: 'branch_name',
  BRANCH_NUMBER: 'branch_number',
} as const;

/** Mapping dynamic field enum to actual database field paths */
export const MARKETING_FIELD_MAPPING: Record<string, { type: 'user' | 'branch'; field: string }> = {
  'user_fullName': { type: 'user', field: 'fullName' },
  'user_phone': { type: 'user', field: 'phone' },
  'user_email': { type: 'user', field: 'email' },
  'branch_name': { type: 'branch', field: 'name' },
  'branch_number': { type: 'branch', field: 'branchNumber' },
};

/** Marketing Template */
export interface MarketingTemplate {
  _id: string;
  name: string;
  displayName: string;
  channel: string;
  whatsappTemplateName: string;
  languageCode?: string;
  bodyExample?: string;
  parameters?: MarketingTemplateParameter[];
  isActive?: boolean;
  createdBy?: { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

/** Marketing Send Job */
export interface MarketingSend {
  _id: string;
  templateId: string | MarketingTemplate;
  triggeredBy: string | { _id: string; name: string; email: string };
  audienceType: 'single' | 'list' | 'branch_customers' | 'all_customers';
  audienceFilter: Record<string, unknown>;
  parameters: Record<string, unknown>;
  perUserParameters?: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  stats: { total: number; success: number; failed: number };
  completedAt?: string;
  createdAt?: string;
}

/** Dashboard API response (admin) */
export interface DashboardData {
  dateRange: { startDate: string; endDate: string };
  summary: {
    totalBookings: number;
    totalRevenue: number;
    uniqueCustomersInRange: number;
    averageOrderValue: number;
  };
  byBranch: Array<{
    branchId: string;
    branchName: string;
    branchNumber: string;
    employeeCount: number;
    bookingCount: number;
    revenue: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;
  totals?: {
    totalBranches: number;
    totalEmployees: number;
    totalCustomers: number;
  };
}

/** Dashboard API response (employee – branch scoped) */
export interface BranchDashboardData {
  dateRange: { startDate: string; endDate: string };
  branchInfo: {
    branchId: string;
    branchName: string;
    branchNumber: string;
    employeeCount: number;
  };
  summary: {
    totalBookings: number;
    totalRevenue: number;
    uniqueCustomersInRange: number;
    averageOrderValue: number;
  };
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    totalAmount: number;
  }>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });

    const newToken = res.headers.get('X-New-Token');
    if (newToken) {
      this.setToken(newToken);
    }

    const data = (await res.json()) as ApiResponse<T>;

    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    return data;
  }

  async login(email: string, password: string) {
    const { data } = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getCurrentUser() {
    const { data } = await this.request<Record<string, unknown>>('/api/auth/me', {
      method: 'GET',
    });
    return data;
  }

  async healthCheck() {
    const { data } = await this.request<{
      database: { status: string; name: string; host: string };
      server: { uptime: number; environment: string; timestamp: string };
    }>('/health', { method: 'GET' });
    return data;
  }

  async getBranches(): Promise<Branch[]> {
    const { data } = await this.request<{ count: number; branches: Branch[] }>(
      '/api/branches',
      { method: 'GET' }
    );
    return data?.branches ?? [];
  }

  async createBranch(payload: { name: string; address: string }) {
    const { data } = await this.request<Branch>('/api/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  }

  async updateBranch(id: string, payload: { name?: string; address?: string }) {
    const { data } = await this.request<Branch>(`/api/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  }

  async getEmployees(params?: { branchId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Employee>> {
    const search = new URLSearchParams();
    if (params?.branchId) search.set('branchId', params.branchId);
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    const q = search.toString();
    const { data } = await this.request<{ count: number; total: number; page: number; limit: number; employees: Employee[] }>(
      `/api/employees${q ? `?${q}` : ''}`,
      { method: 'GET' }
    );
    if (!data) return { count: 0, total: 0, page: 1, limit: 10, employees: [] };
    return {
      count: data.count ?? data.employees?.length ?? 0,
      total: data.total ?? data.employees?.length ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      employees: data.employees ?? [],
    };
  }

  async getEmployee(id: string) {
    const { data } = await this.request<Employee>(`/api/employees/${id}`, {
      method: 'GET',
    });
    return data;
  }

  async createEmployee(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    branchId: string;
  }) {
    const { data } = await this.request<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  }

  async updateEmployee(
    id: string,
    payload: { fullName?: string; phoneNumber?: string; branchId?: string }
  ) {
    const { data } = await this.request<Employee>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  }

  async deleteEmployee(id: string) {
    await this.request(`/api/employees/${id}`, { method: 'DELETE' });
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    const { data } = await this.request<{ count: number; employees: Employee[] }>(
      `/api/employees/search?q=${encodeURIComponent(query)}`,
      { method: 'GET' }
    );
    return data?.employees ?? [];
  }

  async getBookings(params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Booking>> {
    const search = new URLSearchParams();
    if (params?.branchId) search.set('branchId', params.branchId);
    if (params?.startDate) search.set('startDate', params.startDate);
    if (params?.endDate) search.set('endDate', params.endDate);
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    const q = search.toString();
    const { data } = await this.request<{ count: number; total: number; page: number; limit: number; bookings: Booking[] }>(
      `/api/bookings${q ? `?${q}` : ''}`,
      { method: 'GET' }
    );
    if (!data) return { count: 0, total: 0, page: 1, limit: 10, bookings: [] };
    return {
      count: data.count ?? data.bookings?.length ?? 0,
      total: data.total ?? data.bookings?.length ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      bookings: data.bookings ?? [],
    };
  }

  async createBooking(payload: {
    phone: string;
    fullName: string;
    amount: number;
    size: number;
    artistName: string;
    paymentMethod: 'CASH' | 'UPI';
    branchId: string;
    email?: string;
  }) {
    const { data } = await this.request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  }

  async getUsers(params?: { branchId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<UserCustomer>> {
    const search = new URLSearchParams();
    if (params?.branchId) search.set('branchId', params.branchId);
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    const q = search.toString();
    const { data } = await this.request<{ count: number; total: number; page: number; limit: number; users: UserCustomer[] }>(
      `/api/users${q ? `?${q}` : ''}`,
      { method: 'GET' }
    );
    if (!data) return { count: 0, total: 0, page: 1, limit: 10, users: [] };
    return {
      count: data.count ?? data.users?.length ?? 0,
      total: data.total ?? data.users?.length ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      users: data.users ?? [],
    };
  }

  /** Settings (admin only) */
  async getSettings(): Promise<Settings | null> {
    const { data } = await this.request<Settings>('/api/settings', { method: 'GET' });
    return data ?? null;
  }

  async updateSettings(payload: Partial<Pick<Settings, 'whatsappEnabled' | 'reminderEnabled' | 'reminderTimeDays' | 'selfInvoiceMessageEnabled'>>): Promise<Settings | null> {
    const { data } = await this.request<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data ?? null;
  }

  /**
   * Dashboard data for date range.
   * GET /api/dashboard?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Admin: full dashboard (summary, byBranch, byPaymentMethod, totals).
   * Employee: branch dashboard (branchInfo, summary, byPaymentMethod).
   * Response: { message, data } per Postman.
   */
  async getDashboard(startDate: string, endDate: string): Promise<DashboardData | BranchDashboardData> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await this.request<DashboardData | BranchDashboardData>(
      `/api/dashboard?${params.toString()}`,
      { method: 'GET' }
    );
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error(response.message || 'No dashboard data');
    }
    const raw = data as unknown as Record<string, unknown>;
    const normalized = { ...raw } as unknown as DashboardData | BranchDashboardData;
    if (Array.isArray(raw.byPaymentMethod)) {
      normalized.byPaymentMethod = raw.byPaymentMethod as DashboardData['byPaymentMethod'];
    } else {
      (normalized as DashboardData).byPaymentMethod = [];
    }
    if ('byBranch' in raw && Array.isArray(raw.byBranch)) {
      (normalized as DashboardData).byBranch = (raw.byBranch as Array<Record<string, unknown>>).map((b) => ({
        branchId: typeof b.branchId === 'object' && b.branchId && '_id' in (b.branchId as object)
          ? String((b.branchId as { _id: string })._id)
          : String(b.branchId ?? ''),
        branchName: String(b.branchName ?? 'N/A'),
        branchNumber: String(b.branchNumber ?? ''),
        employeeCount: Number(b.employeeCount ?? 0),
        bookingCount: Number(b.bookingCount ?? 0),
        revenue: Number(b.revenue ?? 0),
      }));
    } else if ('byBranch' in normalized) {
      (normalized as DashboardData).byBranch = [];
    }
    if (raw.summary && typeof raw.summary === 'object') {
      const s = raw.summary as Record<string, unknown>;
      normalized.summary = {
        totalBookings: Number(s.totalBookings ?? 0),
        totalRevenue: Number(s.totalRevenue ?? 0),
        uniqueCustomersInRange: Number(s.uniqueCustomersInRange ?? s.uniqueCustomersCount ?? 0),
        averageOrderValue: Number(s.averageOrderValue ?? 0),
      };
    }
    return normalized;
  }

  /** Marketing Templates (admin only) */
  async getMarketingTemplates(params?: {
    channel?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<MarketingTemplate>> {
    const search = new URLSearchParams();
    if (params?.channel) search.set('channel', params.channel);
    if (params?.isActive !== undefined) search.set('isActive', String(params.isActive));
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    const q = search.toString();
    const { data } = await this.request<{ count: number; total: number; page: number; limit: number; templates: MarketingTemplate[] }>(
      `/api/marketing/templates${q ? `?${q}` : ''}`,
      { method: 'GET' }
    );
    if (!data) return { count: 0, total: 0, page: 1, limit: 10, templates: [] };
    return {
      count: data.count ?? data.templates?.length ?? 0,
      total: data.total ?? data.templates?.length ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      templates: data.templates ?? [],
    };
  }

  async getMarketingTemplate(id: string): Promise<MarketingTemplate | null> {
    const { data } = await this.request<MarketingTemplate>(`/api/marketing/templates/${id}`, { method: 'GET' });
    return data ?? null;
  }

  async createMarketingTemplate(payload: {
    name: string;
    displayName: string;
    channel: string;
    whatsappTemplateName: string;
    languageCode?: string;
    bodyExample?: string;
    parameters?: MarketingTemplateParameter[];
  }): Promise<MarketingTemplate | null> {
    const { data } = await this.request<MarketingTemplate>('/api/marketing/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data ?? null;
  }

  async updateMarketingTemplate(id: string, payload: Partial<MarketingTemplate>): Promise<MarketingTemplate | null> {
    const { data } = await this.request<MarketingTemplate>(`/api/marketing/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data ?? null;
  }

  async deleteMarketingTemplate(id: string): Promise<{ deletedTemplate: { id: string; name: string; displayName: string } } | null> {
    const { data } = await this.request<{ deletedTemplate: { id: string; name: string; displayName: string } }>(
      `/api/marketing/templates/${id}`,
      { method: 'DELETE' }
    );
    return data ?? null;
  }

  async previewMarketingTemplate(id: string, parameters: Record<string, unknown>): Promise<{
    renderedText: string;
    whatsappTemplateName: string;
    languageCode: string;
    mappedParameters: string[];
  } | null> {
    const { data } = await this.request<{
      renderedText: string;
      whatsappTemplateName: string;
      languageCode: string;
      mappedParameters: string[];
    }>(`/api/marketing/templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
    return data ?? null;
  }

  async getDynamicFields(): Promise<Array<{ value: string; label: string }> | null> {
    const { data } = await this.request<{ fields: Array<{ value: string; label: string }> }>('/api/marketing/dynamic-fields', {
      method: 'GET',
    });
    return data?.fields ?? null;
  }

  async sendMarketingMessage(
    id: string,
    payload: {
      audience: {
        type: 'single' | 'list' | 'branch_customers' | 'all_customers';
        phone?: string;
        phones?: string[];
        branchId?: string;
        dateFilter?: { startDate: string; endDate: string };
      };
      parameters: Record<string, unknown>;
    }
  ): Promise<MarketingSend | null> {
    const { data } = await this.request<MarketingSend>(`/api/marketing/templates/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data ?? null;
  }

  async getMarketingSends(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<MarketingSend>> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    const q = search.toString();
    const { data } = await this.request<{ count: number; total: number; page: number; limit: number; sends: MarketingSend[] }>(
      `/api/marketing/sends${q ? `?${q}` : ''}`,
      { method: 'GET' }
    );
    if (!data) return { count: 0, total: 0, page: 1, limit: 10, sends: [] };
    return {
      count: data.count ?? data.sends?.length ?? 0,
      total: data.total ?? data.sends?.length ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      sends: data.sends ?? [],
    };
  }

  async getMarketingSend(id: string): Promise<MarketingSend | null> {
    const { data } = await this.request<MarketingSend>(`/api/marketing/sends/${id}`, { method: 'GET' });
    return data ?? null;
  }
}

export const apiClient = new ApiClient();
