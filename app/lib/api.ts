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
  createdAt?: string;
  updatedAt?: string;
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

  async getEmployees(): Promise<Employee[]> {
    const { data } = await this.request<{ count: number; employees: Employee[] }>(
      '/api/employees',
      { method: 'GET' }
    );
    return data?.employees ?? [];
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

  async getBookings(): Promise<Booking[]> {
    const { data } = await this.request<{ count: number; bookings: Booking[] }>(
      '/api/bookings',
      { method: 'GET' }
    );
    return data?.bookings ?? [];
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

  async getUsers(): Promise<UserCustomer[]> {
    const { data } = await this.request<{ count: number; users: UserCustomer[] }>(
      '/api/users',
      { method: 'GET' }
    );
    return data?.users ?? [];
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
}

export const apiClient = new ApiClient();
