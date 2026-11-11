import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const BookingConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isAm = language === 'am';

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

  const items = booking?.items && booking.items.length > 0 ? booking.items : [];
  const firstItem = items[0];

  const branchName = booking?.branch?.name || (isAm ? 'እዮብ የውበት ሳሎን' : 'Eyob Beauty Salon');
  const branchAddress = booking?.branch?.addressLine || (isAm ? 'አዲስ አበባ' : 'Addis Ababa');

  const dateFormatted = firstItem?.startTime
    ? new Date(firstItem.startTime).toLocaleDateString(isAm ? 'am-ET' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : isAm ? 'የተረጋገጠ ቀን' : 'Confirmed Schedule';

  const timeFormatted = firstItem?.startTime
    ? new Date(firstItem.startTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' (EAT)'
    : isAm ? 'የተረጋገጠ ሰዓት' : 'Confirmed Window';

  const totalAmount = Number(booking?.totalAmount || firstItem?.priceSnapshot || 0);
  const depositPaid = Number(booking?.depositPaid || booking?.depositAmount || 0);
  const balanceDue = Math.max(0, totalAmount - depositPaid);

  const customerDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || user?.phone || '';

  const customerInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-[#0E0B09] text-[#FAF7F2] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0E0B09]">
      {/* 1. Header */}
      <header className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-[10px] uppercase tracking-normal font-sans text-stone-400 block -mt-1">{isAm ? 'የውበት ሳሎን' : 'Sanctuary & Spa'}</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <LanguageToggle />

          <Link to="/my-bookings" className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-sm">bookmark_heart</span>
            <span>{isAm ? 'ቀጠሮዎቼ' : 'My Bookings'}</span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-2 pl-3 border-l border-[#2C2724]">
              <Link
                to="/account/profile"
                className="flex items-center gap-2 text-stone-200 hover:text-[#D4AF37] transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#0E0B09] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
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
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {loading ? (
          <div className="py-24 text-center text-stone-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-wider">{isAm ? 'በመጫን ላይ...' : 'Loading confirmation...'}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#181412] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-xl">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#FAF7F2]">
                {isAm ? 'ቀጠሮዎ ተረጋግጧል!' : 'Appointment Confirmed'}
              </h1>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                {isAm ? 'ቀጠሮዎ በተሳካ ሁኔታ ተመዝግቧል' : 'Your ritual reservation is securely booked'}
              </p>
            </div>

            {/* Reference Callout Card */}
            <div className="bg-[#181412] rounded-xl p-5 border border-[#2C2724] shadow-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">
                  {isAm ? 'የቀጠሮ ቁጥር' : 'Booking Reference'}
                </span>
                <span className="text-2xl font-mono font-bold text-[#D4AF37] tracking-wider">{bookingRef}</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded bg-[#0E0B09] hover:bg-[#2C2724] text-xs text-[#FAF7F2] flex items-center gap-1.5 border border-[#D4AF37]/40 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#D4AF37]">content_copy</span>
                <span>{copied ? (isAm ? 'ተቀድቷል!' : 'Copied!') : (isAm ? 'ቁጥሩን ቅዳ' : 'Copy')}</span>
              </button>
            </div>

            {/* Protocol Receipt Dossier */}
            <div className="bg-[#181412] rounded-xl border border-[#2C2724] p-5 lg:p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#FAF7F2]">
                    {isAm ? 'የቀጠሮ ዝርዝር' : 'Ritual Sequence'}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>{booking?.status || 'CONFIRMED'}</span>
                </span>
              </div>

              {/* Branch & Schedule Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-[#0E0B09] border border-[#2C2724]/70 space-y-1">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">{isAm ? 'ቀን እና ሰዓት' : 'Date & Time'}</span>
                  <p className="font-bold text-[#FAF7F2]">{dateFormatted}</p>
                  <p className="text-[#D4AF37] font-medium">{timeFormatted}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0E0B09] border border-[#2C2724]/70 space-y-1">
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">{isAm ? 'ቅርንጫፍ' : 'Branch Location'}</span>
                  <p className="font-bold text-[#FAF7F2]">{branchName}</p>
                  <p className="text-stone-400">{branchAddress}</p>
                </div>
              </div>

              {/* Chronological Services Sequence */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  {isAm ? 'የአገልግሎት ቅደም ተከተል' : 'Service Sequence'}
                </span>
                {items.map((it, idx) => {
                  const serviceName =
                    it.snapshotServiceName ||
                    (isAm && it.service?.amharicName ? it.service.amharicName : it.service?.name) ||
                    it.serviceTitleSnapshot ||
                    (isAm ? 'አገልግሎት' : 'Service');

                  const specialistName =
                    it.snapshotEmployeeName ||
                    (it.employee ? `${it.employee.firstName} ${it.employee.lastName || ''}`.trim() : null) ||
                    (isAm ? 'ባለሙያ' : 'Specialist');

                  const price = it.snapshotPrice ?? it.priceSnapshot ?? 0;
                  const duration = it.snapshotDurationMinutes ?? it.durationSnapshot ?? 60;

                  return (
                    <div
                      key={it.id || idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0E0B09] border border-[#2C2724]/70 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#181412] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-serif font-bold text-[#FAF7F2] text-sm">{serviceName}</div>
                          <div className="text-[11px] text-stone-400">
                            {specialistName} • {duration} {isAm ? 'ደቂቃ' : 'Mins'}
                          </div>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-[#D4AF37]">
                        {Number(price).toLocaleString()} ETB
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Ledger Summary */}
              <div className="pt-4 border-t border-[#2C2724] space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span>{isAm ? 'ጠቅላላ ሂሳብ' : 'Total Amount'}</span>
                  <span className="font-mono text-[#FAF7F2]">{totalAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>{isAm ? 'የተከፈለ ተቀማጭ' : 'Deposit Paid'}</span>
                  <span className="font-mono text-emerald-400">- {depositPaid.toLocaleString()} ETB</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2C2724] font-bold text-sm">
                  <span className="text-[#FAF7F2]">{isAm ? 'ቀሪ ሂሳብ' : 'Balance Due'}</span>
                  <span className="font-mono text-[#D4AF37] text-base">{balanceDue.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            {/* Next Actions (Strictly 1-2 words per button) */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/my-bookings"
                className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">bookmark_heart</span>
                <span>{isAm ? 'ቀጠሮዎቼ' : 'My Bookings'}</span>
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-[#181412] hover:bg-[#2C2724] text-[#FAF7F2] border border-[#2C2724] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>{isAm ? 'አትም' : 'Print'}</span>
              </button>

              <Link
                to="/book"
                className="px-5 py-2.5 rounded-xl bg-[#0E0B09] hover:bg-[#181412] text-[#FAF7F2] border border-[#2C2724] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>{isAm ? 'አዲስ ያዝ' : 'Book Again'}</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingConfirmationPage;
