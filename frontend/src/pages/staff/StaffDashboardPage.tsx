import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { staffApi, Employee } from '../../api/employeeApi';
import { bookingApi } from '../../api/bookingApi';

export const StaffDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === 'am';

  const [profile, setProfile] = useState<Employee | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<{ schedules: any[]; exceptions: any[] }>({
    schedules: [],
    exceptions: [],
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadFloorData = async () => {
    try {
      setLoading(true);
      const [emp, apts, sched] = await Promise.all([
        staffApi.getMe().catch(() => null),
        staffApi.getAppointments({ date: selectedDate, status: statusFilter !== 'ALL' ? statusFilter : undefined }).catch(() => []),
        staffApi.getSchedule().catch(() => ({ schedules: [], exceptions: [] })),
      ]);
      setProfile(emp);
      setAppointments(apts || []);
      setScheduleData(sched || { schedules: [], exceptions: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFloorData();
  }, [selectedDate, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await bookingApi.updateStaffAppointmentStatus(id, { status: newStatus });
      await loadFloorData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt(isAm ? 'የመሰረዣ ምክንያት፡' : 'Reason for rejection:');
    if (!reason) return;
    try {
      await bookingApi.rejectStaffAppointment(id, reason);
      await loadFloorData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user
    ? `${user.firstName} ${user.lastName}`
    : isAm
    ? 'ባለሙያ'
    : 'Specialist';

  const displayBranch = profile?.branch?.name || (user as any)?.branch?.name || 'Sanctuary';
  const displayTitle = profile?.ritualTitle || (profile as any)?.title || 'Specialist';

  const qualifiedServices = profile?.services || [];

  return (
    <div className="min-h-screen bg-[#0E0B09] text-[#FAF7F2] flex flex-col font-sans">
      {/* Staff Header */}
      <header className="bg-[#181412] border-b border-[#2C2724] px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-serif font-bold text-[#D4AF37] tracking-wider">
            EYOB <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans ml-1">Staff</span>
          </Link>

          {/* Branch Badge */}
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#0E0B09] border border-[#D4AF37]/30 text-[10px] text-[#D4AF37] font-semibold">
            {displayBranch}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          {/* Staff Identity Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0E0B09] border border-[#2C2724] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-[#FAF7F2] leading-tight text-xs">
                {displayName}
              </span>
              <span className="text-[10px] text-[#D4AF37] font-medium leading-none">
                {displayTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/staff/login');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition flex items-center gap-1"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="hidden sm:inline">{isAm ? 'ውጣ' : 'Logout'}</span>
          </button>
        </div>
      </header>

      {/* Main Floor */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2724]">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#FAF7F2]">
              {isAm ? 'የቀን ቀጠሮዎች' : 'Daily Appointments'}
            </h1>
            <span className="text-xs text-stone-400">
              {appointments.length} {isAm ? 'ቀጠሮዎች' : 'Appointments'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded bg-[#181412] hover:bg-[#231E1B] border border-[#2C2724] text-xs font-bold text-[#D4AF37]"
            >
              {isAm ? 'ዛሬ' : 'Today'}
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#181412] border border-[#2C2724] text-xs rounded px-2.5 py-1.5 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#D4AF37] text-[#0E0B09]'
                  : 'bg-[#181412] text-stone-400 hover:text-[#FAF7F2] border border-[#2C2724]'
              }`}
            >
              {st === 'ALL'
                ? isAm
                  ? 'ሁሉም'
                  : 'All'
                : st === 'CONFIRMED'
                ? isAm
                  ? 'የተረጋገጡ'
                  : 'Confirmed'
                : st === 'IN_PROGRESS'
                ? isAm
                  ? 'በሂደት ላይ'
                  : 'In Progress'
                : st === 'COMPLETED'
                ? isAm
                  ? 'የተጠናቀቁ'
                  : 'Completed'
                : isAm
                ? 'ውድቅ'
                : 'Rejected'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments Feed (2 Columns) */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <div className="py-16 text-center text-xs text-stone-400">
                {isAm ? 'በመጫን ላይ...' : 'Loading appointments...'}
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-[#181412] p-8 rounded-xl border border-[#2C2724] text-center text-xs text-stone-500">
                <span className="material-symbols-outlined text-3xl text-stone-600 block mb-2">
                  event_busy
                </span>
                {isAm ? 'ምንም ቀጠሮ የለም' : 'No appointments scheduled'}
              </div>
            ) : (
              appointments.map((apt) => {
                const item = apt.items?.[0];
                const startTime = item ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                const endTime = item ? new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
                const customerName = apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : (apt.guestName || 'Client');
                const serviceName = item?.snapshotServiceName || item?.service?.name || item?.serviceTitleSnapshot || 'Service';

                return (
                  <div
                    key={apt.id}
                    className="bg-[#181412] p-4 rounded-xl border border-[#2C2724] space-y-3 hover:border-stone-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#D4AF37]">
                          {startTime} – {endTime}
                        </span>
                        <span className="text-[10px] text-stone-500">#{apt.bookingReference || apt.id.slice(0, 8)}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === 'CONFIRMED'
                            ? 'bg-amber-950 text-[#D4AF37] border border-[#D4AF37]/40'
                            : apt.status === 'IN_PROGRESS'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : apt.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#FAF7F2]">{customerName}</div>
                        <div className="text-[11px] text-stone-400">{serviceName}</div>
                      </div>

                      {apt.customer?.phone && (
                        <div className="text-right text-stone-400 font-mono text-[11px]">
                          {apt.customer.phone}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#2C2724] flex items-center justify-end gap-2 text-xs">
                      {apt.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}
                            className="px-3 py-1 rounded bg-[#D4AF37] text-[#0E0B09] font-bold text-[11px] hover:bg-[#b89528] transition"
                          >
                            {isAm ? 'ጀምር' : 'Start'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(apt.id)}
                            className="px-2.5 py-1 rounded border border-red-900/50 text-red-400 text-[11px] hover:bg-red-950/40 transition"
                          >
                            {isAm ? 'እምቢ' : 'Decline'}
                          </button>
                        </>
                      )}

                      {apt.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 transition"
                        >
                          {isAm ? 'ጨርስ' : 'Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Sidebar: Qualified Services & My Schedule (1 Column) */}
          <div className="space-y-4">
            {/* Qualified Services Widget */}
            <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  {isAm ? 'ብቁ አገልግሎቶች' : 'Qualified Skills'}
                </h3>
                <span className="text-[10px] text-stone-400">
                  {qualifiedServices.length}
                </span>
              </div>

              {qualifiedServices.length === 0 ? (
                <div className="text-xs text-stone-500 italic">
                  {isAm ? 'ምንም አገልግሎት አልተመደበም' : 'No skills assigned'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {qualifiedServices.map((qs: any) => (
                    <span
                      key={qs.id || qs.serviceId}
                      className="px-2 py-1 rounded bg-[#0E0B09] border border-[#2C2724] text-[11px] text-stone-300 font-medium"
                    >
                      {qs.service?.name || qs.service?.title || 'Service'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* My Weekly Schedule Widget */}
            <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  {isAm ? 'የፈረቃ መርሃግብር' : 'My Schedule'}
                </h3>
                <span className="text-[10px] text-stone-400">
                  7 {isAm ? 'ቀናት' : 'Days'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => {
                  const shift = scheduleData.schedules.find((s: any) => s.dayOfWeek === idx);
                  const isWorking = shift ? shift.isWorking : idx !== 1;
                  return (
                    <div
                      key={dayName}
                      className="flex items-center justify-between py-1 border-b border-[#2C2724]/50"
                    >
                      <span className="font-semibold text-stone-300">{dayName}</span>
                      {isWorking ? (
                        <span className="font-mono text-stone-400 text-[11px]">
                          {shift?.startTime || '08:30'} - {shift?.endTime || '17:30'}
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[11px] italic">
                          {isAm ? 'ዕረፍት' : 'Off'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboardPage;
