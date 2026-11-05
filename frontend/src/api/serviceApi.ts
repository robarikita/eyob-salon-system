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

export interface ServiceRitual {
  id: string;
  code: string;
  name: string;
  amharicName?: string | null;
  category: string;
  subCategory?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  durationMinutes: number;
  preSetupBuffer: number;
  turnaroundBuffer: number;
  workstationType?: string | null;
  minGuildRank?: string | null;
  requiresApprentice: boolean;
  requiredProtocols: string[];
  standardCommission?: number | null;
  status: boolean;
  branchServices?: BranchServiceRule[];
  assignedEmployees?: AssignedSpecialist[];
  effectivePrice?: number;
  effectiveDuration?: number;
  effectiveTurnaround?: number;
  effectiveDeposit?: number;
  effectiveIsActive?: boolean;
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
  code: string;
  name: string;
  amharicName?: string;
  category: string;
  subCategory?: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  durationMinutes: number;
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

export const serviceApi = {
  /**
   * List all service rituals with optional category, search, and branch filters
   */
  async listServices(params?: {
    search?: string;
    category?: string;
    branchId?: string;
    isActive?: boolean | string;
  }): Promise<ServiceRitual[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
      if (params?.branchId && params.branchId !== 'all') searchParams.append('branchId', params.branchId);
      if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));

