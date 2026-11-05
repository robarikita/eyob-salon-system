import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';

export const StaffAppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDossier = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await bookingApi.getBookingByIdOrRef(id);
      setBooking(data);
    } catch (err) {
      console.error('Error fetching appointment dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [id]);

  const handleUpdateStatus = async (status: string, reason?: string) => {
    if (!id) return;
    try {
      await bookingApi.updateStaffAppointmentStatus(id, { status, reason });
      await fetchDossier();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = prompt('Please specify rejection reason:');
    if (!reason) return;
    try {
      await bookingApi.rejectStaffAppointment(id, reason);
      await fetchDossier();
    } catch (err: any) {
      alert(err.message || 'Reject failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-sm text-stone-500">
        Loading appointment dossier...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <p className="text-sm font-bold text-stone-700 mb-4">Appointment not found</p>
        <Link to="/staff/dashboard" className="px-4 py-2 rounded bg-[#31302D] text-white text-xs font-bold">
          Return to Agenda
        </Link>
      </div>
    );
  }

  const item = booking.items[0];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Staff Portal</span>
        </Link>
        <Link
          to="/staff/dashboard"
          className="text-stone-300 hover:text-[#D4AF37] text-xs font-semibold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Agenda
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E5E2DD]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-[#775A00] bg-[#FAF7F2] px-2.5 py-1 rounded border border-[#E5E2DD]">
                #{booking.bookingNumber}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                booking.status === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : booking.status === 'IN_PROGRESS'
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                  : booking.status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-800 border border-blue-300'
                  : 'bg-stone-100 text-stone-600'
              }`}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1C1C19]">Appointment Dossier</h1>
          </div>

          {/* Quick Status Action Controls */}
          <div className="flex items-center gap-2">
            {booking.status === 'CONFIRMED' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="px-4 py-2 rounded bg-[#31302D] hover:bg-[#1C1C19] text-[#FAF7F2] text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <span className="material-symbols-outlined text-sm text-[#D4AF37]">play_arrow</span>
                  Start Session
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 rounded bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold transition"
                >
                  Decline
                </button>
              </>
            )}

            {booking.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleUpdateStatus('COMPLETED')}
                className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Complete Ritual
              </button>
            )}
          </div>
        </div>

        {/* Dossier Cards */}
        <div className="space-y-6">
          {/* Card 1: Patron Details */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-2">Patron Identity</span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#181412] text-[#D4AF37] flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40">
                {booking.customer ? `${booking.customer.firstName[0]}${booking.customer.lastName[0]}` : 'PT'}
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C1C19]">
                  {booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}` : 'Patron'}
                </h3>
                <p className="text-xs text-stone-500">Phone: {booking.customer?.phone || '+251 91 123 4567'}</p>
                {booking.customer?.email && <p className="text-xs text-stone-500">Email: {booking.customer.email}</p>}
              </div>
            </div>
          </div>

          {/* Card 2: Service Ritual & Specialist */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-2">Ritual Specification</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C1C19]">{item?.serviceTitleSnapshot}</h3>
                <p className="text-stone-600 mt-1">Duration: {item?.durationSnapshot} Minutes Session</p>
                <p className="text-stone-600">Workstation: {item?.employee?.workstation || 'Private Suite #01'}</p>
              </div>
              <div>
                <span className="text-stone-400 block font-bold uppercase text-[10px]">Assigned Specialist</span>
                <p className="font-bold text-sm text-[#1C1C19]">
                  {item?.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Specialist'}
                </p>
                <p className="text-[#775A00]">{item?.employee?.ritualTitle || 'Senior Artisan'}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Notes & Accommodations */}
          {booking.notes && (
            <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-1">
                Client Accommodations & Requests
              </span>
              <p className="text-xs text-stone-800 bg-[#FAF7F2] p-3 rounded-lg border border-[#E5E2DD]">
                "{booking.notes}"
              </p>
            </div>
          )}

          {/* Card 4: Ledger & Balances */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-3">Treasury Overview</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Total Ritual Investment</span>
                <span className="font-bold">{Number(booking.totalAmount).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Advance Security Deposit Paid</span>
                <span className="text-emerald-700 font-bold">- {Number(booking.depositPaid).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE9] text-sm font-bold text-[#1C1C19]">
                <span>Remaining Balance Due</span>
                <span className="text-base text-[#775A00]">{Number(booking.balanceDue).toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffAppointmentDetailPage;
