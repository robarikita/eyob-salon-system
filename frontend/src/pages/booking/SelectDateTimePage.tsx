import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { bookingApi, MultiServiceChainOptionDTO } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const SelectDateTimePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  // Retrieve previous wizard choices from sessionStorage
  const branchData = sessionStorage.getItem('booking_branch');
  const serviceData = sessionStorage.getItem('booking_service');
  const servicesData = sessionStorage.getItem('booking_services');
  const specialistData = sessionStorage.getItem('booking_specialist');

  const branch = branchData
    ? JSON.parse(branchData)
    : { id: 'b61e054a-d75f-46fb-a9ec-870a426165b8', name: 'Bole Bulbula Sanctuary' };
  const service = serviceData
    ? JSON.parse(serviceData)
    : { id: 'SR-101', name: 'Bridal Hair & Haute Couture Updo', effectivePrice: 1200, effectiveDuration: 90, depositAmount: 300 };
  const selectedServices: any[] = servicesData
    ? JSON.parse(servicesData)
    : (serviceData ? [JSON.parse(serviceData)] : [service]);
  const isMultiService = selectedServices.length > 1;

  const specialist = specialistData
    ? JSON.parse(specialistData)
    : { id: 'any', name: 'Any Available Specialist / ማንኛውም ዝግጁ ባለሙያ', role: 'Artisan Cosmetologist' };

  // Generate the next 14 calendar dates starting TODAY (dates[0])
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
    return {
      dateStr,
      dayName,
      monthName,
      dayNum,
      full: d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0]); // Today by default (enables same-day booking)
  const [slots, setSlots] = useState<string[]>([]);
  const [chainOptions, setChainOptions] = useState<MultiServiceChainOptionDTO[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSlots() {
      try {
        setLoading(true);
        if (isMultiService) {
          const res = await bookingApi.getMultiServiceAvailability({
            branchId: branch.id,
            date: selectedDate.dateStr,
            services: selectedServices.map((s: any) => ({
              serviceId: s.id,
              preferredEmployeeId: specialist.id !== 'any' ? specialist.id : null,
            })),
            requireSameSpecialist: specialist.id !== 'any',
            bufferMinutes: 15,
          });
          const chains = res?.chainOptions || [];
          setChainOptions(chains);
          const available = chains.map((c) => c.chainStartTime);
          setSlots(available);
          if (available.length > 0) {
            setSelectedSlot((prev) => (available.includes(prev) ? prev : available[0]));
          } else {
            setSelectedSlot('');
          }
        } else {
          const res = await bookingApi.getAvailableSlots({
            branchId: branch.id,
            serviceId: service.id,
            employeeId: specialist.id !== 'any' ? specialist.id : undefined,
            date: selectedDate.dateStr,
          });
          const available = res?.availableSlots || [];
          setSlots(available);
          setChainOptions([]);
          if (available.length > 0) {
            setSelectedSlot((prev) => (available.includes(prev) ? prev : available[0]));
          } else {
            setSelectedSlot('');
          }
        }
      } catch (err) {
        console.error('Error loading slots:', err);
        setSlots([]);
        setChainOptions([]);
        setSelectedSlot('');
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, [selectedDate, branch.id, service.id, specialist.id, isMultiService]);

  const matchingChain = chainOptions.find((c) => c.chainStartTime === selectedSlot);

  const totalDuration = isMultiService
    ? selectedServices.reduce((acc, s) => acc + (s.effectiveDuration || s.durationMinutes || 60), 0)
    : (service.effectiveDuration || service.durationMinutes || 60);

  const totalPrice = isMultiService
    ? selectedServices.reduce((acc, s) => acc + (s.effectivePrice !== undefined ? Number(s.effectivePrice) : Number(s.basePrice || 0)), 0)
    : (service.effectivePrice || service.basePrice || 0);

  const totalDeposit = isMultiService
    ? selectedServices.reduce((acc, s) => {
        const dep = s.effectiveDeposit !== undefined && s.effectiveDeposit !== null ? s.effectiveDeposit : (s.depositAmount || 0);
        return acc + Number(dep);
      }, 0)
    : (service.effectiveDeposit ?? service.depositAmount ?? 0);

  const balanceDue = Math.max(0, totalPrice - totalDeposit);

  const handleContinue = () => {
    sessionStorage.setItem('booking_date', JSON.stringify(selectedDate));
    sessionStorage.setItem('booking_slot', selectedSlot);
    if (matchingChain) {
      sessionStorage.setItem('booking_chain_option', JSON.stringify(matchingChain));
    } else {
      sessionStorage.removeItem('booking_chain_option');
    }
    navigate('/book/review');
  };

  const customerDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || user?.phone || '';

  const customerInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0E0B09]">
      {/* 1. Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <LanguageToggle />

          <Link to="/book" className="text-stone-300 hover:text-[#D4AF37] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>{t('book.backServices')}</span>
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
              to="/login?redirect=/book/datetime"
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
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0E0B09] flex items-center justify-center text-[11px] font-bold">2</span>
            <span>{t('book.step2')}</span>
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

      {/* 3. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">
              Appointment Horizon
            </span>
            <h1 className="text-2xl lg:text-3xl font-serif text-[#1C1C19] font-bold">
              {t('book.step2')}
            </h1>
            <p className="text-xs text-stone-500">
              Synchronized reservation window for {branch.name}
            </p>
          </div>

          {/* Date Picker Carousel */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-3">
              1. Choose Date
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none">
              {dates.map((d) => {
                const isSelected = selectedDate.dateStr === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 w-20 py-3 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
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
            <p className="text-xs text-stone-600 mt-2 flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-sm text-[#D4AF37]">event_available</span>
              <span>Selected: <strong>{selectedDate.full}</strong></span>
            </p>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-3">
              2. Select Available Session Window
            </label>

            {loading ? (
              <div className="py-12 text-center text-stone-500 flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs tracking-wider uppercase">Loading / በመጫን ላይ...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-[#E5E2DD] text-stone-500 text-sm">
                <span className="material-symbols-outlined text-3xl text-stone-400 mb-2 block">event_busy</span>
                <p className="font-bold text-[#1C1C19]">No Available Slots / ክፍት ሰዓት የለም</p>
                <p className="text-xs text-stone-500 mt-1">Please select another date above / እባክዎ ሌላ ቀን ይምረጡ</p>
              </div>
            ) : (
              <div className="space-y-6">
                {morningSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block mb-2">
                      Morning (Before 12:00 PM) / ጥዋት
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {morningSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#181412] text-[#D4AF37] shadow'
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

                {afternoonSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block mb-2">
                      Afternoon (12:00 PM – 4:00 PM) / ከሰዓት
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {afternoonSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#181412] text-[#D4AF37] shadow'
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

                {eveningSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block mb-2">
                      Evening (After 4:00 PM) / ማታ
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {eveningSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'border-[#D4AF37] bg-[#181412] text-[#D4AF37] shadow'
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

                {/* Multi-Service Step Roadmap Timeline */}
                {matchingChain && matchingChain.steps && matchingChain.steps.length > 1 && (
                  <div className="mt-8 p-5 rounded-xl bg-white border border-[#E5E2DD] shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F0EDE9]">
                      <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold">
                        Consecutive Schedule / ተከታታይ ሰዓታት ({matchingChain.totalDurationMinutes} min)
                      </span>
                      <span className="text-xs font-bold text-[#D4AF37] font-mono">
                        {matchingChain.chainStartTime} – {matchingChain.chainEndTime}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {matchingChain.steps.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-lg bg-[#FAF7F2] border border-[#E5E2DD]">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#181412] text-[#D4AF37] flex items-center justify-center text-[11px] font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-[#1C1C19] block text-sm">
                                {st.serviceNameAm ? `${st.serviceName} / ${st.serviceNameAm}` : st.serviceName}
                              </span>
                              <span className="text-stone-500 text-[11px]">
                                Specialist: {st.employeeName} • {st.durationMinutes} min
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-[#775A00] bg-white px-2.5 py-1 rounded border border-[#E5E2DD] text-xs">
                            {st.startTime} – {st.endTime}
                          </span>
                        </div>
                      ))}
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
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-1">
              Reservation Dossier
            </span>
            <h3 className="font-serif text-xl font-bold text-[#FAF7F2] mb-4 pb-3 border-b border-[#2C2724]">
              Appointment Horizon
            </h3>

            <div className="space-y-4 text-xs mb-6">
              <div>
                <span className="text-stone-400 block mb-0.5">{t('book.selectRitual')}</span>
                {isMultiService ? (
                  <div className="space-y-1 mt-1">
                    {selectedServices.map((s: any, idx: number) => (
                      <div key={s.id} className="flex items-center justify-between text-[11px] bg-[#0E0B09] p-2 rounded border border-[#2C2724]">
                        <span className="font-bold text-[#FAF7F2] truncate mr-2">{idx + 1}. {s.name}</span>
                        <span className="text-[#D4AF37] font-mono">{s.effectiveDuration || s.durationMinutes || 60}m</span>
                      </div>
                    ))}
                    <p className="text-stone-400 text-[11px] mt-1">Total: {totalDuration} min / ደቂቃ</p>
                  </div>
                ) : (
                  <>
                    <p className="font-serif font-bold text-sm text-[#FAF7F2]">{service.name}</p>
                    <p className="text-stone-400">{totalDuration} Minutes Session</p>
                  </>
                )}
              </div>

              <div>
                <span className="text-stone-400 block mb-0.5">{t('book.selectSpecialist')}</span>
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
                  {selectedSlot ? (matchingChain ? `${matchingChain.chainStartTime} – ${matchingChain.chainEndTime}` : `${selectedSlot} (EAT)`) : '—'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2C2724] space-y-2 text-xs mb-6">
              <div className="flex items-center justify-between text-stone-400">
                <span>{t('book.deposit')}</span>
                <span className="text-[#D4AF37] font-bold">
                  {totalDeposit.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>{t('book.balanceDue')}</span>
                <span>
                  {balanceDue.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedSlot}
              className="w-full py-3.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <span>{t('book.continueReview')}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SelectDateTimePage;
