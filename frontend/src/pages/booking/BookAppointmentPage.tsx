import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { serviceApi, ServiceRitual } from '../../api/serviceApi';

interface Specialist {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviewsCount: number;
  bio: string;
  initials: string;
}

const DEFAULT_SPECIALISTS: Specialist[] = [
  {
    id: 'any',
    name: 'Any Available Specialist',
    role: 'First open master slot • Recommended for flexible schedules',
    rating: 4.95,
    reviewsCount: 320,
    bio: 'Optimal matching with top qualified artisan on duty.',
    initials: 'ANY',
  },
  {
    id: 'sara-ahmed',
    name: 'Sara Ahmed',
    role: 'Senior Hair Stylist & Haute Bridal Lead',
    rating: 4.96,
    reviewsCount: 184,
    bio: 'Specialized in traditional Ethiopian bridal crowns & royal chignons.',
    initials: 'SA',
  },
  {
    id: 'helen-tesfaye',
    name: 'Helen Tesfaye',
    role: 'Master Bridal Stylist & Couture Colorist',
    rating: 4.98,
    reviewsCount: 210,
    bio: '12 years couture mastery with training in Milan bridal architecture.',
    initials: 'HT',
  },
  {
    id: 'tigist-g',
    name: 'Tigist G.',
    role: 'Aesthetician & Dermal Therapist',
    rating: 4.92,
    reviewsCount: 142,
    bio: 'Master of gold peptide infusions and holistic lymphatic botanical care.',
    initials: 'TG',
  },
];

const BRANCHES = [
  { id: 'b61e054a-d75f-46fb-a9ec-870a426165b8', name: 'Bole Bulbula Sanctuary', subtitle: 'Morning Star Mall, 3rd Floor • VIP Suites Available' },
  { id: '7d15dc61-3864-4935-80ab-ac3286ff9ea2', name: 'Kazanchis Luxury Atelier', subtitle: 'Inter Luxury Arcade, Guinea Conakry St • Express Bar' },
  { id: 'b1e429ee-78fa-4f20-a32d-78eab610b041', name: 'CMC Imperial Villa', subtitle: 'Beside Tsehay Real Estate • Private Garden Spa' },
];

