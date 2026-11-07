const API_BASE = '/api/v1';

export interface CustomerProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  role: string;
  isGlobalAccount: boolean;
  preferredLang: 'EN' | 'AM';
  smsNotifications: boolean;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalBookings: number;
    completedVisits: number;
    activeBookings: number;
    branchVisits: Array<{ branchId: string; branchName: string; count: number }>;
  };
  recentBookings?: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: string | number;
    depositPaid: string | number;
    createdAt: string;
    branch?: { id: string; name: string; slug: string; city: string };
  }>;
}

export interface ClienteleListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string | null;
  phone: string;
  preferredLang: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
  createdAt: string;
  totalVisits: number;
  completedVisits: number;
  activeBookings: number;
  branchVisits: Array<{ branchId: string; branchName: string; count: number }>;
}

export interface ClienteleListResponse {
  customers: ClienteleListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerHistoryItem {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number | string;
  depositPaid: number | string;
  balanceDue: number | string;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    slug: string;
    city?: string;
    addressLine?: string;
    phoneNumber?: string;
  };
  items: Array<{
    id: string;
    serviceTitleSnapshot?: string;
    priceSnapshot?: number | string;
    durationSnapshot?: number;
    startTime: string;
    endTime: string;
    employee?: {
      id: string;
      firstName: string;
      lastName: string;
      ritualTitle?: string;
      workstation?: string;
    } | null;
    service?: {
      id: string;
      code: string;
      name: string;
      amharicName?: string;
      category?: string;
    } | null;
    review?: {
      id: string;
      rating: number;
      comment?: string | null;
      createdAt: string;
    } | null;
  }>;
  payments: Array<{
    id: string;
    amount: number | string;
    status: string;
    method: string;
    transactionRef?: string | null;
    createdAt: string;
  }>;
}

export interface CustomerDossierResponse {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email?: string | null;
    phone: string;
    preferredLang: string;
    createdAt: string;
  };
  appointments: CustomerHistoryItem[];
}

export interface UpdateCustomerProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  preferredLang?: 'EN' | 'AM';
  smsNotifications?: boolean;
  emailNotifications?: boolean;
}

export const customerApi = {
  async listClientele(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ClienteleListResponse> {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('eyob_auth_token');
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/customers?${query.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to list clientele');
    }
    return data.data;
  },

  async getCustomerDossier(customerId: string): Promise<CustomerDossierResponse> {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('eyob_auth_token');
    const res = await fetch(`${API_BASE}/customers/${customerId}/history`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to retrieve customer history');
    }
    return data.data;
  },

  async getProfile(): Promise<CustomerProfileData> {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('eyob_auth_token');
    const res = await fetch(`${API_BASE}/customers/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to retrieve profile');
    }
    return data.data;
  },

  async updateProfile(payload: UpdateCustomerProfilePayload): Promise<CustomerProfileData> {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('eyob_auth_token');
    const res = await fetch(`${API_BASE}/customers/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    return data.data;
  },
};

