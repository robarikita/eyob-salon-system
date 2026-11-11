export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  amharicName?: string | null;
  phone?: string | null;
  email?: string | null;
  ritualTitle?: string | null;
  employmentType?: string | null;
  workstation?: string | null;
  joinedDate?: string | Date | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  baseSalary?: number | null;
  commissionRate?: number | null;
  status: string | boolean;
  isActive?: boolean;
  hireReason?: string | null;
  requestedBy?: string | null;
  specialties?: string[];
  branchId: string;
  userId?: string | null;
  user?: {
    id: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    slug: string;
  };
  services?: Array<{
    id: string;
    serviceId: string;
    customDurationMinutes?: number | null;
    customCommissionRate?: number | null;
    service?: {
      id: string;
      title: string;
      price: number;
      duration: number;
    };
  }>;
  schedules?: Array<{
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
    isWorking: boolean;
  }>;
  rating?: number;
  reviewsCount?: number;
}

export interface DashboardMetrics {
  totalActiveSpecialists: number;
  totalEmployees: number;
  onDutyToday: number;
  utilizationRate: number;
  totalCommissionPool: number;
  branchBreakdown: Array<{
    id: string;
    name: string;
    slug: string;
    totalEmployees: number;
    activeEmployees: number;
    onDutyEmployees: number;
    occupancyRate: number;
  }>;
}

// Database-only specialist roster
export const MOCK_EMPLOYEES: Employee[] = [];

const getAuthHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('eyob_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const employeeApi = {
  async getDashboardMetrics(branchId?: string): Promise<DashboardMetrics> {
    const res = await fetch(`/api/v1/employees/dashboard${branchId && branchId !== 'all' ? `?branchId=${branchId}` : ''}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch dashboard metrics');
    }
    const json = await res.json();
    return json.data;
  },

  async getAllEmployees(params?: { branchId?: string; status?: string | boolean; search?: string }): Promise<Employee[]> {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== 'all') query.append('branchId', params.branchId);
    if (params?.status !== undefined) query.append('status', String(params.status));
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`/api/v1/employees?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch employees from database');
    }
    const json = await res.json();
    return json.data || [];
  },

  async getEmployeeById(id: string): Promise<Employee> {
    const res = await fetch(`/api/v1/employees/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Specialist ${id} not found`);
    }
    const json = await res.json();
    return json.data;
  },

  async createEmployee(data: any): Promise<Employee> {
    const res = await fetch('/api/v1/employees', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to provision specialist');
    }
    const json = await res.json();
    return json.data;
  },

  async updateEmployee(id: string, data: any): Promise<Employee> {
    const res = await fetch(`/api/v1/employees/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update specialist');
    }
    const json = await res.json();
    return json.data;
  },

  async toggleEmployeeStatus(id: string): Promise<{ employee: Employee; warning?: string }> {
    const res = await fetch(`/api/v1/employees/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to toggle specialist status');
    }
    const json = await res.json();
    return { employee: json.data, warning: json.warning };
  },

  async getSchedule(id: string): Promise<{
    schedules: Array<{
      id?: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      breakStartTime?: string | null;
      breakEndTime?: string | null;
      isWorking: boolean;
    }>;
    exceptions: Array<{
      id: string;
      date: string;
      endDate?: string | null;
      reason?: string | null;
      isOff: boolean;
      isWorking: boolean;
      customStartTime?: string | null;
      customEndTime?: string | null;
    }>;
  }> {
    const res = await fetch(`/api/v1/employees/${id}/schedule`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch schedule');
    }
    const json = await res.json();
    return json.data;
  },

  async setEmployeeSchedule(
    id: string,
    schedules: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      breakStartTime?: string;
      breakEndTime?: string;
      isWorking: boolean;
    }>
  ) {
    const res = await fetch(`/api/v1/employees/${id}/schedule`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schedules }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to save working schedule');
    }
    const json = await res.json();
    return json.data;
  },

  async assignServices(
    id: string,
    services: Array<{
      serviceId: string;
      customDurationMinutes?: number;
      customCommissionRate?: number;
    }> | { serviceIds: string[] }
  ) {
    const body = Array.isArray(services) ? { services } : services;
    const res = await fetch(`/api/v1/employees/${id}/services`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign services');
    }
    const json = await res.json();
    return json.data;
  },

  async createException(
    id: string,
    data: {
      startDate?: string;
      date?: string;
      endDate?: string;
      reason?: string;
      isOff?: boolean;
      isOffDay?: boolean;
      startTime?: string;
      endTime?: string;
    }
  ) {
    const res = await fetch(`/api/v1/employees/${id}/exceptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create exception');
    }
    const json = await res.json();
    return json.data;
  },

  async deleteException(id: string, exceptionId: string): Promise<boolean> {
    const res = await fetch(`/api/v1/employees/${id}/exceptions/${exceptionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete exception');
    }
    return true;
  },
};

export const staffApi = {
  async getMe(): Promise<Employee> {
    const res = await fetch('/api/v1/staff/me', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load staff profile');
    }
    const json = await res.json();
    return json.data;
  },

  async getSchedule(): Promise<{
    schedules: Array<any>;
    exceptions: Array<any>;
  }> {
    const res = await fetch('/api/v1/staff/schedule', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load schedule');
    }
    const json = await res.json();
    return json.data;
  },

  async getAppointments(params?: { date?: string; status?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);

    const res = await fetch(`/api/v1/staff/appointments?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load appointments');
    }
    const json = await res.json();
    return json.data || json.appointments || [];
  },
};