export const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const [selectedService, setSelectedService] = useState<ServiceRitual | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist>(DEFAULT_SPECIALISTS[1]);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const list = await serviceApi.listServices({ branchId: selectedBranch.id });
        setServices(list);
        if (list.length > 0 && !selectedService) {
          setSelectedService(list[0]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [selectedBranch]);

  const categories = ['All', 'Hair Styling & Couture', 'Bridal & Rituals', 'Facials & Skin', 'Nail Care', 'Holistic Spa'];

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
           selectedCategory.toLowerCase().includes(s.category.toLowerCase());
  });

  const handleContinue = () => {
    if (!selectedService) return;
    // Persist temporary booking intent in sessionStorage for wizard step continuity
    sessionStorage.setItem('booking_branch', JSON.stringify(selectedBranch));
    sessionStorage.setItem('booking_service', JSON.stringify(selectedService));
    sessionStorage.setItem('booking_specialist', JSON.stringify(selectedSpecialist));
    navigate('/book/datetime');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0E0B09]">
      {/* 1. Sanctuary Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
            EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
          </Link>

          <button
            onClick={() => setShowBranchModal(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-[#181412] border border-[#3E342F] text-xs text-[#FAF7F2] hover:border-[#D4AF37] transition"
          >
            <span className="material-symbols-outlined text-xs text-[#D4AF37]">location_on</span>
            <span>{selectedBranch.name}</span>
            <span className="text-stone-400 text-[10px]">Change</span>
          </button>
        </div>

        <nav className="flex items-center gap-6 text-xs tracking-wider uppercase">
          <Link to="/" className="hover:text-[#D4AF37] transition hidden md:block">Home</Link>
          <Link to="/my-bookings" className="hover:text-[#D4AF37] transition flex items-center gap-1.5 text-[#D4AF37]">
            <span className="material-symbols-outlined text-sm">bookmark_heart</span>
            My Bookings
          </Link>
          <div className="flex items-center gap-2 pl-4 border-l border-[#2C2724]">
            <div className="w-8 h-8 rounded-full bg-[#2C2724] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
              HD
            </div>
            <span className="hidden sm:block text-xs font-medium">Hana Desta</span>
          </div>
        </nav>
      </header>

      {/* 2. Step Progress Bar */}
      <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">1</span>
            <span>Step 1: Service & Specialist</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">2</span>
            <span className="hidden sm:inline">Step 2: Date & Time</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">3</span>
            <span className="hidden sm:inline">Step 3: Review</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">4</span>
            <span className="hidden sm:inline">Step 4: Confirmation</span>
          </div>
        </div>
      </div>

      {/* 3. Main Wizard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Selection Area (8 cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section A: Curated Rituals */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">Sanctuary Menu</span>
                <h1 className="text-2xl lg:text-3xl font-serif text-[#1C1C19] font-bold">Select Your Service Ritual</h1>
              </div>
              <p className="text-xs text-stone-500 mt-1 sm:mt-0">Authentic botanical treatments & royal formulations</p>
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

            {/* Service Cards Grid */}
            {loading ? (
              <div className="py-12 text-center text-sm text-stone-500">Loading sanctuary menu...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      className={`cursor-pointer rounded-lg p-5 border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#D4AF37] bg-white ring-2 ring-[#D4AF37]/50 shadow-md'
                          : 'border-[#E5E2DD] bg-white hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#775A00] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E5E2DD]">
                            {srv.code}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-[#D4AF37] flex items-center font-bold">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#1C1C19] leading-tight mb-0.5">{srv.name}</h3>
                        {srv.amharicName && (
                          <p className="text-xs font-serif text-stone-500 mb-2">{srv.amharicName}</p>
                        )}
                        <p className="text-xs text-stone-600 line-clamp-2 mb-4">{srv.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE9] text-xs">
                        <span className="text-stone-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {srv.effectiveDuration || srv.durationMinutes} Mins
                        </span>
                        <span className="font-bold text-sm text-[#775A00]">
                          {(srv.effectivePrice || srv.basePrice).toLocaleString()} ETB
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
              <span className="text-[11px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">Artisan Cosmetologists</span>
              <h2 className="text-2xl font-serif text-[#1C1C19] font-bold">Select Your Preferred Specialist</h2>
              <p className="text-xs text-stone-500">Dedicated professionals with verified master certifications</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEFAULT_SPECIALISTS.map((sp) => {
                const isSelected = selectedSpecialist.id === sp.id;
                return (
                  <div
                    key={sp.id}
                    onClick={() => setSelectedSpecialist(sp)}
                    className={`cursor-pointer rounded-lg p-4 border transition-all flex items-start gap-3 ${
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
                        <span className="text-xs text-[#D4AF37] flex items-center gap-0.5 font-semibold">
                          ★ {sp.rating}
                        </span>
                      </div>
                      <p className="text-xs text-[#775A00] font-medium leading-tight mb-1">{sp.role}</p>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{sp.bio}</p>
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
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">Reservation Dossier</span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              Booking Summary
            </h3>

            {/* Selected Branch */}
            <div className="mb-4 text-xs">
              <span className="text-stone-400 block mb-0.5">Sanctuary Branch</span>
              <div className="flex items-center justify-between font-medium">
                <span className="text-[#FAF7F2]">{selectedBranch.name}</span>
                <button onClick={() => setShowBranchModal(true)} className="text-[#D4AF37] hover:underline text-[11px]">
                  Change
                </button>
              </div>
            </div>

            {/* Selected Service */}
            {selectedService && (
              <div className="mb-4 text-xs">
                <span className="text-stone-400 block mb-0.5">Selected Ritual</span>
                <p className="text-sm font-serif font-bold text-[#FAF7F2]">{selectedService.name}</p>
                {selectedService.amharicName && (
                  <p className="text-xs text-stone-400 font-serif">{selectedService.amharicName}</p>
                )}
                <div className="flex items-center justify-between text-stone-400 mt-1">
                  <span>Duration: {selectedService.effectiveDuration || selectedService.durationMinutes} Mins</span>
                  <span className="text-[#D4AF37] font-bold">
                    {(selectedService.effectivePrice || selectedService.basePrice).toLocaleString()} ETB
                  </span>
                </div>
              </div>
            )}

            {/* Selected Specialist */}
            <div className="mb-6 text-xs">
              <span className="text-stone-400 block mb-0.5">Assigned Specialist</span>
              <p className="font-bold text-[#FAF7F2]">{selectedSpecialist.name}</p>
              <p className="text-[11px] text-stone-400">{selectedSpecialist.role}</p>
            </div>

            {/* Total Tariff & Deposit Breakdown */}
            <div className="pt-4 border-t border-[#2C2724] space-y-2 text-xs mb-6">
              <div className="flex items-center justify-between text-stone-400">
                <span>Ritual Tariff</span>
                <span>{(selectedService?.effectivePrice || selectedService?.basePrice || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Advance Hold Deposit</span>
                <span className="text-[#D4AF37] font-medium">
                  {(selectedService?.effectiveDeposit || 300).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[#FAF7F2] pt-2 border-t border-[#2C2724]">
                <span>Total Investment</span>
                <span className="text-base text-[#D4AF37]">
                  {(selectedService?.effectivePrice || selectedService?.basePrice || 0).toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedService}
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              Continue to Date & Time
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <p className="text-[10px] text-stone-400 text-center mt-3">
              Deposit hold confirmed via Chapa or reception cash
            </p>
          </div>
        </div>
      </main>

      {/* Branch Selection Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E2DD]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <h3 className="font-serif text-xl font-bold text-[#1C1C19]">Select Sanctuary Location</h3>
              <button onClick={() => setShowBranchModal(false)} className="text-stone-400 hover:text-stone-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {BRANCHES.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBranch(b);
                    setShowBranchModal(false);
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedBranch.id === b.id
                      ? 'border-[#D4AF37] bg-[#FAF7F2] ring-1 ring-[#D4AF37]'
                      : 'border-[#E5E2DD] hover:border-[#D4AF37]/50'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm text-[#1C1C19]">
                    <span>{b.name}</span>
                    {selectedBranch.id === b.id && (
                      <span className="text-xs text-[#D4AF37] font-semibold">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{b.subtitle}</p>
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
