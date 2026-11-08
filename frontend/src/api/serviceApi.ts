// Eyob Women Beauty Salon - Phase 5 Service Rituals & Multi-Branch Governance API Client

export interface BranchServiceRule {
  id?: string;
  branchId: string;
  serviceId: string;
  customPrice: number | null;
  customDurationMinutes: number | null;
  customTurnaround: number | null;
  requiredDeposit: number | null;
  workstationLock: string | null;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    slug: string;
    city?: string;
  };
}

export interface AssignedSpecialist {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    amharicName?: string | null;
    ritualTitle?: string | null;
    avatarUrl?: string | null;
    rating?: number;
    branchId: string;
    branch?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface ServicePriceHistoryItem {
  id: string;
  serviceId: string;
  branchId?: string | null;
  price: number;
  effectiveFrom: string;
  changedBy: string;
  reason?: string | null;
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface BranchPriceItem {
  id: string;
  branchId: string;
  serviceId: string;
  customPrice: number;
  customDurationMinutes?: number | null;
  isActive: boolean;
  depositType?: 'NONE' | 'FIXED' | 'PERCENTAGE' | null;
  depositValue?: number | null;
  branch?: {
    id: string;
    name: string;
  };
}

export interface ServiceRitual {
  id: string;
  code: string;
  name: string;
  nameAm?: string | null;
  amharicName?: string | null;
  slug?: string;
  category: string;
  categoryId?: string | null;
  serviceCategory?: ServiceCategoryItem | null;
  approvalStatus?: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  pendingChanges?: any;
  subCategory?: string | null;
  description?: string | null;
  descriptionAm?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  durationMinutes: number;
  depositType?: 'NONE' | 'FIXED' | 'PERCENTAGE';
  depositValue?: number | null;
  depositAmount?: number | null;
  effectiveDepositType?: 'NONE' | 'FIXED' | 'PERCENTAGE';
  effectiveDepositValue?: number;
  preSetupBuffer: number;
  turnaroundBuffer: number;
  workstationType?: string | null;
  minGuildRank?: string | null;
  requiresApprentice: boolean;
  requiredProtocols: string[];
  standardCommission?: number | null;
  status: boolean;
  isActive?: boolean;
  branchPrices?: BranchPriceItem[];
  priceHistory?: ServicePriceHistoryItem[];
  branchServices?: BranchServiceRule[];
  assignedEmployees?: AssignedSpecialist[];
  effectivePrice?: number;
  effectiveDuration?: number;
  effectiveTurnaround?: number;
  effectiveDeposit?: number;
  effectiveIsActive?: boolean;
}

export interface GovernanceRequestItem {
  id: string;
  type: 'CATEGORY_CREATION' | 'SERVICE_CREATION' | 'PRICE_UPDATE' | 'SERVICE_MUTATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  branchId: string;
  requestedBy: string;
  reviewedBy?: string | null;
  reason: string;
  payload: any;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
    slug: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  branchId?: string | null;
  title: string;
  message: string;
  type: 'GOVERNANCE_REQUEST' | 'APPROVAL_NOTICE' | 'OWNER_MUTATION';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ServiceCategoryItem {
  id: string;
  name: string;
  nameAm?: string | null;
  slug: string;
  description?: string | null;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  isActive?: boolean;
  branchId?: string | null;
  count: number;
  activeCount?: number;
}

export interface BranchGovernanceData {
  branch: {
    id: string;
    name: string;
    slug: string;
    address?: string;
  };
  metrics: {
    totalMasterRituals: number;
    activeBranchRituals: number;
    offeringPercentage: number;
    averageTicketPrice: number;
    dailyCapacitySlots: number;
    occupancyRate: number;
    totalQualifiedSpecialists: number;
  };
  rituals: Array<
    ServiceRitual & {
      branchServiceRule: BranchServiceRule | null;
      localPrice: number;
      localTurnaround: number;
      localDeposit: number;
      localWorkstation: string;
      isBranchActive: boolean;
      localSpecialistsCount: number;
    }
  >;
}

export interface CreateServicePayload {
  code?: string;
  name: string;
  nameAm?: string;
  amharicName?: string;
  category: string;
  categoryId?: string;
  reason?: string;
  subCategory?: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  durationMinutes: number;
  depositType?: 'NONE' | 'FIXED' | 'PERCENTAGE';
  depositValue?: number;
  isActive?: boolean;
  preSetupBuffer?: number;
  turnaroundBuffer?: number;
  workstationType?: string;
  minGuildRank?: string;
  requiresApprentice?: boolean;
  requiredProtocols?: string[];
  standardCommission?: number;
  branchIds?: string[];
}

export interface UpdateBranchRulePayload {
  customPrice?: number | null;
  customDurationMinutes?: number | null;
  customTurnaround?: number | null;
  requiredDeposit?: number | null;
  workstationLock?: string | null;
  isActive?: boolean;
}

// Approved Seeded Master Rituals matching Phase 5 database and Google Stitch designs
export const MOCK_SERVICES: ServiceRitual[] = [
  {
    id: 'srv-101',
    code: 'SR-101',
    name: 'Bridal Hair & Haute Couture Updo',
    amharicName: 'የሙሽራ የፀጉር አሰራር እና ዘውድ ዝግጅት',
    category: 'Bridal & Royal Special Occasions',
    subCategory: 'Crown Wefts, Bridal Veil & Traditional Braids',
    description:
      'Imperial bridal coiffure engineered with heirloom braiding architectures, precious metals anchoring, and long-wear structural tension control for Habesha bridal ceremonies.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhXpuwSeMXFO5Iir8pCbkmEsFJocEEJCq4rXtkg62rfLuTS1gtFCs-AJwJGpg_6PccZ1uOlcwHMmH-Sx7CAFnk_WTRWg4FY2sG9R_rbdTMlrhKJ4UNMAV4G_QdLUqSw-rtAWiIMblVS_VnvqBBLcNfZCW8SMAJlHa4yPh6TNte3Mzy7C77rWlFPjjVxcnaAjrXhvsFof6lJPq8-5OSFIqIQILnNb1hs1irh_psfGiq',
    basePrice: 1200,
    durationMinutes: 90,
    preSetupBuffer: 15,
    turnaroundBuffer: 15,
    workstationType: 'Private Bridal Suite & Styling Throne',
    minGuildRank: 'Master Specialist (Guild Tier II)',
    requiresApprentice: true,
    requiredProtocols: [
      'Micro-Steam Infusion',
      '24h Humidity Setting Spray',
      'Albo Filigree Anchoring',
      'Botanical Aura Misting',
    ],
    standardCommission: 18.0,
    status: true,
    branchServices: [
      {
        branchId: 'b-bole',
        serviceId: 'srv-101',
        customPrice: 1200,
        customDurationMinutes: 90,
        customTurnaround: 15,
        requiredDeposit: 400,
        workstationLock: 'Suite Gold-1',
        isActive: true,
        branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
      },
      {
        branchId: 'b-kazanchis',
        serviceId: 'srv-101',
        customPrice: 1400,
        customDurationMinutes: 90,
        customTurnaround: 20,
        requiredDeposit: 500,
        workstationLock: 'VIP Pavilion A',
        isActive: true,
        branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
      },
      {
        branchId: 'b-cmc',
        serviceId: 'srv-101',
        customPrice: 1150,
        customDurationMinutes: 90,
        customTurnaround: 15,
        requiredDeposit: 350,
        workstationLock: 'CMC Suite 3',
        isActive: true,
        branch: { id: 'b-cmc', name: 'CMC Luxury Pavilions', slug: 'cmc' },
      },
    ],
    assignedEmployees: [
      {
        id: 'as-1',
        employeeId: 'emp-101',
        employee: {
          id: 'emp-101',
          fullName: 'Sara Ahmed',
          amharicName: 'ሳራ አህመድ',
          ritualTitle: 'Senior Master Stylist',
          rating: 4.95,
          branchId: 'b-bole',
          branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
        },
      },
      {
        id: 'as-2',
        employeeId: 'emp-103',
        employee: {
          id: 'emp-103',
          fullName: 'Tigist G.',
          amharicName: 'ትዕግስት ገብሬ',
          ritualTitle: 'Bridal Texture Artisan',
          rating: 4.98,
          branchId: 'b-bole',
          branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
        },
      },
      {
        id: 'as-3',
        employeeId: 'emp-102',
        employee: {
          id: 'emp-102',
          fullName: 'Helen T.',
          amharicName: 'ሄለን ተስፋዬ',
          ritualTitle: 'Haute Updo Specialist',
          rating: 4.92,
          branchId: 'b-kazanchis',
          branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
        },
      },
    ],
  },
  {
    id: 'srv-102',
    code: 'SR-102',
    name: 'Habesha Braiding & Royal Wefts',
    amharicName: 'ባህላዊ የሀበሻ ቅቤ ቅብ ሹሩባ',
    category: 'Hair Styling & Couture',
    subCategory: 'Ancestral Weft Sculpting',
    description:
      'Traditional Ethiopian intricate fine cornrow and crown braiding incorporating natural cold-pressed herbal oils and scented floral pomades.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBp2mYKlmcVtxXRFVBRxK0L3TFmC9J0XTOIgCSkdgOp7BJxvqEyYPkVgNVQjRg5as94wJTzxWlhYI5UQKpunmOyPSjFxFsllVDTm29cqAgxG25iZiBf0pE5htWhr8rAZF5AOhpbAuWeh668jajceIwhMwGzRKRP1YxoQTTr4rBsCsz-QqHaT9KeaaRwIu9j0dM65r3z1wERql4gvi4ubutouJXMBxygw2zi0JxetueC',
    basePrice: 850,
    durationMinutes: 120,
    preSetupBuffer: 10,
    turnaroundBuffer: 15,
    workstationType: 'Artisan Braiding Station',
    minGuildRank: 'Senior Stylist (Guild Tier I)',
    requiresApprentice: false,
    requiredProtocols: ['Cold-Pressed Sesame Scalp Treatment', 'Organic Beeswax Edge Definition'],
    standardCommission: 20.0,
    status: true,
    branchServices: [
      {
        branchId: 'b-bole',
        serviceId: 'srv-102',
        customPrice: 850,
        customDurationMinutes: 120,
        customTurnaround: 15,
        requiredDeposit: 250,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
      },
      {
        branchId: 'b-kazanchis',
        serviceId: 'srv-102',
        customPrice: 950,
        customDurationMinutes: 120,
        customTurnaround: 15,
        requiredDeposit: 300,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
      },
      {
        branchId: 'b-cmc',
        serviceId: 'srv-102',
        customPrice: 800,
        customDurationMinutes: 120,
        customTurnaround: 15,
        requiredDeposit: 200,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-cmc', name: 'CMC Luxury Pavilions', slug: 'cmc' },
      },
    ],
  },
  {
    id: 'srv-201',
    code: 'SR-201',
    name: 'Traditional Ethiopian Koba & Scalp Steam',
    amharicName: 'የኮባ ቅጠል እና የእንፋሎት ፀጉር ህክምና',
    category: 'Holistic Spa & Scalp Therapy',
    subCategory: 'Hydro-Thermal Scalp Detox',
    description:
      'Warm ensat (koba) leaf thermal wrap combined with pure Ethiopian botanical butter infusions and warm ultrasonic mist canopy.',
    imageUrl:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    basePrice: 950,
    durationMinutes: 75,
    preSetupBuffer: 15,
    turnaroundBuffer: 15,
    workstationType: 'Hydro-Therapy Suite',
    minGuildRank: 'Therapeutic Practitioner',
    requiresApprentice: false,
    requiredProtocols: ['Thermal Koba Leaf Infusion', 'Ultrasonic Scalp Mist', 'Acupressure Neck Massage'],
    standardCommission: 17.5,
    status: true,
    branchServices: [
      {
        branchId: 'b-bole',
        serviceId: 'srv-201',
        customPrice: 950,
        customDurationMinutes: 75,
        customTurnaround: 15,
        requiredDeposit: 300,
        workstationLock: 'Hydro-1',
        isActive: true,
        branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
      },
      {
        branchId: 'b-kazanchis',
        serviceId: 'srv-201',
        customPrice: 1050,
        customDurationMinutes: 75,
        customTurnaround: 15,
        requiredDeposit: 350,
        workstationLock: 'Hydro-VIP',
        isActive: true,
        branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
      },
      {
        branchId: 'b-cmc',
        serviceId: 'srv-201',
        customPrice: 900,
        customDurationMinutes: 75,
        customTurnaround: 15,
        requiredDeposit: 250,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-cmc', name: 'CMC Luxury Pavilions', slug: 'cmc' },
      },
    ],
  },
  {
    id: 'srv-305',
    code: 'SR-305',
    name: 'Gold-Leaf Botanical Facial Therapy',
    amharicName: 'የወርቅ ቅጠል እና የተፈጥሮ ቅመሞች ፊት ህክምና',
    category: 'Advanced Aesthetics & Facials',
    subCategory: '24K Mineral Rejuvenation',
    description:
      'Luxurious 24K pure gold leaf application with Highland rose quartz contouring, hyaluronic infusion, and chilled jade compression.',
    imageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
    basePrice: 1500,
    durationMinutes: 90,
    preSetupBuffer: 15,
    turnaroundBuffer: 15,
    workstationType: 'Aesthetic Dermatology Suite',
    minGuildRank: 'Lead Aesthetician',
    requiresApprentice: false,
    requiredProtocols: ['Highland Rose Quartz Drainage', 'Pure 24K Leaf Application', 'Cryo-Oxygen Shield'],
    standardCommission: 15.0,
    status: true,
    branchServices: [
      {
        branchId: 'b-bole',
        serviceId: 'srv-305',
        customPrice: 1500,
        customDurationMinutes: 90,
        customTurnaround: 15,
        requiredDeposit: 500,
        workstationLock: 'Facial Suite 1',
        isActive: true,
        branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
      },
      {
        branchId: 'b-kazanchis',
        serviceId: 'srv-305',
        customPrice: 1750,
        customDurationMinutes: 90,
        customTurnaround: 20,
        requiredDeposit: 600,
        workstationLock: 'Aesthetic Pavilion Alpha',
        isActive: true,
        branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
      },
      {
        branchId: 'b-cmc',
        serviceId: 'srv-305',
        customPrice: 1400,
        customDurationMinutes: 90,
        customTurnaround: 15,
        requiredDeposit: 450,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-cmc', name: 'CMC Luxury Pavilions', slug: 'cmc' },
      },
    ],
  },
  {
    id: 'srv-402',
    code: 'SR-402',
    name: 'Imperial Frankincense & Myrrh Massage',
    amharicName: 'የስናር እጣን እና ከርቤ ሙሉ ሰውነት ማሳጅ',
    category: 'Holistic Spa & Scalp Therapy',
    subCategory: 'Sacred Resin Aromatherapy',
    description:
      'Full body restorative thermal massage utilizing wild Tigray frankincense resin, Ogaden myrrh balm, and volcanic basalt basalt stones.',
    imageUrl:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
    basePrice: 1100,
    durationMinutes: 60,
    preSetupBuffer: 15,
    turnaroundBuffer: 15,
    workstationType: 'Private Relaxation Pavilion',
    minGuildRank: 'Master Massage Therapist',
    requiresApprentice: false,
    requiredProtocols: ['Thermal Stone Balancing', 'Sacred Resin Inhalation', 'Herbal Foot Cleansing Bath'],
    standardCommission: 16.0,
    status: true,
    branchServices: [
      {
        branchId: 'b-bole',
        serviceId: 'srv-402',
        customPrice: 1100,
        customDurationMinutes: 60,
        customTurnaround: 15,
        requiredDeposit: 350,
        workstationLock: 'Spa Room B',
        isActive: true,
        branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
      },
      {
        branchId: 'b-kazanchis',
        serviceId: 'srv-402',
        customPrice: 1250,
        customDurationMinutes: 60,
        customTurnaround: 15,
        requiredDeposit: 400,
        workstationLock: 'Spa Suite Grand',
        isActive: true,
        branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
      },
      {
        branchId: 'b-cmc',
        serviceId: 'srv-402',
        customPrice: 1050,
        customDurationMinutes: 60,
        customTurnaround: 15,
        requiredDeposit: 300,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-cmc', name: 'CMC Luxury Pavilions', slug: 'cmc' },
      },
    ],
  },
  {
    id: 'srv-109',
    code: 'SR-109',
    name: 'Signature Silk Press & Thermal Gloss',
    amharicName: 'የሐር ልስላሴ የፀጉር ፕረስ እና ግሎስ',
    category: 'Hair Styling & Couture',
    subCategory: 'Hydration Thermal Smoothness',
    description:
      'Precision thermal glass-hair smoothing with natural botanical proteins, argon oil seal, and diamond shine finisher without chemical alterers.',
    imageUrl:
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
    basePrice: 650,
    durationMinutes: 60,
    preSetupBuffer: 10,
    turnaroundBuffer: 10,
    workstationType: 'Styling Station',
    minGuildRank: 'Stylist (Guild Tier I)',
    requiresApprentice: false,
    requiredProtocols: ['Ceramic Heat Shielding', 'Deep Hydration Steam Rinse'],
    standardCommission: 20.0,
    status: true,
    branchServices: [
      {
        branchId: 'b-bole',
        serviceId: 'srv-109',
        customPrice: 650,
        customDurationMinutes: 60,
        customTurnaround: 10,
        requiredDeposit: 150,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-bole', name: 'Bole Bulbula Sanctuary', slug: 'bole-bulbula' },
      },
      {
        branchId: 'b-kazanchis',
        serviceId: 'srv-109',
        customPrice: 750,
        customDurationMinutes: 60,
        customTurnaround: 10,
        requiredDeposit: 200,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', slug: 'kazanchis' },
      },
      {
        branchId: 'b-cmc',
        serviceId: 'srv-109',
        customPrice: 600,
        customDurationMinutes: 60,
        customTurnaround: 10,
        requiredDeposit: 150,
        workstationLock: null,
        isActive: true,
        branch: { id: 'b-cmc', name: 'CMC Luxury Pavilions', slug: 'cmc' },
      },
    ],
  },
];

const API_BASE = '/api/v1';

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

export const serviceApi = {
  /**
   * List all service rituals with optional category, search, and branch filters
   */
  async listServices(params?: {
    search?: string;
    category?: string;
    branchId?: string;
    status?: string;
    isActive?: boolean | string;
    approvalStatus?: string;
  }): Promise<ServiceRitual[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params?.branchId && params.branchId !== 'all') searchParams.append('branchId', params.branchId);
    if (params?.status) {
      searchParams.append('status', params.status);
    } else if (params?.isActive !== undefined) {
      searchParams.append('isActive', String(params.isActive));
    }
    if (params?.approvalStatus && params.approvalStatus !== 'all') {
      searchParams.append('approvalStatus', params.approvalStatus);
    }

    const res = await fetch(`${API_BASE}/services?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load rituals from database (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Get dynamic distinct category aggregations with service counts
   */
  async getCategories(branchId?: string): Promise<ServiceCategoryItem[]> {
    const url = branchId && branchId !== 'all' ? `${API_BASE}/services/categories?branchId=${branchId}` : `${API_BASE}/services/categories`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load categories (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Create dynamic category (Instant for Owner, Proposal for Branch Admin)
   */
  async createCategory(payload: {
    name: string;
    nameAm?: string;
    description?: string;
    reason?: string;
  }): Promise<ServiceCategoryItem> {
    const res = await fetch(`${API_BASE}/services/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to create category (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    payload: { name?: string; nameAm?: string; description?: string; isActive?: boolean }
  ): Promise<ServiceCategoryItem> {
    const res = await fetch(`${API_BASE}/services/categories/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to update category (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: string): Promise<ServiceCategoryItem> {
    const res = await fetch(`${API_BASE}/services/categories/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to toggle category status (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/services/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to delete category (${res.status})`);
    }
    return res.json();
  },

  /**
   * Permanently delete service ritual
   */
  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to delete service (${res.status})`);
    }
    return res.json();
  },

  /**
   * Retrieve single ritual specification dossier by ID or Code
   */
  async getServiceById(idOrCode: string, branchId?: string): Promise<ServiceRitual> {
    const url = branchId && branchId !== 'all'
      ? `${API_BASE}/services/${idOrCode}?branchId=${branchId}`
      : `${API_BASE}/services/${idOrCode}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Ritual ${idOrCode} not found in database (HTTP ${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Curate / Create new service ritual (OWNER clearance)
   */
  async createService(payload: CreateServicePayload): Promise<ServiceRitual> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Service curation failed with status ${res.status}`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Update master global service specification
   */
  async updateService(id: string, payload: Partial<CreateServicePayload>): Promise<ServiceRitual> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Service update failed (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Branch Governance Engine: Update branch-specific rule and pricing overrides
   */
  async updateBranchRules(
    serviceId: string,
    branchId: string,
    payload: UpdateBranchRulePayload
  ): Promise<BranchServiceRule> {
    const res = await fetch(`${API_BASE}/services/${serviceId}/branches/${branchId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Governance update failed (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Set branch-specific price, custom duration, and deposit overrides
   */
  async setBranchPrice(
    serviceId: string,
    payload: {
      branchId: string;
      customPrice: number;
      customDurationMinutes?: number | null;
      isActive?: boolean;
      depositType?: 'NONE' | 'FIXED' | 'PERCENTAGE' | null;
      depositValue?: number | null;
      reason?: string;
      submitForApproval?: boolean;
      requiresApproval?: boolean;
    }
  ) {
    const res = await fetch(`${API_BASE}/services/${serviceId}/branch-price`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to update branch price (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Retrieve governance change requests for review
   */
  async getGovernanceRequests(status?: string): Promise<GovernanceRequestItem[]> {
    const query = status && status !== 'ALL' ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/admin/governance${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch governance requests (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Review governance request (Owner APPROVE or REJECT)
   */
  async reviewGovernanceRequest(
    id: string,
    payload: { decision: 'APPROVE' | 'REJECT'; reviewNote?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/governance/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to submit review (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * List user notifications
   */
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch notifications (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Mark single notification as read
   */
  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to mark notification read (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to mark all read (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Retrieve immutable historical audit trail of price changes
   */
  async getPriceHistory(serviceId: string, branchId?: string): Promise<ServicePriceHistoryItem[]> {
    const url = branchId && branchId !== 'all'
      ? `${API_BASE}/services/${serviceId}/price-history?branchId=${branchId}`
      : `${API_BASE}/services/${serviceId}/price-history`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch price history (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Set default deposit rule for a branch
   */
  async setBranchDepositRule(
    branchId: string,
    payload: {
      defaultDepositType: 'NONE' | 'FIXED' | 'PERCENTAGE';
      defaultDepositValue: number;
    }
  ) {
    const res = await fetch(`${API_BASE}/branches/${branchId}/deposit-rule`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to update deposit rule (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Upload service image to Cloudinary (or local storage fallback)
   */
  async uploadImage(file: File): Promise<{ url: string; publicId?: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('eyob_auth_token');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/services/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to upload image (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },

  /**
   * Soft deactivation toggle with future appointment count warning
   */
  async toggleServiceStatus(id: string): Promise<{
    service: ServiceRitual;
    warningCount: number;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/services/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Status toggle failed (${res.status})`);
    }
    const json = await res.json();
    const updated = json.service || json.data || json;
    return {
      service: updated,
      warningCount: json.warning ? 1 : 0,
      message: json.message || 'Status updated',
    };
  },

  /**
   * Get Branch Governance Engine Overview & Analytics
   */
  async getBranchGovernance(branchSlugOrId: string = 'bole-bulbula'): Promise<BranchGovernanceData> {
    const res = await fetch(`${API_BASE}/services/governance/${branchSlugOrId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch governance metrics (${res.status})`);
    }
    const json = await res.json();
    return json.data || json;
  },
};

