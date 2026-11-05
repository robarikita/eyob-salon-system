import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';

export const SelectDateTimePage: React.FC = () => {
  const navigate = useNavigate();

  // Retrieve previous wizard choices from sessionStorage
  const branchData = sessionStorage.getItem('booking_branch');
  const serviceData = sessionStorage.getItem('booking_service');
  const specialistData = sessionStorage.getItem('booking_specialist');

  const branch = branchData ? JSON.parse(branchData) : { id: 'b61e054a-d75f-46fb-a9ec-870a426165b8', name: 'Bole Bulbula Sanctuary' };
  const service = serviceData ? JSON.parse(serviceData) : { id: 'SR-101', name: 'Bridal Hair & Haute Couture Updo', effectivePrice: 1200, effectiveDuration: 90, depositAmount: 300 };
  const specialist = specialistData ? JSON.parse(specialistData) : { id: 'sara-ahmed', name: 'Sara Ahmed', role: 'Senior Hair Stylist' };

  // Generate the next 14 calendar dates
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    return { dateStr, dayName, monthName, dayNum, full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) };
  });

  const [selectedDate, setSelectedDate] = useState(dates[1]); // Tomorrow by default
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:30');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSlots() {
      try {
        setLoading(true);
        const res = await bookingApi.getAvailableSlots({
          branchId: branch.id,
          serviceId: service.id,
          employeeId: specialist.id !== 'any' ? specialist.id : undefined,
          date: selectedDate.dateStr,
        });
        setSlots(res.availableSlots);
        if (res.availableSlots.length > 0 && !res.availableSlots.includes(selectedSlot)) {
          setSelectedSlot(res.availableSlots[0]);
        }
      } catch (err) {
        console.error('Error loading slots:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, [selectedDate, branch.id, service.id, specialist.id]);

  const handleContinue = () => {
    sessionStorage.setItem('booking_date', JSON.stringify(selectedDate));
    sessionStorage.setItem('booking_slot', selectedSlot);
    navigate('/book/review');
  };

  // Group slots into Morning (< 12:00), Afternoon (12:00 - 16:00), Evening (>= 16:00)
  const morningSlots = slots.filter((s) => {
    const [h] = s.split(':').map(Number);
    return h < 12;
  });
  const afternoonSlots = slots.filter((s) => {
    const [h] = s.split(':').map(Number);
    return h >= 12 && h < 16;
  });
  const eveningSlots = slots.filter((s) => {
    const [h] = s.split(':').map(Number);
    return h >= 16;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/book" className="text-stone-400 hover:text-[#D4AF37] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Services
          </Link>
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] flex items-center justify-center text-[11px]">✓</span>
            <span className="hidden sm:inline">1. Service & Specialist</span>
          </div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">2</span>
            <span>Step 2: Date & Time</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">Appointment Itinerary</span>
            <h1 className="text-2xl lg:text-3xl font-serif text-[#1C1C19] font-bold">Select Date & Time</h1>
            <p className="text-xs text-stone-500">Real-time salon schedule synchronization across private suites</p>
          </div>

          {/* Date Picker Carousel */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-3">
              1. Choose Horizon Date
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none">
              {dates.map((d) => {
                const isSelected = selectedDate.dateStr === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 w-20 py-3 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-[#D4AF37] bg-white ring-2 ring-[#D4AF37] shadow-md'
                        : 'border-[#E5E2DD] bg-white hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">{d.dayName}</span>
                    <span className="text-xl font-serif font-bold text-[#1C1C19] my-0.5">{d.dayNum}</span>
                    <span className="text-[10px] text-[#775A00] font-medium">{d.monthName}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-[#D4AF37]">event_available</span>
              Selected: <strong className="text-[#1C1C19]">{selectedDate.full}</strong>
            </p>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-3">
              2. Select Available Session Window
            </label>

            {loading ? (
              <div className="py-12 text-center text-sm text-stone-500">Checking specialist availability...</div>
            ) : slots.length === 0 ? (
              <div className="py-8 px-6 bg-white rounded-lg border border-[#E5E2DD] text-center">
                <span className="material-symbols-outlined text-3xl text-stone-400 block mb-2">event_busy</span>
                <p className="text-sm font-bold text-stone-700">No Open Slots on this Date</p>
                <p className="text-xs text-stone-500 mt-1">Please select an adjacent date above or switch specialists.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Slots */}
                {morningSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">wb_sunny</span> Morning Rituals (Before 12:00 PM)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {morningSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#31302D] text-[#D4AF37] shadow'
                                : 'border-[#E5E2DD] bg-white text-stone-700 hover:border-[#D4AF37]/50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoonSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">light_mode</span> Afternoon Sessions (12:00 PM – 04:00 PM)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {afternoonSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#31302D] text-[#D4AF37] shadow'
                                : 'border-[#E5E2DD] bg-white text-stone-700 hover:border-[#D4AF37]/50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {eveningSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">dark_mode</span> Twilight & Evening (04:00 PM onwards)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {eveningSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#31302D] text-[#D4AF37] shadow'
                                : 'border-[#E5E2DD] bg-white text-stone-700 hover:border-[#D4AF37]/50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Drawer: Review Badge */}
        <div className="lg:col-span-4">
          <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] sticky top-24 shadow-xl">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">Reservation Dossier</span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              Appointment Horizon
            </h3>

            <div className="space-y-4 text-xs mb-6">
              <div>
                <span className="text-stone-400 block mb-0.5">Selected Ritual</span>
                <p className="font-serif font-bold text-sm text-[#FAF7F2]">{service.name}</p>
                <p className="text-stone-400">{service.effectiveDuration || service.durationMinutes} Minutes Session</p>
              </div>

              <div>
                <span className="text-stone-400 block mb-0.5">Assigned Specialist</span>
                <p className="font-bold text-[#FAF7F2]">{specialist.name}</p>
              </div>

              <div>
                <span className="text-stone-400 block mb-0.5">Target Date</span>
                <p className="font-bold text-[#D4AF37]">{selectedDate.full}</p>
              </div>

              <div>
                <span className="text-stone-400 block mb-0.5">Selected Time Slot</span>
                <p className="font-bold text-lg text-[#FAF7F2] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]">alarm</span>
                  {selectedSlot} (EAT)
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2C2724] space-y-2 text-xs mb-6">
              <div className="flex items-center justify-between text-stone-400">
                <span>Advance Hold Deposit</span>
                <span className="text-[#D4AF37] font-bold">{(service.depositAmount || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Remaining at Reception</span>
                <span>{((service.effectivePrice || service.basePrice) - (service.depositAmount || 0)).toLocaleString()} ETB</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedSlot}
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              Review Details & Lock Hold
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectDateTimePage;
