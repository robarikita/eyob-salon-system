import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const BookingConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!reference) return;
      try {
        setLoading(true);
        const data = await bookingApi.getBookingByIdOrRef(reference);
        setBooking(data);
      } catch (err) {
        console.warn('Booking record load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [reference]);

  const bookingRef = booking?.bookingNumber || reference || 'CONFIRMED';

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const firstItem = booking?.items?.[0];
  const serviceName = firstItem?.service?.name || firstItem?.serviceTitleSnapshot || 'Sanctuary Ritual';
  const serviceAmharic = firstItem?.service?.amharicName;
  const specialistName =
    firstItem?.employee
      ? `${firstItem.employee.firstName} ${firstItem.employee.lastName || ''}`.trim()
      : 'Assigned Master Specialist';

  const branchName = booking?.branch?.name || 'Eyob Beauty Sanctuary';
  const branchAddress = booking?.branch?.addressLine || 'Addis Ababa';

  const dateFormatted = firstItem?.startTime
    ? new Date(firstItem.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Confirmed Schedule';

  const timeFormatted = firstItem?.startTime
    ? new Date(firstItem.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' (EAT)'
    : 'Confirmed Window';

  const totalAmount = Number(booking?.totalAmount || firstItem?.priceSnapshot || 0);
  const depositPaid = Number(booking?.depositPaid || 0);
  const balanceDue = Math.max(0, totalAmount - depositPaid);

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

          <Link to="/my-bookings" className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-sm">bookmark_heart</span>
            <span>{t('nav.myBookings')}</span>
          </Link>

          {isAuthenticated && (
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
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Confirmation Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {loading ? (
          <div className="py-24 text-center text-stone-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-wider">Loading confirmation...</span>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#181412] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center mx-auto mb-4 shadow-xl">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <span className="text-xs uppercase tracking-widest text-[#775A00] font-bold block mb-1">
                Reservation Sealed
              </span>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1C1C19] mb-2">
                Your Appointment is Confirmed!
              </h1>
              <p className="text-xs text-stone-600 max-w-lg mx-auto">
                We look forward to welcoming you to the sanctuary. An ethereal curation of aesthetic care awaits you.
              </p>
            </div>

            {/* Reference Callout Card */}
            <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] mb-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">
                  Official Booking Reference
                </span>
                <span className="text-2xl font-mono font-bold text-[#D4AF37] tracking-wider">{bookingRef}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded bg-[#2C2724] hover:bg-[#3E342F] text-xs text-[#FAF7F2] flex items-center gap-2 border border-[#D4AF37]/40 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#D4AF37]">content_copy</span>
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Reference'}</span>
              </button>
            </div>

            {/* Protocol Receipt Dossier */}
            <div className="bg-white rounded-xl border border-[#E5E2DD] p-6 lg:p-8 shadow-sm space-y-6 mb-8">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EDE9]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block">
                    Official Protocol
                  </span>
                  <h2 className="font-serif text-xl font-bold text-[#1C1C19]">Service Dossier & Ritual Schedule</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>{booking?.status || 'CONFIRMED'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Selected Ritual</span>
                    <p className="text-base font-serif font-bold text-[#1C1C19]">{serviceName}</p>
                    {serviceAmharic && <p className="text-xs text-stone-500 font-serif">{serviceAmharic}</p>}
                    <p className="text-stone-600 mt-1">
                      {firstItem?.durationSnapshot || 60} Minutes Active Session • Private Suite Reserve
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Artisan Specialist</span>
                    <p className="font-bold text-sm text-[#1C1C19]">{specialistName}</p>
                    <p className="text-[#775A00]">Master Stylist & Beauty Artisan</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Date & Horizon</span>
                    <p className="font-bold text-sm text-[#1C1C19]">{dateFormatted}</p>
                    <p className="text-[#775A00] font-medium">{timeFormatted}</p>
                    <p className="text-[11px] text-stone-500">East Africa Time (UTC+3)</p>
                  </div>

                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Sanctuary Suite</span>
                    <p className="font-bold text-sm text-[#1C1C19]">{branchName}</p>
                    <p className="text-stone-600">{branchAddress}</p>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="pt-6 border-t border-[#F0EDE9]">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block mb-3">
                  {t('book.financialLedger')}
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>{t('book.totalTariff')}</span>
                    <span className="font-medium">{totalAmount.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>{t('book.deposit')}</span>
                    <span className="text-[#775A00] font-bold">- {depositPaid.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE9] text-sm font-bold text-[#1C1C19]">
                    <span>{t('book.balanceDue')}</span>
                    <span className="text-base text-[#775A00]">{balanceDue.toLocaleString()} ETB</span>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Payable via Cash, CBE, or Telebirr upon completion at Sanctuary Reception.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/my-bookings"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#31302D] hover:bg-[#1C1C19] text-[#FAF7F2] text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#D4AF37]">bookmark_heart</span>
                <span>{t('nav.myBookings')}</span>
              </Link>

              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-[#F0EDE9] text-[#1C1C19] border border-[#E5E2DD] text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Receipt</span>
              </button>

              <Link
                to="/book"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">spa</span>
                <span>Return to Ritual Menu</span>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BookingConfirmationPage;
