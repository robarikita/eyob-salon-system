// Eyob Women Beauty Salon - Phase 6 Booking & Scheduling API Client

const API_BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface BookingItemDTO {
  id: string;
  serviceId?: string;
  serviceTitleSnapshot: string;
  priceSnapshot: number;
  durationSnapshot: number;
  depositSnapshot: number;
  startTime: string;
  endTime: string;
  employeeId?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    ritualTitle?: string;
    workstation?: string;
  };
  service?: {
    id: string;
    code: string;
    name: string;
    amharicName?: string;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
}

export interface BookingDTO {
  id: string;
  bookingNumber: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'NO_SHOW' | 'EXPIRED';
  totalAmount: number;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  items: BookingItemDTO[];
  branch: {
    id: string;
    name: string;
    slug: string;
    addressLine?: string;
    phoneNumber?: string;
    city?: string;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
}

export interface AvailabilityResponse {
  date: string;
  branchId: string;
  serviceDuration: number;
  turnaroundBuffer: number;
  availableSlots: string[];
  slots?: Array<{
    time: string;
    startTime: string;
    endTime: string;
    availableEmployeeIds: string[];
  }>;
}

export interface ChainStepDTO {
  serviceId: string;
  serviceName: string;
  serviceNameAm?: string | null;
  startTime: string;
  endTime: string;
  startTimeISO: string;
  endTimeISO: string;
  durationMinutes: number;
  employeeId: string;
  employeeName: string;
}

export interface MultiServiceChainOptionDTO {
  chainStartTime: string;
  chainEndTime: string;
  chainStartTimeISO: string;
  chainEndTimeISO: string;
  totalDurationMinutes: number;
  steps: ChainStepDTO[];
}

export interface MultiServiceAvailabilityResponse {
  date: string;
  branchId: string;
  totalDurationMinutes: number;
  chainOptions: MultiServiceChainOptionDTO[];
}

export interface CreateBookingPayload {
  branchId: string;
  serviceId?: string;
  employeeId?: string;
  startTime?: string;
  items?: Array<{
    serviceId: string;
    employeeId: string;
    startTime: string;
    sequenceOrder?: number;
  }>;
  notes?: string;
}

export const bookingApi = {
  /**
   * Get conflict-free available time slots
   */
  async getAvailableSlots(params: {
    branchId: string;
    serviceId: string;
    employeeId?: string;
    date: string;
  }): Promise<AvailabilityResponse> {
    try {
      const search = new URLSearchParams();
      search.append('branchId', params.branchId);
      search.append('serviceId', params.serviceId);
      if (params.employeeId) search.append('employeeId', params.employeeId);
      search.append('date', params.date);

      const res = await fetch(`${API_BASE}/bookings/availability?${search.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.message || `Availability query failed (HTTP ${res.status})`);
      }
      const json = await res.json();
      return json.data;
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      throw err;
    }
  },

  /**
   * Get multi-service sequential chain availability
   */
  async getMultiServiceAvailability(params: {
    branchId: string;
    date: string;
    services: Array<{ serviceId: string; preferredEmployeeId?: string | null }>;
    requireSameSpecialist?: boolean;
    bufferMinutes?: number;
    timeZone?: string;
  }): Promise<MultiServiceAvailabilityResponse> {
    const res = await fetch(`${API_BASE}/bookings/availability/multi-service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      throw new Error(errorJson?.message || `Multi-service query failed (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Submit appointment booking
   */
  async createBooking(data: CreateBookingPayload): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      throw new Error(errorJson?.message || `Failed to create appointment (HTTP ${res.status})`);
    }

    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Get current patron's bookings
   */
  async getMyBookings(status?: string): Promise<BookingDTO[]> {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE}/bookings/my-bookings${query}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data.bookings;
    } catch {
      return [];
    }
  },

  /**
   * Get single booking by ID or reference number
   */
  async getBookingByIdOrRef(idOrRef: string): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/bookings/${idOrRef}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      throw new Error(errorJson?.message || `Booking not found (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Cancel an appointment
   */
  async cancelBooking(id: string, reason?: string): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      throw new Error(errorJson?.message || `Cancel failed (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Reschedule an appointment
   */
  async rescheduleBooking(
    id: string,
    data: { newStartTime: string; employeeId?: string }
  ): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/bookings/${id}/reschedule`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      throw new Error(errorJson?.message || `Reschedule failed (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Submit client review
   */
  async createReview(
    bookingItemId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/bookings/items/${bookingItemId}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Review submission failed (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data.review;
  },

  /**
   * Staff: get daily appointments
   */
  async getStaffAppointments(params?: { date?: string; status?: string }): Promise<BookingDTO[]> {
    try {
      const search = new URLSearchParams();
      if (params?.date) search.append('date', params.date);
      if (params?.status) search.append('status', params.status);

      const res = await fetch(`${API_BASE}/staff/appointments?${search.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data.appointments;
    } catch {
      return [];
    }
  },

  /**
   * Staff: accept appointment
   */
  async acceptStaffAppointment(id: string): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/staff/appointments/${id}/accept`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to accept appointment');
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Staff: reject appointment
   */
  async rejectStaffAppointment(id: string, reason?: string): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/staff/appointments/${id}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject appointment');
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Staff: update session status
   */
  async updateStaffAppointmentStatus(
    id: string,
    data: { status: string; reason?: string }
  ): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/staff/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update status');
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Staff: get availability
   */
  async getStaffAvailability(employeeId?: string): Promise<any> {
    try {
      const query = employeeId ? `?employeeId=${employeeId}` : '';
      const res = await fetch(`${API_BASE}/staff/availability${query}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data.availability;
    } catch {
      return null;
    }
  },

  /**
   * Staff: log emergency exception
   */
  async toggleStaffException(data: {
    date: string;
    isWorking: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/staff/availability/exception`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update availability exception');
    const json = await res.json();
    return json.data.exception;
  },

  /**
   * Admin: master appointments list
   */
  async getAdminAppointments(params?: {
    branchId?: string;
    date?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    appointments: BookingDTO[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    counts: { total: number; confirmed: number; inProgress: number; completed: number; cancelled: number; rejected: number };
  }> {
    try {
      const search = new URLSearchParams();
      if (params?.branchId && params.branchId !== 'all') search.append('branchId', params.branchId);
      if (params?.date) search.append('date', params.date);
      if (params?.status && params.status !== 'ALL') search.append('status', params.status);
      if (params?.search) search.append('search', params.search);
      if (params?.page) search.append('page', String(params.page));
      if (params?.limit) search.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE}/admin/appointments?${search.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch {
      return {
        appointments: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        counts: { total: 0, confirmed: 0, inProgress: 0, completed: 0, cancelled: 0, rejected: 0 },
      };
    }
  },

  /**
   * Admin: update appointment status
   */
  async updateAdminAppointmentStatus(
    id: string,
    data: { status: string; reason?: string }
  ): Promise<BookingDTO> {
    const res = await fetch(`${API_BASE}/admin/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update status');
    const json = await res.json();
    return json.data.booking;
  },

  /**
   * Admin: income reporting
   */
  async getIncomeReport(params?: {
    period?: 'DAILY' | 'MONTHLY';
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const search = new URLSearchParams();
      if (params?.period) search.append('period', params.period);
      if (params?.branchId && params.branchId !== 'all') search.append('branchId', params.branchId);
      if (params?.startDate) search.append('startDate', params.startDate);
      if (params?.endDate) search.append('endDate', params.endDate);

      const res = await fetch(`${API_BASE}/admin/appointments/reports/income?${search.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data.report;
    } catch {
      return { totalIncome: 0, totalDeposits: 0, count: 0, bookings: [] };
    }
  },
};

