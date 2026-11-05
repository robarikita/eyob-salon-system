import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const StaffDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<BookingDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchStaffAgenda = async () => {
    try {
      setLoading(true);
      const list = await bookingApi.getStaffAppointments({
        date: selectedDate,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setAppointments(list);
    } catch (err) {
      console.error('Error fetching staff agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAgenda();
  }, [selectedDate, statusFilter]);

  const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
    try {
      await bookingApi.updateStaffAppointmentStatus(id, { status, reason });
      await fetchStaffAgenda();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for declining this appointment:');
    if (!reason) return;
    try {
      await bookingApi.rejectStaffAppointment(id, reason);
      await fetchStaffAgenda();
    } catch (err: any) {
      alert(err.message || 'Reject failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Staff Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
            EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Staff Floor Portal</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageToggle />

          <Link to="/staff/availability" className="text-stone-300 hover:text-[#D4AF37] flex items-center gap-1.5 text-xs font-semibold transition hidden md:flex">
            <span className="material-symbols-outlined text-sm">event_available</span>
            My Shifts
          </Link>

          {/* Specialist Name & Assigned Workstation Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181412] border border-[#D4AF37]/30 text-xs">
            <span className="material-symbols-outlined text-base text-[#D4AF37]">badge</span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-stone-100 leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : 'Specialist'}
              </span>
              <span className="text-[10px] text-[#D4AF37] leading-none uppercase tracking-wider font-semibold">
                {user?.workstation || 'Floor Specialist'}
              </span>
            </div>
          </div>

          {/* Sign Out Action */}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/staff/login');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-red-900/60 text-red-400 hover:text-red-300 hover:border-red-700 hover:bg-red-950/30 text-xs font-semibold transition flex items-center gap-1"
            title="Sign Out / ውጣ"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span className="hidden sm:inline">Sign Out / ውጣ</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E5E2DD]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">Floor Operations</span>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1C1C19]">Daily Appointments Agenda</h1>
            <p className="text-xs text-stone-500">Manage client arrivals, active salon sessions, and ritual completions.</p>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded bg-white hover:bg-stone-100 border border-[#E5E2DD] text-xs font-bold text-stone-700"
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs p-2 rounded border border-[#E5E2DD] bg-white text-[#1C1C19] font-medium outline-none"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#E5E2DD] pb-2 overflow-x-auto scrollbar-none">
          {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#31302D] text-[#D4AF37] shadow'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {st === 'ALL' ? 'All Queue' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Appointments Feed */}
        {loading ? (
          <div className="py-16 text-center text-sm text-stone-500">Loading daily schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 px-6 bg-white rounded-xl border border-[#E5E2DD] text-center max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-stone-400 block mb-2">calendar_today</span>
            <h3 className="font-serif text-lg font-bold text-[#1C1C19]">No Appointments Scheduled</h3>
            <p className="text-xs text-stone-500 mt-1">There are no client bookings for this specialist on {selectedDate}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const item = apt.items[0];
              const timeStr = item
                ? new Date(item.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '10:00 AM';

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-xl p-5 border border-[#E5E2DD] shadow-sm hover:border-[#D4AF37]/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-[#FAF7F2] border border-[#E5E2DD] flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="material-symbols-outlined text-sm text-[#775A00]">alarm</span>
                      <span className="text-xs font-bold text-[#1C1C19] mt-0.5">{timeStr}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-stone-500">#{apt.bookingNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : apt.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                            : apt.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-300'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-[#1C1C19]">
                        {item?.serviceTitleSnapshot || 'Service Ritual'}
                      </h4>
                      <p className="text-xs text-stone-600">
                        Patron: <strong>{apt.customer?.firstName} {apt.customer?.lastName}</strong> ({apt.customer?.phone || '+251 91 123 4567'})
                      </p>
                      {apt.notes && (
                        <p className="text-[11px] text-[#775A00] italic mt-1 bg-[#FAF7F2] p-1.5 rounded border border-[#E5E2DD]">
                          Note: "{apt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {apt.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}
                          className="px-3 py-1.5 rounded bg-[#31302D] hover:bg-[#1C1C19] text-[#FAF7F2] text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs text-[#D4AF37]">play_arrow</span>
                          Start Session
                        </button>
                        <button
                          onClick={() => handleReject(apt.id)}
                          className="px-3 py-1.5 rounded bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold transition"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {apt.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                        className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">check</span>
                        Mark Completed
                      </button>
                    )}

                    <Link
                      to={`/staff/appointments/${apt.id}`}
                      className="px-3 py-1.5 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#E5E2DD] text-xs font-bold transition flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      Dossier
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDashboardPage;
