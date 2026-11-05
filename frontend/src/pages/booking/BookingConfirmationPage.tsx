import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';

export const BookingConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!reference) return;
      try {
        const data = await bookingApi.getBookingByIdOrRef(reference);
        setBooking(data);
      } catch {
        // Fallback demo state if backend record was created in memory / offline
      }
    }
    loadBooking();
  }, [reference]);

  const bookingRef = booking?.bookingNumber || reference || 'BK-1082';

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/my-bookings" className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-sm">bookmark_heart</span>
            My Bookings
          </Link>
        </div>
      </header>

      {/* Main Confirmation Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {/* Banner */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#181412] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="material-symbols-outlined text-3xl">verified</span>
          </div>
          <span className="text-xs uppercase tracking-widest text-[#775A00] font-bold block mb-1">Reservation Sealed</span>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#1C1C19] mb-2">Your Appointment is Confirmed!</h1>
          <p className="text-xs text-stone-600 max-w-lg mx-auto">
            We look forward to welcoming you to the sanctuary. An ethereal curation of aesthetic care awaits you.
          </p>
        </div>

        {/* Reference Callout Card */}
        <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] mb-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block mb-0.5">Official Booking Reference</span>
            <span className="text-2xl font-mono font-bold text-[#D4AF37] tracking-wider">{bookingRef}</span>
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded bg-[#2C2724] hover:bg-[#3E342F] text-xs text-[#FAF7F2] flex items-center gap-2 border border-[#D4AF37]/40 transition"
          >
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">content_copy</span>
            {copied ? 'Copied to Clipboard!' : 'Copy Reference'}
          </button>
        </div>

        {/* Official Protocol Receipt Dossier */}
        <div className="bg-white rounded-xl border border-[#E5E2DD] p-6 lg:p-8 shadow-sm space-y-6 mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0EDE9]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block">Official Protocol</span>
              <h2 className="font-serif text-xl font-bold text-[#1C1C19]">Service Dossier & Ritual Schedule</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              Confirmed • Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Selected Ritual</span>
                <p className="text-base font-serif font-bold text-[#1C1C19]">Bridal Hair & Haute Couture Updo</p>
                <p className="text-xs text-stone-500 font-serif">የሙሽራ የፀጉር አሰራር</p>
                <p className="text-stone-600 mt-1">90 Minutes Active Session • Private Suite Reserve</p>
              </div>

              <div>
                <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Artisan Specialist</span>
                <p className="font-bold text-sm text-[#1C1C19]">Sara Ahmed</p>
                <p className="text-[#775A00]">Senior Stylist & Bridal Artisan</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Date & Horizon</span>
                <p className="font-bold text-sm text-[#1C1C19]">Wednesday, Nov 18, 2026</p>
                <p className="text-[#775A00] font-medium">10:30 AM – 12:00 PM (EAT)</p>
                <p className="text-[11px] text-stone-500">East Africa Time (UTC+3)</p>
              </div>

              <div>
                <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Sanctuary Suite</span>
                <p className="font-bold text-sm text-[#1C1C19]">Bole Bulbula Sanctuary</p>
                <p className="text-stone-600">Morning Star Mall, 3rd Floor Private Wing</p>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="pt-6 border-t border-[#F0EDE9]">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block mb-3">Ledger & Settlement</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Haute Bridal Styling Full Tariff</span>
                <span className="font-medium">1,200 ETB</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Advance Security Deposit (Hold Secured)</span>
                <span className="text-[#775A00] font-bold">- 300 ETB</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE9] text-sm font-bold text-[#1C1C19]">
                <span>Balance Due at Reception</span>
                <span className="text-base text-[#775A00]">900 ETB</span>
              </div>
              <p className="text-[10px] text-stone-500">Payable via Cash, CBE, or Telebirr upon completion at Sanctuary Reception.</p>
            </div>
          </div>
        </div>

        {/* Next Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/my-bookings"
            className="w-full sm:w-auto px-6 py-3 rounded bg-[#31302D] hover:bg-[#1C1C19] text-[#FAF7F2] text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm text-[#D4AF37]">bookmark_heart</span>
            View in My Bookings
          </Link>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 rounded bg-white hover:bg-[#F0EDE9] text-[#1C1C19] border border-[#E5E2DD] text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print Receipt
          </button>

          <Link
            to="/book"
            className="w-full sm:w-auto px-6 py-3 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">spa</span>
            Return to Ritual Menu
          </Link>
        </div>
      </main>
    </div>
  );
};

export default BookingConfirmationPage;
