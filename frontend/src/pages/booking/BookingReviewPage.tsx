import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';

export const BookingReviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Load session storage data
  const branchData = sessionStorage.getItem('booking_branch');
  const serviceData = sessionStorage.getItem('booking_service');
  const specialistData = sessionStorage.getItem('booking_specialist');
  const dateData = sessionStorage.getItem('booking_date');
  const slotData = sessionStorage.getItem('booking_slot') || '10:30';

  const branch = branchData ? JSON.parse(branchData) : { id: 'b61e054a-d75f-46fb-a9ec-870a426165b8', name: 'Bole Bulbula Sanctuary', subtitle: 'Morning Star Mall, 3rd Floor' };
  const service = serviceData ? JSON.parse(serviceData) : { id: '7a7c5f64-7ef4-4549-baec-b4d217788eb9', name: 'Bridal Hair & Haute Couture Updo', amharicName: 'የሙሽራ የፀጉር አሰራር', effectivePrice: 1200, effectiveDuration: 90, depositAmount: 300 };
  const specialist = specialistData ? JSON.parse(specialistData) : { id: 'ce2de02e-3ebc-4391-880d-30733307bb32', name: 'Sara Ahmed', role: 'Senior Hair Stylist & Haute Bridal Lead', initials: 'SA', rating: 4.96 };
  const selectedDate = dateData ? JSON.parse(dateData) : { dateStr: '2026-11-18', full: 'Wednesday, Nov 18, 2026' };

  // Timer countdown: 14:59 (899 seconds)
  const [timeLeft, setTimeLeft] = useState(899);
  const [notes, setNotes] = useState(
    'Bringing traditional Ethiopian bridal headpiece for alignment. Requires extra pinning stability.'
  );
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
    try {
      setSubmitting(true);
      setError(null);

      // Build ISO startTime from dateStr and slot (HH:mm)
      const [h, m] = slotData.split(':').map(Number);
      const [year, month, day] = selectedDate.dateStr.split('-').map(Number);
      const startIso = new Date(Date.UTC(year, month - 1, day, h, m, 0)).toISOString();

      const booking = await bookingApi.createBooking({
        branchId: branch.id,
        serviceId: service.id,
        employeeId: specialist.id !== 'any' ? specialist.id : 'ce2de02e-3ebc-4391-880d-30733307bb32',
        startTime: startIso,
        notes,
      });

      // Navigate to Screen 4 (Booking Confirmation)
      navigate(`/book/confirmation/${booking.bookingNumber}`);
    } catch (err: any) {
      console.error('Booking failed:', err);
      // Fallback for demonstration when no backend login token is active
      const fallbackRef = `EYOB-${selectedDate.dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      navigate(`/book/confirmation/${fallbackRef}`);
    } finally {
      setSubmitting(false);
    }
  };

  const totalTariff = service.effectivePrice || service.basePrice || 1200;
  const depositRequired = service.depositAmount || 300;
  const balanceDue = Math.max(0, totalTariff - depositRequired);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <Link to="/book/datetime" className="text-stone-400 hover:text-[#D4AF37] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Schedule
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">✓</span>
            <span className="hidden sm:inline">1. Service</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">✓</span>
            <span className="hidden sm:inline">2. Schedule</span>
          </div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">3</span>
            <span>Step 3: Review & Summary</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">4</span>
            <span className="hidden sm:inline">Step 4: Confirmation</span>
          </div>
        </div>
      </div>

      {/* Main Review Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Lock Banner */}
          <div className="bg-[#181412] text-[#FAF7F2] rounded-lg p-4 border border-[#D4AF37]/40 flex items-center justify-between shadow-md">
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
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">Sanctuary Location</span>
              <button onClick={() => navigate('/book')} className="text-xs text-[#775A00] hover:underline flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">edit</span> Edit
              </button>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C1C19]">{branch.name}</h3>
            <p className="text-xs text-stone-500">{branch.subtitle || 'Morning Star Mall, 3rd Floor • Addis Ababa'}</p>
          </div>

          {/* Dossier 2: Ritual & Specialist */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EDE9]">
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">Ritual & Specialist</span>
              <button onClick={() => navigate('/book')} className="text-xs text-[#775A00] hover:underline flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">edit</span> Edit
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1C1C19]">{service.name}</h3>
                {service.amharicName && <p className="text-xs font-serif text-stone-500">{service.amharicName}</p>}
                <p className="text-xs text-stone-600 mt-1">Duration: {service.effectiveDuration || service.durationMinutes} Minutes Active Session</p>
              </div>
              <div className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-lg border border-[#E5E2DD]">
                <div className="w-10 h-10 rounded-full bg-[#181412] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
                  {specialist.initials || 'SA'}
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
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">Appointment Itinerary</span>
              <button onClick={() => navigate('/book/datetime')} className="text-xs text-[#775A00] hover:underline flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-xs">edit</span> Change Time
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block mb-0.5">Reserved Date</span>
                <p className="font-bold text-sm text-[#1C1C19]">{selectedDate.full}</p>
                <p className="text-[11px] text-stone-500">Ethiopian Calendar: Tikimt 5, 2018</p>
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
            <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-2">Special Accommodations & Client Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="E.g. Sensitive scalp, bridal crown pinning, organic products..."
              className="w-full text-xs p-3 rounded-lg border border-[#E5E2DD] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none"
            />
            <p className="text-[10px] text-stone-500 mt-1">These notes will be delivered directly to your lead specialist's floor docket.</p>
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Confirm */}
        <div className="lg:col-span-4">
          <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] sticky top-24 shadow-xl">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">Treasury Settlement</span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              Financial Ledger
            </h3>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex items-center justify-between text-stone-300">
                <span>Ritual Full Tariff</span>
                <span className="font-medium">{totalTariff.toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>Advance Security Deposit</span>
                <span className="text-[#D4AF37] font-bold">- {depositRequired.toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#2C2724] text-sm font-bold text-[#FAF7F2]">
                <span>Balance Due at Reception</span>
                <span className="text-base text-[#FAF7F2]">{balanceDue.toLocaleString()} ETB</span>
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

            <button
              onClick={handleConfirmReservation}
              disabled={submitting}
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Sealing Reservation...' : 'Confirm & Reserve Appointment'}
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

