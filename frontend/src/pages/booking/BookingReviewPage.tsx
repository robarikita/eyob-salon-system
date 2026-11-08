import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const BookingReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  // Load session storage data
  const branchData = sessionStorage.getItem('booking_branch');
  const serviceData = sessionStorage.getItem('booking_service');
  const specialistData = sessionStorage.getItem('booking_specialist');
  const dateData = sessionStorage.getItem('booking_date');
  const slotData = sessionStorage.getItem('booking_slot') || '10:30';

  const branch = branchData
    ? JSON.parse(branchData)
    : { id: 'b61e054a-d75f-46fb-a9ec-870a426165b8', name: 'Bole Bulbula Sanctuary', subtitle: 'Addis Ababa' };
  const service = serviceData
    ? JSON.parse(serviceData)
    : { id: '7a7c5f64-7ef4-4549-baec-b4d217788eb9', name: 'Bridal Hair & Haute Couture Updo', amharicName: 'የሙሽራ የፀጉር አሰራር', effectivePrice: 1200, effectiveDuration: 90, depositAmount: 300 };
  const specialist = specialistData
    ? JSON.parse(specialistData)
    : { id: 'any', name: 'Any Available Specialist / ማንኛውም ዝግጁ ባለሙያ', role: 'Artisan Cosmetologist', initials: 'ANY' };
  const selectedDate = dateData
    ? JSON.parse(dateData)
    : { dateStr: new Date().toISOString().split('T')[0], full: 'Upcoming Horizon' };

  // Timer countdown: 14:59 (899 seconds)
  const [timeLeft, setTimeLeft] = useState(899);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleConfirmReservation = async () => {
    setError(null);

    // GUEST BOOKING GUARD: Check if authenticated
    if (!isAuthenticated) {
      const pendingBooking = {
        branch,
        service,
        specialist,
        selectedDate,
        slot: slotData,
        notes,
      };
      sessionStorage.setItem('pending_booking', JSON.stringify(pendingBooking));
      sessionStorage.setItem('booking_branch', JSON.stringify(branch));
      sessionStorage.setItem('booking_service', JSON.stringify(service));
      sessionStorage.setItem('booking_specialist', JSON.stringify(specialist));
      sessionStorage.setItem('booking_date', JSON.stringify(selectedDate));
      sessionStorage.setItem('booking_slot', slotData);

      navigate('/login?redirect=/book/review&message=login_required');
      return;
    }

    try {
      setSubmitting(true);

      // Build ISO startTime from dateStr and slot (HH:mm)
      const [h, m] = slotData.split(':').map(Number);
      const [year, month, day] = selectedDate.dateStr.split('-').map(Number);
      const startIso = new Date(Date.UTC(year, month - 1, day, h, m, 0)).toISOString();

      const booking = await bookingApi.createBooking({
        branchId: branch.id,
        serviceId: service.id,
        employeeId: specialist.id !== 'any' ? specialist.id : undefined,
        startTime: startIso,
        notes: notes.trim() || undefined,
      });

      // Clear pending draft upon successful booking creation
      sessionStorage.removeItem('pending_booking');
      sessionStorage.removeItem('booking_branch');
      sessionStorage.removeItem('booking_service');
      sessionStorage.removeItem('booking_specialist');
      sessionStorage.removeItem('booking_date');
      sessionStorage.removeItem('booking_slot');

      navigate(`/book/confirmation/${booking.bookingNumber || booking.id}`);
    } catch (err: any) {
      console.error('Booking failed:', err);
      setError(err.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalTariff = service.effectivePrice || service.basePrice || 0;
  const depositRequired = service.effectiveDeposit !== undefined && service.effectiveDeposit !== null
    ? service.effectiveDeposit
    : (service.depositAmount ?? 0);
  const balanceDue = Math.max(0, totalTariff - depositRequired);

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
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <LanguageToggle />

          <Link to="/book/datetime" className="text-stone-300 hover:text-[#D4AF37] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>{t('book.backSchedule')}</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-3 border-l border-[#2C2724]">
              <Link
                to="/account/profile"
                className="flex items-center gap-2 text-stone-200 hover:text-[#D4AF37] transition"
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
              to="/login?redirect=/book/review"
              className="flex items-center gap-1 text-xs font-semibold text-[#D4AF37] px-3 py-1.5 rounded bg-[#181412] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>{t('auth.signIn')}</span>
            </Link>
          )}
        </div>
      </header>

      {/* 2. Step Progress Bar */}
      <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">✓</span>
            <span className="hidden sm:inline">{t('book.step1')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">✓</span>
            <span className="hidden sm:inline">{t('book.step2')}</span>
          </div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">3</span>
            <span>{t('book.step3')}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">4</span>
            <span className="hidden sm:inline">{t('book.step4')}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Review Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Lock Banner */}
          <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-4 border border-[#D4AF37]/40 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[#D4AF37] animate-pulse">lock_clock</span>
              <div>
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Slot Temporarily Held</p>
                <p className="text-xs text-stone-300">Your selected specialist slot is reserved for {formatTimer(timeLeft)} minutes</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-[#D4AF37]">{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Dossier 1: Designated Branch */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EDE9]">
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">
                {t('book.selectBranch')}
              </span>
              <button
                onClick={() => navigate('/book')}
                className="text-xs text-[#775A00] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">edit</span> {t('branch.edit')}
              </button>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C1C19]">{branch.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{branch.address || branch.addressLine || branch.city || 'Addis Ababa'}</p>
          </div>

          {/* Dossier 2: Ritual & Specialist */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EDE9]">
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">
                {t('book.step1')}
              </span>
              <button
                onClick={() => navigate('/book')}
                className="text-xs text-[#775A00] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">edit</span> {t('branch.edit')}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1C1C19]">{service.name}</h3>
                {service.amharicName && <p className="text-xs font-serif text-stone-500">{service.amharicName}</p>}
                <p className="text-xs text-stone-600 mt-1">
                  Duration: {service.effectiveDuration || service.durationMinutes || 60} Minutes Active Session
                </p>
              </div>
              <div className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E5E2DD]">
                <div className="w-10 h-10 rounded-full bg-[#181412] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
                  {specialist.initials || 'SP'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1C19]">{specialist.name}</h4>
                  <p className="text-[11px] text-[#775A00]">{specialist.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dossier 3: Appointment Itinerary */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EDE9]">
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">
                {t('book.step2')}
              </span>
              <button
                onClick={() => navigate('/book/datetime')}
                className="text-xs text-[#775A00] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">edit</span> Change Time
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block mb-0.5">Reserved Date</span>
                <p className="font-bold text-sm text-[#1C1C19]">{selectedDate.full}</p>
              </div>
              <div>
                <span className="text-stone-400 block mb-0.5">Session Window</span>
                <p className="font-bold text-sm text-[#775A00] flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">alarm</span>
                  {slotData} (EAT)
                </p>
                <p className="text-[11px] text-stone-500">Arrival 10 mins prior recommended</p>
              </div>
            </div>
          </div>

          {/* Dossier 4: Customer Notes & Accommodations */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-2">
              {t('book.notes')}
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="E.g. Sensitive scalp, bridal crown pinning, organic preferences..."
              className="w-full text-xs p-3 rounded-lg border border-[#E5E2DD] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Delivered directly to your assigned artisan's workstation docket.
            </p>
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Confirm */}
        <div className="lg:col-span-4">
          <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] sticky top-24 shadow-xl">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
              {t('book.financialLedger')}
            </span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              Financial Ledger
            </h3>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex items-center justify-between text-stone-300">
                <span>{t('book.totalTariff')}</span>
                <span className="font-medium">{Number(totalTariff).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>{t('book.deposit')}</span>
                <span className="text-[#D4AF37] font-bold">- {Number(depositRequired).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#2C2724] text-sm font-bold text-[#FAF7F2]">
                <span>{t('book.balanceDue')}</span>
                <span className="text-base text-[#FAF7F2]">{Number(balanceDue).toLocaleString()} ETB</span>
              </div>
              <p className="text-[10px] text-stone-400">
                Remaining balance payable upon exit via Cash, CBE Birr, or Telebirr.
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded bg-red-950/60 border border-red-500 text-red-200 text-xs">
                {error}
              </div>
            )}

            {!isAuthenticated && (
              <div className="mb-4 p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs text-center flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>{t('book.loginRequired')}</span>
              </div>
            )}

            <button
              onClick={handleConfirmReservation}
              disabled={submitting}
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {submitting ? '...' : t('book.confirmReserve')}
              <span className="material-symbols-outlined text-sm">verified_user</span>
            </button>

            <p className="text-[10px] text-stone-400 text-center mt-3 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#D4AF37]">shield</span>
              Guaranteed reservation hold with sanitization protocols
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingReviewPage;
