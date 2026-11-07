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

