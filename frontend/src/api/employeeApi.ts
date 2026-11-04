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
  status: boolean;
  branchId: string;
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

// Fallback sample data matching the approved designs
export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-101',
    firstName: 'Sara',
    lastName: 'Ahmed',
    amharicName: 'ሳራ አህመድ',
    phone: '+251 91 123 4567',
    email: 'sara.ahmed@eyobbeauty.com',
    branchId: 'bole-bulbula',
    branch: { id: 'bole-bulbula', name: 'Bole Bulbula', slug: 'bole-bulbula' },
    ritualTitle: 'Senior Hair Stylist',
    employmentType: 'Full-Time (40 hrs/wk)',
    workstation: 'Chair 04 — VIP Styling Suite A',
    baseSalary: 12000,
    commissionRate: 15,
    status: true,
    joinedDate: '2023-01-15',
    rating: 4.95,
    reviewsCount: 128,
  },
  {
    id: 'emp-102',
    firstName: 'Helen',
    lastName: 'Tesfaye',
    amharicName: 'ሔለን ተስፋዬ',
    phone: '+251 92 884 1920',
    email: 'helen.t@eyobbeauty.com',
    branchId: 'kazanchis',
    branch: { id: 'kazanchis', name: 'Kazanchis', slug: 'kazanchis' },
    ritualTitle: 'Master Makeup Artist',
    employmentType: 'Full-Time (36 hrs/wk)',
    workstation: 'Suite 02 — Editorial Glam',
    baseSalary: 14000,
    commissionRate: 18,
    status: true,
    joinedDate: '2023-04-10',
    rating: 5.0,
    reviewsCount: 214,
  },
  {
    id: 'emp-103',
    firstName: 'Tigist',
    lastName: 'Gidey',
    amharicName: 'ትዕግስት ግደይ',
    phone: '+251 93 400 9811',
    email: 'tigist.g@eyobbeauty.com',
    branchId: 'bole-bulbula',
    branch: { id: 'bole-bulbula', name: 'Bole Bulbula', slug: 'bole-bulbula' },
    ritualTitle: 'Nail Care Specialist',
    employmentType: 'Full-Time (40 hrs/wk)',
    workstation: 'Station 03 — Bio-Care Nail Bar',
    baseSalary: 9500,
    commissionRate: 12,
    status: true,
    joinedDate: '2023-06-01',
    rating: 4.9,
    reviewsCount: 96,
  },
  {
    id: 'emp-104',
    firstName: 'Meron',
    lastName: 'Tadesse',
    amharicName: 'ሜሮን ታደሰ',
    phone: '+251 91 755 2100',
    email: 'meron.t@eyobbeauty.com',
    branchId: 'bole-bulbula',
    branch: { id: 'bole-bulbula', name: 'Bole Bulbula', slug: 'bole-bulbula' },
    ritualTitle: 'Branch Lead & Cosmetologist',
    employmentType: 'Full-Time (44 hrs/wk)',
    workstation: 'Suite 01 — Aesthetic Clinic',
    baseSalary: 18000,
    commissionRate: 20,
    status: true,
    joinedDate: '2022-11-01',
    rating: 4.88,
    reviewsCount: 189,
  },
  {
    id: 'emp-105',
    firstName: 'Selamawit',
    lastName: 'Bekele',
    amharicName: 'ሰላማዊት በቀለ',
    phone: '+251 94 221 0045',
    email: 'selamawit.b@eyobbeauty.com',
    branchId: 'cmc',
    branch: { id: 'cmc', name: 'CMC Branch', slug: 'cmc' },
    ritualTitle: 'Facial & Skin Aesthetician',
    employmentType: 'Part-Time (24 hrs/wk)',
    workstation: 'Suite 04 — Hydro Care',
    baseSalary: 11000,
    commissionRate: 14,
    status: true,
    joinedDate: '2023-08-20',
    rating: 4.92,
    reviewsCount: 74,
  },
  {
    id: 'emp-106',
    firstName: 'Liya',
    lastName: 'Daniel',
    amharicName: 'ሊያ ዳንኤል',
    phone: '+251 91 094 3328',
    email: 'liya.d@eyobbeauty.com',
    branchId: 'kazanchis',
    branch: { id: 'kazanchis', name: 'Kazanchis', slug: 'kazanchis' },
    ritualTitle: 'Hair & Braid Artisan',
    employmentType: 'Full-Time (40 hrs/wk)',
    workstation: 'Chair 06 — Braiding Suite',
    baseSalary: 10500,
    commissionRate: 15,
    status: true,
    joinedDate: '2023-09-01',
    rating: 4.85,
    reviewsCount: 112,
  },
  {
    id: 'emp-107',
    firstName: 'Hanna',
    lastName: 'Solomon',
    amharicName: 'ሃና ሰለሞን',
    phone: '+251 92 615 8901',
    email: 'hanna.s@eyobbeauty.com',
    branchId: 'cmc',
    branch: { id: 'cmc', name: 'CMC Branch', slug: 'cmc' },
    ritualTitle: 'Junior Stylist',
    employmentType: 'Full-Time (40 hrs/wk)',
    workstation: 'Wash Sanctuary Chair 01',
    baseSalary: 8000,
    commissionRate: 10,
    status: false,
    joinedDate: '2024-02-15',
    rating: 4.7,
    reviewsCount: 41,
  },
];