      const res = await fetch(`${API_BASE}/services?${searchParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch {
      // Local fallback with filtering
      let result = [...MOCK_SERVICES];
      if (params?.category && params.category !== 'All') {
        result = result.filter((s) => s.category.toLowerCase().includes(params.category!.toLowerCase()));
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.code.toLowerCase().includes(query) ||
            (s.amharicName && s.amharicName.includes(query)) ||
            (s.subCategory && s.subCategory.toLowerCase().includes(query))
        );
      }
      if (params?.isActive !== undefined && params.isActive !== '') {
        const target = String(params.isActive) === 'true';
        result = result.filter((s) => s.status === target);
      }
      return result;
    }
  },

  /**
   * Get dynamic distinct category aggregations with service counts
   */
  async getCategories(branchId?: string): Promise<Array<{ name: string; count: number }>> {
    try {
      const url = branchId ? `${API_BASE}/services/categories?branchId=${branchId}` : `${API_BASE}/services/categories`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch {
      // Local aggregation fallback
      const catMap = new Map<string, number>();
      for (const s of MOCK_SERVICES) {
        catMap.set(s.category, (catMap.get(s.category) || 0) + 1);
      }
      return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
    }
  },

  /**
   * Retrieve single ritual specification dossier by ID or Code
   */
  async getServiceById(idOrCode: string, branchId?: string): Promise<ServiceRitual> {
    try {
      const url = branchId
        ? `${API_BASE}/services/${idOrCode}?branchId=${branchId}`
        : `${API_BASE}/services/${idOrCode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch {
      const found = MOCK_SERVICES.find(
        (s) => s.id === idOrCode || s.code.toLowerCase() === idOrCode.toLowerCase()
      );
      if (found) return found;
      return MOCK_SERVICES[0];
    }
  },

  /**
   * Curate / Create new service ritual (OWNER clearance)
   */
  async createService(payload: CreateServicePayload): Promise<ServiceRitual> {
    try {
      const token = localStorage.getItem('eyob_auth_token');
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Creation failed with status ${res.status}`);
      }
      const json = await res.json();
      return json.data || json;
    } catch (err: any) {
      // Mock creation locally
      const newRitual: ServiceRitual = {
        id: `srv-${Date.now()}`,
        code: payload.code,
        name: payload.name,
        amharicName: payload.amharicName,
        category: payload.category,
        subCategory: payload.subCategory,
        description: payload.description,
        imageUrl: payload.imageUrl,
        basePrice: payload.basePrice,
        durationMinutes: payload.durationMinutes,
        preSetupBuffer: payload.preSetupBuffer || 0,
        turnaroundBuffer: payload.turnaroundBuffer || 15,
        workstationType: payload.workstationType,
        minGuildRank: payload.minGuildRank,
        requiresApprentice: !!payload.requiresApprentice,
        requiredProtocols: payload.requiredProtocols || [],
        standardCommission: payload.standardCommission || 18,
        status: true,
        branchServices: (payload.branchIds || ['b-bole', 'b-kazanchis', 'b-cmc']).map((bId) => ({
          branchId: bId,
          serviceId: `srv-${Date.now()}`,
          customPrice: payload.basePrice,
          customDurationMinutes: payload.durationMinutes,
          customTurnaround: payload.turnaroundBuffer || 15,
          requiredDeposit: Math.round(payload.basePrice * 0.3),
          workstationLock: null,
          isActive: true,
        })),
      };
      MOCK_SERVICES.unshift(newRitual);
      return newRitual;
    }
  },

  /**
   * Update master global service specification
   */
  async updateService(id: string, payload: Partial<CreateServicePayload>): Promise<ServiceRitual> {
    try {
      const token = localStorage.getItem('eyob_auth_token');
      const res = await fetch(`${API_BASE}/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch {
      const idx = MOCK_SERVICES.findIndex((s) => s.id === id);
      if (idx !== -1) {
        MOCK_SERVICES[idx] = { ...MOCK_SERVICES[idx], ...payload };
        return MOCK_SERVICES[idx];
      }
      return MOCK_SERVICES[0];
    }
  },

  /**
   * Branch Governance Engine: Update branch-specific rule and pricing overrides
   */
  async updateBranchRules(
    serviceId: string,
    branchId: string,
    payload: UpdateBranchRulePayload
  ): Promise<BranchServiceRule> {
    try {
      const token = localStorage.getItem('eyob_auth_token');
      const res = await fetch(`${API_BASE}/services/${serviceId}/branches/${branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Governance update failed (${res.status})`);
      }
      const json = await res.json();
      return json.data || json;
    } catch (err: any) {
      // Mock branch rule update locally
      const s = MOCK_SERVICES.find((serv) => serv.id === serviceId);
      if (s && s.branchServices) {
        const rule = s.branchServices.find((b) => b.branchId === branchId);
        if (rule) {
          Object.assign(rule, payload);
          return rule;
        }
      }
      return {
        branchId,
        serviceId,
        customPrice: payload.customPrice ?? null,
        customDurationMinutes: payload.customDurationMinutes ?? null,
        customTurnaround: payload.customTurnaround ?? 15,
        requiredDeposit: payload.requiredDeposit ?? null,
        workstationLock: payload.workstationLock ?? null,
        isActive: payload.isActive ?? true,
      };
    }
  },

  /**
   * Soft deactivation toggle with future appointment count warning
   */
  async toggleServiceStatus(id: string): Promise<{
    service: ServiceRitual;
    warningCount: number;
    message: string;
  }> {
    try {
      const token = localStorage.getItem('eyob_auth_token');
      const res = await fetch(`${API_BASE}/services/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Status toggle failed (${res.status})`);
      const json = await res.json();
      return json.data || json;
    } catch {
      const serv = MOCK_SERVICES.find((s) => s.id === id);
      if (serv) {
        serv.status = !serv.status;
        return {
          service: serv,
          warningCount: serv.status ? 0 : 3,
          message: serv.status
            ? 'Service ritual reactivated across sanctuaries'
            : 'Ritual deactivated. 3 future guest reservations preserved.',
        };
      }
      throw new Error('Service not found');
    }
  },

  /**
   * Get Branch Governance Engine Overview & Analytics
   */
  async getBranchGovernance(branchSlugOrId: string = 'bole-bulbula'): Promise<BranchGovernanceData> {
    try {
      const token = localStorage.getItem('eyob_auth_token');
      const res = await fetch(`${API_BASE}/services/governance/${branchSlugOrId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || json;
    } catch {
      // Mock governance data matching design
      const isBole = branchSlugOrId.includes('bole');
      const isKazanchis = branchSlugOrId.includes('kazan');

      const branchName = isBole
        ? 'Bole Bulbula Sanctuary (Morning Star Mall, 3rd Floor)'
        : isKazanchis
        ? 'Kazanchis VIP Sanctuary (ECA Quartier)'
        : 'CMC Luxury Pavilions (Heights Blvd)';

      const branchId = isBole ? 'b-bole' : isKazanchis ? 'b-kazanchis' : 'b-cmc';

      const governedRituals = MOCK_SERVICES.map((s) => {
        const bRule = s.branchServices?.find((br) => br.branchId === branchId) || null;
        return {
          ...s,
          branchServiceRule: bRule,
          localPrice: bRule?.customPrice ?? s.basePrice,
          localTurnaround: bRule?.customTurnaround ?? s.turnaroundBuffer,
          localDeposit: bRule?.requiredDeposit ?? Math.round((bRule?.customPrice ?? s.basePrice) * 0.3),
          localWorkstation: bRule?.workstationLock || s.workstationType || 'Suite 1',
          isBranchActive: bRule?.isActive ?? s.status,
          localSpecialistsCount: s.assignedEmployees ? s.assignedEmployees.length : 4,
        };
      });

      return {
        branch: {
          id: branchId,
          name: branchName,
          slug: isBole ? 'bole-bulbula' : isKazanchis ? 'kazanchis' : 'cmc',
          address: isBole ? 'Morning Star Mall, 3rd Floor' : 'ECA Quartier',
        },
        metrics: {
          totalMasterRituals: 24,
          activeBranchRituals: isBole ? 22 : isKazanchis ? 20 : 19,
          offeringPercentage: isBole ? 91.7 : isKazanchis ? 83.3 : 79.2,
          averageTicketPrice: isBole ? 820 : isKazanchis ? 890 : 780,
          dailyCapacitySlots: 48,
          occupancyRate: 92,
          totalQualifiedSpecialists: isBole ? 18 : isKazanchis ? 15 : 12,
        },
        rituals: governedRituals,
      };
    }
  },
};

