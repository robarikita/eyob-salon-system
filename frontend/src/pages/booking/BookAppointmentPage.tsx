import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { serviceApi, ServiceRitual } from '../../api/serviceApi';
import { branchApi, BranchDTO } from '../../api/branchApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export interface SpecialistOption {
  id: string;
  name: string;
  role: string;
  rating?: number;
  initials: string;
  bio?: string;
}

export const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, t } = useLanguage();

  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchDTO | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedService, setSelectedService] = useState<ServiceRitual | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistOption>({
    id: 'any',
    name: 'Any Available Specialist / ማንኛውም ዝግጁ ባለሙያ',
    role: 'Optimal matching with on-duty master artisan',
    initials: 'ANY',
  });

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

  // 1. Fetch live branches on mount
  useEffect(() => {
    async function loadBranches() {
      try {
        const list = await branchApi.listBranches();
        const activeBranches = list.filter((b) => b.isActive !== false);
        setBranches(activeBranches);

        // Check query param ?branch= or restored draft
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

        setSelectedBranch(initialBranch || activeBranches[0] || null);
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
        const list = await serviceApi.listServices({ branchId: selectedBranch!.id });
        setServices(list);

        // Pre-select saved or first service
        const savedServiceRaw = sessionStorage.getItem('booking_service');
        let matchedService: ServiceRitual | undefined;
        if (savedServiceRaw) {
          try {
            const saved = JSON.parse(savedServiceRaw);
            matchedService = list.find((s) => s.id === saved.id);
          } catch {
            // Ignore
          }
        }
        if (!matchedService && list.length > 0) {
          matchedService = list[0];
        }
        setSelectedService(matchedService || null);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [selectedBranch]);

  // 3. Extract unique categories from live services
  const categories = [
    'All',
    ...Array.from(new Set(services.map((s) => s.category).filter(Boolean))),
  ];

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'All') return true;
    return (
      s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(s.category.toLowerCase())
    );
  });

  // Dynamic specialists derived from current service or default options
  const specialistOptions: SpecialistOption[] = [
    {
      id: 'any',
      name: language === 'am' ? 'ማንኛውም ዝግጁ ባለሙያ' : 'Any Available Specialist',
      role: language === 'am' ? 'የመጀመሪያ ክፍት ሰዓት' : 'First open master slot',
      initials: 'ANY',
      rating: 4.95,
      bio: language === 'am' ? 'ከወቅቱ ባለሙያ ጋር የሚጣጣም' : 'Optimal on-duty master matching',
    },
    ...(selectedService?.assignedEmployees && selectedService.assignedEmployees.length > 0
      ? selectedService.assignedEmployees.map((e) => {
          const emp = e.employee;
          const name = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Master Artisan';
          const initials = `${emp.firstName?.[0] || 'M'}${emp.lastName?.[0] || 'A'}`.toUpperCase();
          return {
            id: emp.id,
            name: emp.amharicName && language === 'am' ? emp.amharicName : name,
            role: emp.ritualTitle || (language === 'am' ? 'የውበት ባለሙያ' : 'Beauty Artisan'),
            initials,
            rating: emp.rating || 4.96,
            bio: language === 'am' ? 'የተረጋገጠ የውበት ባለሙያ' : 'Verified master cosmetologist',
          };
        })
      : [
          {
            id: 'sara-ahmed',
            name: 'Sara Ahmed',
            role: language === 'am' ? 'ዋና የፀጉር ባለሙያ' : 'Senior Hair Stylist',
            initials: 'SA',
            rating: 4.96,
            bio: language === 'am' ? 'የሙሽራ ዝግጅት ባለሙያ' : 'Haute bridal styling artisan',
          },
          {
            id: 'helen-tesfaye',
            name: 'Helen Tesfaye',
            role: language === 'am' ? 'የቆዳ እና የውበት ባለሙያ' : 'Dermal Therapist',
            initials: 'HT',
            rating: 4.98,
            bio: language === 'am' ? 'የፊት ህክምና ባለሙያ' : 'Master skin aesthetician',
          },
        ]),
  ];

  const handleContinue = () => {
    if (!selectedService || !selectedBranch) return;
    sessionStorage.setItem('booking_branch', JSON.stringify(selectedBranch));
    sessionStorage.setItem('booking_service', JSON.stringify(selectedService));
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
      {/* 1. Sanctuary Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
            EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
          </Link>

          {selectedBranch && (
            <button
              onClick={() => setShowBranchModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-[#181412] border border-[#3E342F] text-xs text-[#FAF7F2] hover:border-[#D4AF37] transition"
            >
              <span className="material-symbols-outlined text-xs text-[#D4AF37]">location_on</span>
              <span>{selectedBranch.name}</span>
              <span className="text-[#D4AF37] text-[10px] ml-1 font-semibold">{t('book.changeBranch')}</span>
            </button>
          )}
        </div>

        <nav className="flex items-center gap-4 text-xs tracking-wider uppercase">
          <LanguageToggle />

          <Link to="/my-bookings" className="hover:text-[#D4AF37] transition flex items-center gap-1.5 text-stone-300">
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">bookmark_heart</span>
            <span className="hidden md:inline">{t('nav.myBookings')}</span>
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
                className="text-[11px] text-red-400 hover:text-red-300 p-1 rounded border border-red-900/50 hover:bg-red-950/30 flex items-center transition"
                title={t('actions.signOut')}
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
              <span>{t('auth.signIn')}</span>
            </Link>
          )}
        </nav>
      </header>

      {/* 2. Restored Pending Draft Notice (if applicable) */}
      {pendingDraft && (
        <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#D4AF37]/40 px-4 lg:px-12 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-[#D4AF37]">history_edu</span>
              <div>
                <strong className="text-[#D4AF37] block sm:inline mr-2">
                  {t('book.restoredDraft')}:
                </strong>
                <span className="text-stone-300">
                  {pendingDraft.service?.name} ({pendingDraft.branch?.name}) • {pendingDraft.selectedDate?.dateStr} @ {pendingDraft.slot}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResumePendingDraft}
                className="px-4 py-1.5 rounded bg-[#D4AF37] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#c29e2f] transition"
              >
                {t('book.finishBooking')}
              </button>
              <button
                onClick={handleDismissDraft}
                className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Step Progress Bar */}
      <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">1</span>
            <span>{t('book.step1')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">2</span>
            <span className="hidden sm:inline">{t('book.step2')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">3</span>
            <span className="hidden sm:inline">{t('book.step3')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">4</span>
            <span className="hidden sm:inline">{t('book.step4')}</span>
          </div>
        </div>
      </div>

      {/* 4. Main Wizard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Selection Area (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section A: Curated Rituals */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">
                  Sanctuary Menu
                </span>
                <h1 className="text-2xl lg:text-3xl font-serif text-[#1C1C19] font-bold">
                  {t('book.selectRitual')}
                </h1>
              </div>
              {selectedBranch && (
                <button
                  type="button"
                  onClick={() => setShowBranchModal(true)}
                  className="text-xs text-[#775A00] hover:underline font-semibold flex items-center gap-1 mt-2 sm:mt-0"
                >
                  <span className="material-symbols-outlined text-sm">store</span>
                  <span>{selectedBranch.name}</span>
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded text-xs whitespace-nowrap transition font-medium ${
                    selectedCategory === cat
                      ? 'bg-[#31302D] text-[#FAF7F2] shadow-sm'
                      : 'bg-[#EBE8E3] text-stone-700 hover:bg-[#DDD8D0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Live Service Cards Grid */}
            {loading ? (
              <div className="py-16 text-center text-stone-500 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs tracking-wider uppercase">Loading live rituals...</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-500 bg-white rounded-xl border border-[#E5E2DD] p-6">
                No active rituals available in this category for {selectedBranch?.name}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  const price = srv.effectivePrice !== undefined ? srv.effectivePrice : srv.basePrice;
                  const duration = srv.effectiveDuration !== undefined ? srv.effectiveDuration : srv.durationMinutes;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`cursor-pointer rounded-xl p-5 border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#D4AF37] bg-white ring-2 ring-[#D4AF37]/50 shadow-md'
                          : 'border-[#E5E2DD] bg-white hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#775A00] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E5E2DD]">
                            {srv.code}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-[#D4AF37] flex items-center font-bold">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#1C1C19] leading-tight mb-0.5">
                          {srv.name}
                        </h3>
                        {srv.amharicName && (
                          <p className="text-xs font-serif text-stone-500 mb-2">{srv.amharicName}</p>
                        )}
                        {srv.description && (
                          <p className="text-xs text-stone-600 line-clamp-2 mb-4">{srv.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE9] text-xs">
                        <span className="text-stone-500 flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {duration} Mins
                        </span>
                        <span className="font-bold text-sm text-[#775A00]">
                          {Number(price).toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section B: Master Specialist Selection */}
          <section className="pt-6 border-t border-[#E5E2DD]">
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">
                Artisan Cosmetologists
              </span>
              <h2 className="text-2xl font-serif text-[#1C1C19] font-bold">
                {t('book.selectSpecialist')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {specialistOptions.map((sp) => {
                const isSelected = selectedSpecialist.id === sp.id;
                return (
                  <div
                    key={sp.id}
                    onClick={() => setSelectedSpecialist(sp)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#D4AF37] bg-white ring-2 ring-[#D4AF37]/50 shadow-md'
                        : 'border-[#E5E2DD] bg-white hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#181412] text-[#D4AF37] flex-shrink-0 flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40">
                      {sp.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-sm text-[#1C1C19] truncate">{sp.name}</h4>
                        {sp.rating && (
                          <span className="text-xs text-[#D4AF37] flex items-center gap-0.5 font-semibold">
                            ★ {sp.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#775A00] font-medium leading-tight mb-1">{sp.role}</p>
                      {sp.bio && <p className="text-[11px] text-stone-500 line-clamp-1">{sp.bio}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary Drawer (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] sticky top-24 shadow-xl">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
              Reservation Dossier
            </span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              {t('book.step3')}
            </h3>

            {/* Selected Branch */}
            <div className="mb-4 text-xs">
              <span className="text-stone-400 block mb-0.5">{t('book.selectBranch')}</span>
              <div className="flex items-center justify-between font-medium">
                <span className="text-[#FAF7F2] font-semibold">{selectedBranch?.name || 'Loading...'}</span>
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="text-[#D4AF37] hover:underline text-[11px] cursor-pointer"
                >
                  {t('book.changeBranch')}
                </button>
              </div>
            </div>

            {/* Selected Service */}
            {selectedService && (
              <div className="mb-4 text-xs">
                <span className="text-stone-400 block mb-0.5">{t('book.selectRitual')}</span>
                <p className="text-sm font-serif font-bold text-[#FAF7F2]">{selectedService.name}</p>
                {selectedService.amharicName && (
                  <p className="text-xs text-stone-400 font-serif">{selectedService.amharicName}</p>
                )}
                <div className="flex items-center justify-between text-stone-400 mt-1">
                  <span>
                    Duration: {selectedService.effectiveDuration || selectedService.durationMinutes} Mins
                  </span>
                  <span className="text-[#D4AF37] font-bold">
                    {Number(selectedService.effectivePrice || selectedService.basePrice).toLocaleString()} ETB
                  </span>
                </div>
              </div>
            )}

            {/* Selected Specialist */}
            <div className="mb-6 text-xs">
              <span className="text-stone-400 block mb-0.5">{t('book.selectSpecialist')}</span>
              <p className="font-bold text-[#FAF7F2]">{selectedSpecialist.name}</p>
              <p className="text-[11px] text-stone-400">{selectedSpecialist.role}</p>
            </div>

            {/* Total Tariff & Deposit Breakdown */}
            <div className="pt-4 border-t border-[#2C2724] space-y-2 text-xs mb-6">
              <div className="flex items-center justify-between text-stone-400">
                <span>{t('book.totalTariff')}</span>
                <span>
                  {Number(selectedService?.effectivePrice || selectedService?.basePrice || 0).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>{t('book.deposit')}</span>
                <span className="text-[#D4AF37] font-medium">
                  {Number(selectedService?.effectiveDeposit || 300).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[#FAF7F2] pt-2 border-t border-[#2C2724]">
                <span>{t('book.financialLedger')}</span>
                <span className="text-base text-[#D4AF37]">
                  {Number(selectedService?.effectivePrice || selectedService?.basePrice || 0).toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedService || !selectedBranch}
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <span>{t('book.continueSchedule')}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <p className="text-[10px] text-stone-400 text-center mt-3">
              Hold secured with sanitation & master readiness protocols
            </p>
          </div>
        </div>
      </main>

      {/* Branch Selection Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181412] text-stone-200 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D4AF37]/30">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-800">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                {t('book.selectBranch')}
              </h3>
              <button
                onClick={() => setShowBranchModal(false)}
                className="text-stone-400 hover:text-stone-100 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
              {branches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBranch(b);
                    setShowBranchModal(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedBranch?.id === b.id
                      ? 'border-[#D4AF37] bg-[#241E1A] ring-1 ring-[#D4AF37]'
                      : 'border-stone-800 bg-[#0E0B09] hover:border-[#D4AF37]/50'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm text-stone-100">
                    <span>{b.name}</span>
                    {selectedBranch?.id === b.id && (
                      <span className="text-xs text-[#D4AF37] font-semibold">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {b.address || b.addressLine || b.city || 'Addis Ababa'}
                  </p>
                  {b.phone && <p className="text-[11px] text-stone-500 font-mono mt-0.5">{b.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentPage;