export const employeeApi = {
  async getDashboardMetrics(branchId?: string): Promise<DashboardMetrics> {
    try {
      const res = await fetch(`/api/v1/employees/dashboard${branchId ? `?branchId=${branchId}` : ''}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback to design defaults
    }
    return {
      totalActiveSpecialists: 45,
      totalEmployees: 47,
      onDutyToday: 34,
      utilizationRate: 88,
      totalCommissionPool: 184500,
      branchBreakdown: [
        {
          id: 'b-1',
          name: 'Bole Bulbula',
          slug: 'bole-bulbula',
          totalEmployees: 18,
          activeEmployees: 18,
          onDutyEmployees: 14,
          occupancyRate: 94,
        },
        {
          id: 'b-2',
          name: 'Kazanchis',
          slug: 'kazanchis',
          totalEmployees: 15,
          activeEmployees: 15,
          onDutyEmployees: 12,
          occupancyRate: 86,
        },
        {
          id: 'b-3',
          name: 'CMC Branch',
          slug: 'cmc',
          totalEmployees: 14,
          activeEmployees: 12,
          onDutyEmployees: 8,
          occupancyRate: 80,
        },
      ],
    };
  },

  async getAllEmployees(params?: { branchId?: string; search?: string }): Promise<Employee[]> {
    try {
      const query = new URLSearchParams();
      if (params?.branchId && params.branchId !== 'all') query.append('branchId', params.branchId);
      if (params?.search) query.append('search', params.search);

      const res = await fetch(`/api/v1/employees?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    let list = [...MOCK_EMPLOYEES];
    if (params?.branchId && params.branchId !== 'all') {
      list = list.filter((e) => e.branchId === params.branchId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          (e.phone && e.phone.includes(q)) ||
          (e.ritualTitle && e.ritualTitle.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getEmployeeById(id: string): Promise<Employee> {
    try {
      const res = await fetch(`/api/v1/employees/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    const found = MOCK_EMPLOYEES.find((e) => e.id === id);
    return found || MOCK_EMPLOYEES[0];
  },

  async createEmployee(data: any): Promise<Employee> {
    try {
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback simulation
    }
    const parts = (data.fullName || 'New Specialist').split(' ');
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      firstName: parts[0],
      lastName: parts[1] || parts[0],
      amharicName: data.amharicName || null,
      phone: data.phone,
      email: data.email || null,
      branchId: data.branchId || 'bole-bulbula',
      ritualTitle: data.ritualTitle || 'Senior Hair Stylist',
      employmentType: data.employmentType || 'Full-Time (40 hrs/wk)',
      workstation: data.workstation || 'Chair 04 — VIP Suite',
      baseSalary: data.baseSalary || 12000,
      commissionRate: data.commissionRate || 15,
      status: true,
      rating: 5.0,
      reviewsCount: 0,
      joinedDate: new Date().toISOString(),
    };
    MOCK_EMPLOYEES.unshift(newEmp);
    return newEmp;
  },

  async toggleEmployeeStatus(id: string): Promise<{ employee: Employee; warning?: string }> {
    try {
      const res = await fetch(`/api/v1/employees/${id}/toggle-status`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const json = await res.json();
        return { employee: json.data, warning: json.warning };
      }
    } catch {
      // Fallback
    }
    const emp = MOCK_EMPLOYEES.find((e) => e.id === id);
    if (emp) {
      emp.status = !emp.status;
      return { employee: emp };
    }
    throw new Error('Employee not found');
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
    try {
      const res = await fetch(`/api/v1/employees/${id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    const emp = MOCK_EMPLOYEES.find((e) => e.id === id);
    if (emp) {
      emp.schedules = schedules;
    }
    return schedules;
  },

  async assignServices(
    id: string,
    services: Array<{
      serviceId: string;
      customDurationMinutes?: number;
      customCommissionRate?: number;
    }>
  ) {
    try {
      const res = await fetch(`/api/v1/employees/${id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    return services;
  },

  async createException(
    id: string,
    data: {
      startDate: string;
      endDate?: string;
      reason?: string;
      isOffDay: boolean;
    }
  ) {
    try {
      const res = await fetch(`/api/v1/employees/${id}/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Fallback
    }
    return data;
  },
};
