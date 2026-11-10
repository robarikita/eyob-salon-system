import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { serviceApi, ServiceRitual } from '../../api/serviceApi';
import { branchApi, BranchDTO } from '../../api/branchApi';
import { employeeApi, Employee } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export interface SpecialistOption {
  id: string;
  name: string;
  role: string;
  initials: string;
  specialties?: string[];
}

export const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchDTO | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchRitualQuery, setSearchRitualQuery] = useState('');
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; nameAm?: string | null; slug: string; isActive?: boolean; status?: string }[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceRitual[]>([]);
  const [viewingRatesServiceId, setViewingRatesServiceId] = useState<string | null>(null);

  const [branchEmployees, setBranchEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);

  const defaultAnyOption: SpecialistOption = {
    id: 'any',
    name: 'Any Specialist / ማንኛውም ባለሙያ',
    role: 'First Available / ቀዳሚ ክፍት',
    initials: 'ANY',
  };

  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistOption>(defaultAnyOption);
  const [pendingDraft, setPendingDraft] = useState<any | null>(null);

  // Check for restored pending draft
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pending_booking');
      if (raw) {
        const parsed = JSON.parse(raw);
        setPendingDraft(parsed);
      }
    } catch {
      // Ignore parse failure
    }
  }, []);

  // Fetch dynamic categories on mount (strictly active & approved, purging garbage)
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await serviceApi.getCategories();
        const activeApproved = (cats || []).filter(
          (c) =>
            c.isActive !== false &&
            (c.status === 'APPROVED' || !c.status) &&
            !c.name.toLowerCase().includes('test') &&
            !c.name.includes('bbbb') &&
            !c.name.includes('ssss')
        );
        setDbCategories(activeApproved);
      } catch (err) {
        console.error('Failed to load dynamic categories:', err);
      }
    }
    loadCategories();
  }, []);

  // 1. Fetch live branches on mount
  useEffect(() => {
    async function loadBranches() {
      try {
        const list = await branchApi.listBranches();
        const activeBranches = list.filter((b) => b.isActive !== false);
        setBranches(activeBranches);

        const queryParams = new URLSearchParams(location.search);
        const branchParam = queryParams.get('branch')?.toLowerCase();

        let initialBranch: BranchDTO | undefined;
        if (branchParam && activeBranches.length > 0) {
          initialBranch = activeBranches.find(
            (b) =>
              b.id.toLowerCase() === branchParam ||
              b.slug?.toLowerCase() === branchParam ||
              b.name.toLowerCase().includes(branchParam)
          );
        }

        if (!initialBranch && activeBranches.length > 0) {
          const savedBranchRaw = sessionStorage.getItem('booking_branch');
          if (savedBranchRaw) {
            try {
              const saved = JSON.parse(savedBranchRaw);
              initialBranch = activeBranches.find((b) => b.id === saved.id);
            } catch {
              // Ignore
            }
          }
        }

        const openBranches = activeBranches.filter((b) => b.isActive !== false);
        const resolvedInitial =
          initialBranch && initialBranch.isActive !== false
            ? initialBranch
            : openBranches[0] || activeBranches[0] || null;

        setSelectedBranch(resolvedInitial);
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    }
    loadBranches();
  }, [location.search]);

  // 2. Fetch live services when selected branch changes
  useEffect(() => {
    if (!selectedBranch) return;

    async function fetchServices() {
      try {
        setLoading(true);
        const list = await serviceApi.listServices({ status: 'active', branchId: selectedBranch!.id });
        setServices(list);

        // Pre-select saved or first service
        const savedServicesRaw = sessionStorage.getItem('booking_services');
        let matchedServices: ServiceRitual[] = [];
        if (savedServicesRaw) {
          try {
            const parsed = JSON.parse(savedServicesRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              matchedServices = list.filter((s) => parsed.some((p: any) => p.id === s.id));
            }
          } catch {
            // Ignore
          }
        }

        if (matchedServices.length === 0) {
          const savedServiceRaw = sessionStorage.getItem('booking_service');
          if (savedServiceRaw) {
            try {
              const saved = JSON.parse(savedServiceRaw);
              const found = list.find((s) => s.id === saved.id);
              if (found) matchedServices = [found];
            } catch {
              // Ignore
            }
          }
        }

        if (matchedServices.length === 0 && list.length > 0) {
          matchedServices = [list[0]];
        }

        setSelectedServices(matchedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [selectedBranch]);

  // 3. Fetch real specialists for the selected branch from PostgreSQL
  useEffect(() => {
    if (!selectedBranch) return;

    async function fetchSpecialists() {
      try {
        setLoadingEmployees(true);
        const emps = await employeeApi.getAllEmployees({ branchId: selectedBranch!.id });
        setBranchEmployees(emps.filter((e) => e.status !== false));
      } catch (err) {
        console.error('Failed to fetch specialists from DB:', err);
        setBranchEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    }
    fetchSpecialists();
  }, [selectedBranch]);

  // Dynamic specialist list with zero mock bios and zero fake stars
  const qualifiedEmployees = branchEmployees.filter((emp) => {
    if (selectedServices.length === 0) return true;
    if (!emp.services || emp.services.length === 0) return true;
    return selectedServices.some((srv) => emp.services?.some((s) => s.serviceId === srv.id));
  });

  const specialistOptions: SpecialistOption[] = [
    defaultAnyOption,
    ...qualifiedEmployees.map((emp) => {
      const name = emp.amharicName
        ? `${emp.firstName} ${emp.lastName} / ${emp.amharicName}`
        : `${emp.firstName} ${emp.lastName}`.trim();
      const initials = `${emp.firstName?.[0] || 'S'}${emp.lastName?.[0] || 'P'}`.toUpperCase();
      const role = emp.ritualTitle || 'Stylist / ባለሙያ';
      const specialties = (emp.specialties && emp.specialties.length > 0)
        ? emp.specialties
        : ((emp.services?.map((s: any) => s.service?.title || s.service?.name).filter(Boolean) as string[]) || []);
      return {
        id: emp.id,
        name,
        role,
        initials,
        specialties,
      };
    }),
  ];

  const toggleServiceSelection = (srv: ServiceRitual) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === srv.id);
      let next: ServiceRitual[];
      if (exists) {
        if (prev.length === 1) {
          next = [];
        } else {
          next = prev.filter((s) => s.id !== srv.id);
        }
      } else {
        next = [...prev, srv];
      }
      return next;
    });
  };

  const totalDuration = selectedServices.reduce((acc, s) => {
    const d = s.effectiveDuration !== undefined ? s.effectiveDuration : (s.durationMinutes || 60);
    return acc + d;
  }, 0);

  const totalPrice = selectedServices.reduce((acc, s) => {
    const p = s.effectivePrice !== undefined ? Number(s.effectivePrice) : Number(s.basePrice || 0);
    return acc + p;
  }, 0);

  const totalDeposit = selectedServices.reduce((acc, s) => {
    const dep = s.effectiveDeposit !== undefined && s.effectiveDeposit !== null
      ? Number(s.effectiveDeposit)
      : Number(s.depositAmount || 0);
    return acc + dep;
  }, 0);

  // Reset specialist if current specialist is not in qualified branch specialists
  useEffect(() => {
    if (selectedSpecialist.id !== 'any' && !qualifiedEmployees.some((e) => e.id === selectedSpecialist.id)) {
      setSelectedSpecialist(defaultAnyOption);
    }
  }, [qualifiedEmployees]);

  // Dynamic clean category pills
  const categoryPills: { id: string; label: string }[] = [
    { id: 'All', label: 'All / ሁሉም' },
    ...dbCategories.map((c) => ({
      id: c.slug || c.id,
      label: c.nameAm ? `${c.name} / ${c.nameAm}` : c.name,
    })),
  ];

  const filteredServices = services.filter((s) => {
    // Exclude services if associated category is deactivated
    if (s.serviceCategory && s.serviceCategory.isActive === false) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'All') {
      const target = selectedCategory.toLowerCase();
      const matchesCategory =
        s.categoryId?.toLowerCase() === target ||
        s.category?.toLowerCase() === target ||
        s.serviceCategory?.slug?.toLowerCase() === target ||
        s.serviceCategory?.name?.toLowerCase() === target;
      if (!matchesCategory) return false;
    }

    // Search filter across ritual name, Amharic title, code
    if (searchRitualQuery.trim()) {
      const q = searchRitualQuery.trim().toLowerCase();
      const nameMatch = s.name?.toLowerCase().includes(q);
      const nameAmMatch = (s.nameAm || s.amharicName)?.toLowerCase().includes(q);
      const codeMatch = s.code?.toLowerCase().includes(q);
      if (!nameMatch && !nameAmMatch && !codeMatch) {
        return false;
      }
    }

    return true;
  });

  const handleContinue = () => {
    if (selectedServices.length === 0 || !selectedBranch) return;
    sessionStorage.setItem('booking_branch', JSON.stringify(selectedBranch));
    sessionStorage.setItem('booking_services', JSON.stringify(selectedServices));
    sessionStorage.setItem('booking_service', JSON.stringify(selectedServices[0]));
    sessionStorage.setItem('booking_specialist', JSON.stringify(selectedSpecialist));
    navigate('/book/datetime');
  };

  const handleResumePendingDraft = () => {
    if (!pendingDraft) return;
    if (pendingDraft.branch) sessionStorage.setItem('booking_branch', JSON.stringify(pendingDraft.branch));
    if (pendingDraft.service) sessionStorage.setItem('booking_service', JSON.stringify(pendingDraft.service));
    if (pendingDraft.specialist) sessionStorage.setItem('booking_specialist', JSON.stringify(pendingDraft.specialist));
    if (pendingDraft.selectedDate) sessionStorage.setItem('booking_date', JSON.stringify(pendingDraft.selectedDate));
    if (pendingDraft.slot) sessionStorage.setItem('booking_slot', pendingDraft.slot);
    navigate('/book/review');
  };

  const handleDismissDraft = () => {
    sessionStorage.removeItem('pending_booking');
    setPendingDraft(null);
  };

  const customerDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || user?.phone || '';

  const customerInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0E0B09]">
      {/* 1. Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
            EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Salon & Spa</span>
          </Link>

          {selectedBranch && (
            branches.length > 1 ? (
              <button
                onClick={() => setShowBranchModal(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-[#181412] border border-[#3E342F] text-xs text-[#FAF7F2] hover:border-[#D4AF37] transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs text-[#D4AF37]">location_on</span>
                <span>{selectedBranch.name}</span>
                <span className="text-[#D4AF37] text-[10px] ml-1 font-semibold">Change / ቀይር</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-[#181412] border border-[#3E342F] text-xs text-[#FAF7F2]">
                <span className="material-symbols-outlined text-xs text-[#D4AF37]">location_on</span>
                <span>{selectedBranch.name}</span>
              </div>
            )
          )}
        </div>

        <nav className="flex items-center gap-4 text-xs tracking-wider uppercase">
          <LanguageToggle />

          <Link to="/my-bookings" className="hover:text-[#D4AF37] transition flex items-center gap-1.5 text-stone-300">
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">bookmark_heart</span>
            <span className="hidden md:inline">Bookings / ቀጠሮዎች</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-3 border-l border-[#2C2724]">
              <Link
                to="/account/profile"
                className="flex items-center gap-2 text-stone-200 hover:text-[#D4AF37] transition"
                title="Profile / መገለጫ"
              >
                <div className="w-8 h-8 rounded-full bg-[#2C2724] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
                  {customerInitials}
                </div>
                <span className="hidden sm:block text-xs font-medium max-w-[120px] truncate">
                  {customerDisplayName}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-[11px] text-red-400 hover:text-red-300 p-1 rounded border border-red-900/50 hover:bg-red-950/30 flex items-center transition cursor-pointer"
                title="Sign Out / ውጣ"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login?redirect=/book"
              className="flex items-center gap-1 text-xs font-semibold text-[#D4AF37] px-3 py-1.5 rounded bg-[#181412] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>Sign In / ግባ</span>
            </Link>
          )}
        </nav>
      </header>

      {/* 2. Pending Draft Banner */}
      {pendingDraft && (
        <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#D4AF37]/40 px-4 lg:px-12 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-[#D4AF37]">history_edu</span>
              <div>
                <strong className="text-[#D4AF37] block sm:inline mr-2">
                  Draft / የቀጠለ:
                </strong>
                <span className="text-stone-300">
                  {pendingDraft.service?.name} ({pendingDraft.branch?.name})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResumePendingDraft}
                className="px-4 py-1.5 rounded bg-[#D4AF37] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#c29e2f] transition cursor-pointer"
              >
                Resume / ቀጥል
              </button>
              <button
                onClick={handleDismissDraft}
                className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Steps Progress Bar */}
      <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">1</span>
            <span>Services / አገልግሎት</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">2</span>
            <span className="hidden sm:inline">Schedule / ሰዓት</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">3</span>
            <span className="hidden sm:inline">Review / ማጠቃለያ</span>
          </div>
        </div>
      </div>

      {/* 4. Main Wizard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Selection Area (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section A: Services */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#775A00] font-bold block mb-0.5">
                  Menu / ዝርዝር
                </span>
                <h1 className="text-2xl lg:text-3xl font-serif text-[#1C1C19] font-bold">
                  Services / አገልግሎቶች
                </h1>
              </div>
              {selectedBranch && (
                branches.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(true)}
                    className="text-xs text-[#775A00] hover:underline font-semibold flex items-center gap-1 mt-2 sm:mt-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">store</span>
                    <span>{selectedBranch.name}</span>
                  </button>
                ) : (
                  <div className="text-xs text-[#775A00] font-semibold flex items-center gap-1 mt-2 sm:mt-0">
                    <span className="material-symbols-outlined text-sm">store</span>
                    <span>{selectedBranch.name}</span>
                  </div>
                )
              )}
            </div>

            {/* Minimalist Live Search Bar */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchRitualQuery}
                onChange={(e) => setSearchRitualQuery(e.target.value)}
                placeholder="Search / ፈልግ..."
                className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-11 pr-10 py-2.5 text-sm text-[#1C1C19] placeholder:text-stone-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] shadow-sm transition"
              />
              {searchRitualQuery && (
                <button
                  type="button"
                  onClick={() => setSearchRitualQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Clean Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {categoryPills.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition font-semibold ${
                    selectedCategory === cat.id
                      ? 'bg-[#31302D] text-[#FAF7F2] shadow-sm'
                      : 'bg-[#EBE8E3] text-stone-700 hover:bg-[#DDD8D0]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Multi-Service Selection Luxury Counter Pill */}
            {selectedServices.length > 0 && (
              <div className="mb-6 p-3.5 rounded-xl bg-[#181412] text-[#FAF7F2] border border-[#D4AF37]/50 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center font-bold text-xs">
                    {selectedServices.length}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                      Selected: {selectedServices.length} {selectedServices.length === 1 ? 'Service' : 'Services'} / {selectedServices.length} አገልግሎቶች
                    </span>
                    <span className="text-[11px] text-stone-300">
                      Total: {totalDuration} min / ደቂቃ • {totalPrice.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#D4AF37] font-semibold hidden sm:inline">
                    Multi-Service Sequencing / ተከታታይ ቀጠሮ
                  </span>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServices([selectedServices[0]]);
                      }}
                      className="text-[10px] text-stone-400 hover:text-white px-2 py-1 rounded border border-[#2C2724] cursor-pointer"
                    >
                      Reset / አጽዳ
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Live Service Cards Grid */}
            {loading ? (
              <div className="py-16 text-center text-stone-500 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs tracking-wider uppercase">Loading / በመጫን ላይ...</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500 bg-white rounded-xl border border-[#E5E2DD] p-6">
                No active services available / ምንም አገልግሎት የለም
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((srv) => {
                  const isSelected = selectedServices.some((s) => s.id === srv.id);
                  const price = srv.effectivePrice !== undefined ? srv.effectivePrice : srv.basePrice;
                  const duration = srv.effectiveDuration !== undefined ? srv.effectiveDuration : srv.durationMinutes;
                  const isUnavailableAtBranch = srv.available === false || srv.isAvailable === false || srv.isAvailableAtSelectedBranch === false;

                  const displayName = (srv.nameAm || srv.amharicName)
                    ? `${srv.name} / ${srv.nameAm || srv.amharicName}`
                    : srv.name;

                  return (
                    <article
                      key={srv.id}
                      onClick={() => toggleServiceSelection(srv)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all duration-300 relative flex flex-col justify-between shadow-md ${
                        isSelected
                          ? 'border-[#D4AF37] ring-1 ring-[#D4AF37] bg-[#181412]'
                          : 'border-[#2C2724] bg-[#181412] hover:border-[#D4AF37]'
                      }`}
                    >
                      <div>
                        {/* Aspect-Video Image Banner with Gradient Fallback */}
                        <div className="w-full aspect-video rounded-lg mb-3 overflow-hidden bg-gradient-to-br from-[#181412] to-[#2C2724] relative border border-[#2C2724]">
                          {srv.imageUrl ? (
                            <img
                              src={srv.imageUrl}
                              alt={srv.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#D4AF37]/60">
                              <span className="material-symbols-outlined text-3xl mb-1">spa</span>
                              <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">Sanctuary Ritual</span>
                            </div>
                          )}
                          {srv.isUniformPrice === false && (
                            <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded text-[10px] font-semibold">
                              Variable / ተለዋዋጭ
                            </span>
                          )}
                        </div>

                        {/* Category Pill & Selection Indicator */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#0E0B09] px-2 py-0.5 rounded border border-[#2C2724]">
                            {srv.category?.split('&')[0]?.trim() || srv.code}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-[#D4AF37] flex items-center font-bold">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            </span>
                          )}
                        </div>

                        {/* Service Title: Strictly bilingual name, NO description block */}
                        <h3 className="font-serif text-base font-bold text-[#FAF7F2] leading-tight mb-1">
                          {displayName}
                        </h3>

                        {/* Branch Inactivity & Alternate Branch Suggestions Alert */}
                        {isUnavailableAtBranch && (
                          <div className="mb-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs">
                            <div className="flex items-center gap-1 font-semibold text-amber-400 mb-1">
                              <span className="material-symbols-outlined text-xs">info</span>
                              <span>Unavailable / በዚህ ቅርንጫፍ የለም</span>
                            </div>
                            {srv.alternateBranches && srv.alternateBranches.length > 0 ? (
                              <div className="mt-1.5">
                                <span className="text-[10px] text-amber-300 block mb-1">Alternate Branch / ሌላ ቅርንጫፍ:</span>
                                <div className="flex flex-wrap gap-1">
                                  {srv.alternateBranches.map((alt) => (
                                    <button
                                      key={alt.branchId}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const matched = branches.find((b) => b.id === alt.branchId || b.slug === alt.branchSlug);
                                        if (matched) {
                                          setSelectedBranch(matched);
                                          setSelectedServices([srv]);
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded bg-[#D4AF37] text-[#0E0B09] font-bold text-[10px] hover:bg-[#C59A3F] transition cursor-pointer"
                                    >
                                      {alt.branchName} ({Number(alt.price).toLocaleString()} ETB)
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-400">Unavailable / የለም</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Duration, Price & Action Button */}
                      <div className="flex flex-col pt-3 border-t border-[#2C2724] text-xs gap-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400 flex items-center gap-1 font-medium text-[11px]">
                            <span className="material-symbols-outlined text-xs text-[#D4AF37]">schedule</span>
                            {duration} min / ደቂቃ
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-sm text-[#D4AF37] font-serif">
                              {srv.isUniformPrice === false
                                ? `From ${Number(srv.minPrice || price).toLocaleString()} ETB`
                                : `${Number(price).toLocaleString()} ETB`}
                            </span>
                          </div>
                        </div>

                        {/* Branch Rates Trigger */}
                        {srv.branchPricings && srv.branchPricings.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingRatesServiceId(viewingRatesServiceId === srv.id ? null : srv.id);
                              }}
                              className="text-[10px] text-[#D4AF37] bg-[#0E0B09] hover:bg-[#2C2724] px-2 py-0.5 rounded border border-[#D4AF37]/40 font-semibold transition cursor-pointer"
                            >
                              Branch Rates / የቅርንጫፍ ዋጋ
                            </button>
                          </div>
                        )}

                        {/* Branch Rates Dropdown */}
                        {viewingRatesServiceId === srv.id && srv.branchPricings && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 bg-[#0E0B09] text-[#FAF7F2] rounded-lg border border-[#D4AF37]/40 text-xs animate-fade-in"
                          >
                            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#2C2724]">
                              <span className="font-bold text-[#D4AF37] text-[10px] uppercase tracking-wider">
                                Branch Rates / የቅርንጫፍ ዋጋ
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewingRatesServiceId(null)}
                                className="text-stone-400 hover:text-white text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="space-y-1">
                              {srv.branchPricings.map((bp) => (
                                <div key={bp.branchId} className="flex items-center justify-between text-[10px]">
                                  <span className="text-stone-300 flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${bp.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    {bp.branchName}
                                  </span>
                                  <span className="font-bold text-[#D4AF37]">
                                    {Number(bp.price).toLocaleString()} ETB
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Select Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleServiceSelection(srv);
                          }}
                          className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0E0B09]'
                              : 'bg-[#2C2724] text-stone-300 hover:bg-[#D4AF37] hover:text-[#0E0B09]'
                          }`}
                        >
                          {isSelected ? 'Selected / ተመርጧል ✓' : 'Add / ምረጥ +'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section B: Specialists (Database-Only) */}
          <section className="pt-6 border-t border-[#E5E2DD]">
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-widest text-[#775A00] font-bold block mb-0.5">
                Staff / ባለሙያዎች
              </span>
              <h2 className="text-2xl font-serif text-[#1C1C19] font-bold">
                Specialist / ባለሙያ
              </h2>
            </div>

            {loadingEmployees ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                <span className="material-symbols-outlined text-lg animate-spin text-[#D4AF37] mb-1 block">
                  sync
                </span>
                Loading Specialists / በመጫን ላይ...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specialistOptions.map((sp) => {
                  const isSelected = selectedSpecialist.id === sp.id;
                  const isAny = sp.id === 'any';

                  return (
                    <div
                      key={sp.id}
                      onClick={() => setSelectedSpecialist(sp)}
                      className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'border-[#D4AF37] bg-white ring-2 ring-[#D4AF37]/50 shadow-md'
                          : 'border-[#E5E2DD] bg-white hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#181412] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
                          {isAny ? (
                            <span className="material-symbols-outlined text-[18px]">group</span>
                          ) : (
                            sp.initials
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#1C1C19] truncate">{sp.name}</h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${
                            isAny
                              ? 'bg-[#D4AF37]/20 text-[#775A00] border border-[#D4AF37]/40'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {sp.role}
                          </span>
                          {sp.specialties && sp.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sp.specialties.slice(0, 3).map((spec, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#D4AF37]/10 text-[#775A00] border border-[#D4AF37]/30">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[#D4AF37] material-symbols-outlined text-lg flex-shrink-0">
                          check_circle
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Sticky Summary Drawer (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] sticky top-24 shadow-xl">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
              Summary / ማጠቃለያ
            </span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              Summary / ማጠቃለያ
            </h3>

            {/* Line Items (strictly 1-2 words) */}
            <div className="space-y-3 mb-6 text-xs">
              {/* Branch */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2C2724]/60">
                <span className="text-stone-400">Branch / ቅርንጫፍ</span>
                <div className="flex items-center gap-1.5 font-semibold text-[#FAF7F2]">
                  <span>{selectedBranch?.name || '—'}</span>
                  {branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowBranchModal(true)}
                      className="text-[#D4AF37] hover:underline text-[10px] cursor-pointer"
                    >
                      Edit / ቀይር
                    </button>
                  )}
                </div>
              </div>

              {/* Rituals List */}
              <div className="pb-2 border-b border-[#2C2724]/60 space-y-1.5">
                <div className="flex items-center justify-between text-stone-400">
                  <span>Ritual / አገልግሎት</span>
                  <span className="text-[#D4AF37] font-semibold">{selectedServices.length} Selected</span>
                </div>
                {selectedServices.map((srv, idx) => (
                  <div key={srv.id} className="flex items-center justify-between text-[11px] bg-[#0E0B09] p-2 rounded border border-[#2C2724]">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="font-bold text-[#FAF7F2] truncate block">
                        {idx + 1}. {srv.name}
                      </span>
                      <span className="text-stone-400 text-[10px]">
                        {srv.effectiveDuration || srv.durationMinutes || 60} min • {Number(srv.effectivePrice || srv.basePrice).toLocaleString()} ETB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleServiceSelection(srv)}
                      className="text-stone-400 hover:text-red-400 text-xs px-1 cursor-pointer"
                      title="Remove / አስወግድ"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2C2724]/60">
                <span className="text-stone-400">Duration / ሰዓት</span>
                <span className="font-semibold text-[#FAF7F2]">
                  {totalDuration} min / ደቂቃ
                </span>
              </div>

              {/* Specialist */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2C2724]/60">
                <span className="text-stone-400">Specialist / ባለሙያ</span>
                <span className="font-semibold text-[#FAF7F2] text-right truncate max-w-[60%]">
                  {selectedSpecialist.name.split('/')[0].trim()}
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2C2724]/60">
                <span className="text-stone-400">Total / ጠቅላላ</span>
                <span className="font-bold text-[#D4AF37] text-sm font-serif">
                  {totalPrice.toLocaleString()} ETB
                </span>
              </div>

              {/* Deposit */}
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Deposit / ቅድመ ክፍያ</span>
                <span className="font-semibold text-[#FAF7F2]">
                  {totalDeposit.toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* Branch Inactivity Warning & Alternate Suggestions in Summary */}
            {selectedServices.some((s) => s.available === false || s.isAvailableAtSelectedBranch === false) && (
              <div className="mb-4 p-3 rounded-lg bg-amber-950/60 border border-amber-600/60 text-xs text-[#FAF7F2]">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span>Unavailable / በዚህ ቅርንጫፍ የለም</span>
                </div>
                {selectedServices.find((s) => s.alternateBranches && s.alternateBranches.length > 0)?.alternateBranches ? (
                  <div>
                    <span className="text-[10px] text-stone-300 block mb-1.5">Alternate Branch / ሌላ ቅርንጫፍ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedServices.find((s) => s.alternateBranches && s.alternateBranches.length > 0)?.alternateBranches?.map((alt) => (
                        <button
                          key={alt.branchId}
                          type="button"
                          onClick={() => {
                            const matched = branches.find((b) => b.id === alt.branchId || b.slug === alt.branchSlug);
                            if (matched) setSelectedBranch(matched);
                          }}
                          className="px-2.5 py-1 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-[10px] uppercase transition cursor-pointer"
                        >
                          {alt.branchName} ({Number(alt.price).toLocaleString()} ETB)
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400">Unavailable / የለም</p>
                )}
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={
                selectedServices.length === 0 ||
                !selectedBranch ||
                selectedBranch.isActive === false ||
                selectedServices.some((s) => s.available === false || s.isAvailableAtSelectedBranch === false)
              }
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <span>Continue / ይቀጥሉ →</span>
            </button>
            {selectedBranch?.isActive === false && (
              <p className="text-[11px] text-amber-400 font-semibold text-center mt-2">
                Closed / ዝግ ነው
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Branch Selection Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181412] text-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D4AF37]/30">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-800">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                Branch / ቅርንጫፍ
              </h3>
              <button
                onClick={() => setShowBranchModal(false)}
                className="text-stone-400 hover:text-stone-100 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
              {branches.map((b) => {
                const isClosed = b.isActive === false;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (isClosed) return;
                      setSelectedBranch(b);
                      setShowBranchModal(false);
                    }}
                    className={`p-4 rounded-xl border transition ${
                      isClosed
                        ? 'border-stone-800 bg-[#0E0B09]/60 opacity-60 cursor-not-allowed'
                        : selectedBranch?.id === b.id
                        ? 'border-[#D4AF37] bg-[#241E1A] ring-1 ring-[#D4AF37] cursor-pointer'
                        : 'border-stone-800 bg-[#0E0B09] hover:border-[#D4AF37]/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-stone-100">
                      <div className="flex items-center gap-2">
                        <span>{b.name}</span>
                        {isClosed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/90 text-amber-400 border border-amber-800/60 uppercase">
                            Closed / ዝግ ነው
                          </span>
                        )}
                      </div>
                      {selectedBranch?.id === b.id && !isClosed && (
                        <span className="text-xs text-[#D4AF37] font-semibold">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      {b.address || b.addressLine || b.city || 'Addis Ababa'}
                    </p>
                    {b.phone && <p className="text-[11px] text-stone-500 font-mono mt-0.5">{b.phone}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentPage;
