const API_BASE = '/api/v1';

export interface AuthUserData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'BRANCH_ADMIN' | 'OWNER';
  branchId?: string | null;
  workstation?: string | null;
  permissions?: string[];
}

export interface LoginPayload {
  identifier?: string;
  phone?: string;
  password: string;
  role?: 'CUSTOMER' | 'EMPLOYEE' | 'BRANCH_ADMIN' | 'OWNER';
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  email?: string;
  branch?: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: AuthUserData;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse['data']> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to authenticate');
    }
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse['data']> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to register account');
    }
    return data.data;
  },

  async getMe(token?: string): Promise<AuthUserData> {
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('eyob_auth_token');
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to retrieve profile');
    }
    return data.data.user;
  },

  async forgotPassword(identifier: string): Promise<{ message: string; resetToken?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to request password reset');
    }
    return data.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    return data.data;
  },
};

