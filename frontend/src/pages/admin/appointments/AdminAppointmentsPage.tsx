import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { bookingApi, BookingDTO } from '../../../api/bookingApi';

export const AdminAppointmentsPage: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState<BookingDTO[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Inspector dock selected appointment
  const [inspectTarget, setInspectTarget] = useState<BookingDTO | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getAdminAppointments({
        branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
        date: selectedDate || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setAppointments(res.appointments);
      setCounts(res.counts);
      if (res.appointments.length > 0) {
        setInspectTarget((prev) => {
          if (!prev) return res.appointments[0];
          const found = res.appointments.find((a) => a.id === prev.id);
          return found || res.appointments[0];
        });
      }
    } catch (err) {
      console.error('Error fetching admin appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedBranch, selectedDate, statusFilter]);

  const handleLiveSync = async () => {
    setSyncing(true);
    await fetchAppointments();
    setTimeout(() => setSyncing(false), 700);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await bookingApi.updateAdminAppointmentStatus(id, { status });
      await fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <AdminLayout
      selectedBranch={selectedBranch}
      onBranchChange={setSelectedBranch}
      activePath="/admin/appointments"
    >
      <div className="space-y-6">
        {/* Top Header Console Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DD]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest text-[#775A00] font-bold">
                Executive Master Schedule
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#181412] text-[#D4AF37] border border-[#D4AF37]/40">
                Multi-Branch Real-Time
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1C1C19]">
              Sanctuary Appointments & Reservations Console
            </h1>
            <p className="text-xs text-stone-500">
              Master schedule, multi-branch appointment records, deposit settlements, and suite allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLiveSync}
              className="px-3.5 py-2 rounded bg-white hover:bg-stone-50 text-stone-700 border border-[#E5E2DD] text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <span className={`material-symbols-outlined text-sm text-[#775A00] ${syncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              Live Sync
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded bg-white hover:bg-stone-50 text-stone-700 border border-[#E5E2DD] text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print List
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-lg p-3.5 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">Total Scheduled</span>
            <span className="text-2xl font-serif font-bold text-[#1C1C19]">{counts.total}</span>
          </div>
          <div className="bg-white rounded-lg p-3.5 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold block">Confirmed</span>
            <span className="text-2xl font-serif font-bold text-emerald-800">{counts.confirmed}</span>
          </div>
          <div className="bg-white rounded-lg p-3.5 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold block">In Progress</span>
            <span className="text-2xl font-serif font-bold text-amber-800">{counts.inProgress}</span>
          </div>
          <div className="bg-white rounded-lg p-3.5 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-blue-700 font-bold block">Completed</span>
            <span className="text-2xl font-serif font-bold text-blue-800">{counts.completed}</span>
          </div>
          <div className="bg-white rounded-lg p-3.5 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-red-700 font-bold block">Rejected</span>
            <span className="text-2xl font-serif font-bold text-red-800">{counts.rejected}</span>
          </div>
          <div className="bg-white rounded-lg p-3.5 border border-[#E5E2DD] shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">Cancelled</span>
            <span className="text-2xl font-serif font-bold text-stone-700">{counts.cancelled}</span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E2DD] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#31302D] text-[#D4AF37] shadow-sm'
                    : 'bg-[#F0EDE9] text-stone-600 hover:bg-[#E5E2DD]'
                }`}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search & Date Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined text-xs absolute left-2.5 top-2.5 text-stone-400">search</span>
              <input
                type="text"
                placeholder="Search ref or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAppointments()}
                className="text-xs pl-8 pr-3 py-1.5 rounded border border-[#E5E2DD] outline-none w-44"
              />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs p-1.5 rounded border border-[#E5E2DD] outline-none"
            />
          </div>
        </div>

        {/* Master Schedule Grid + Inspector Dock Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E5E2DD] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] text-stone-500 font-bold border-b border-[#E5E2DD] uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Patron Details</th>
                    <th className="py-3 px-4">Service Ritual</th>
                    <th className="py-3 px-4">Specialist</th>
                    <th className="py-3 px-4">Tariff</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE9]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-500">Loading master records...</td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-500">No appointments found matching filter criteria.</td>
                    </tr>
                  ) : (
                    appointments.map((apt) => {
                      const item = apt.items[0];
                      const isInspected = inspectTarget?.id === apt.id;
                      const timeStr = item
                        ? new Date(item.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '10:00 AM';

                      return (
                        <tr
                          key={apt.id}
                          onClick={() => setInspectTarget(apt)}
                          className={`cursor-pointer transition ${
                            isInspected ? 'bg-[#FAF7F2] ring-1 ring-[#D4AF37]/50' : 'hover:bg-stone-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#775A00]">#{apt.bookingNumber}</span>
                            <span className="block text-[11px] text-stone-400">{timeStr}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-[#1C1C19] block">
                              {apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : 'Patron'}
                            </span>
                            <span className="text-stone-500 text-[11px]">{apt.customer?.phone || '+251 91 123 4567'}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-[#1C1C19] block">{item?.serviceTitleSnapshot}</span>
                            <span className="text-stone-400 text-[11px]">{item?.durationSnapshot || 60}m Active</span>
                          </td>

                          <td className="py-3 px-4 font-medium text-stone-700">
                            {item?.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Unassigned'}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-[#1C1C19] block">{Number(apt.totalAmount).toLocaleString()} ETB</span>
                            <span className="text-emerald-700 text-[10px] font-semibold">{Number(apt.depositPaid).toLocaleString()} ETB Paid</span>
                          </td>

                          <td className="py-3 px-4">
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
                          </td>

                          <td className="py-3 px-4 text-right">
                            {apt.status === 'CONFIRMED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(apt.id, 'IN_PROGRESS');
                                }}
                                className="px-2 py-1 rounded bg-[#31302D] hover:bg-black text-[#D4AF37] text-[11px] font-bold"
                              >
                                Start
                              </button>
                            )}
                            {apt.status === 'IN_PROGRESS' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(apt.id, 'COMPLETED');
                                }}
                                className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Record Inspector Dock (4 cols) */}
          <div className="lg:col-span-4">
            {inspectTarget ? (
              <div className="bg-[#181412] text-[#FAF7F2] rounded-xl p-6 border border-[#2C2724] shadow-xl sticky top-24 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block mb-0.5">
                      Inspector Live Focus
                    </span>
                    <span className="font-mono text-lg font-bold text-[#FAF7F2]">#{inspectTarget.bookingNumber}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    inspectTarget.status === 'CONFIRMED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                      : inspectTarget.status === 'IN_PROGRESS'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500'
                      : 'bg-stone-800 text-stone-300'
                  }`}>
                    {inspectTarget.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Patron Box */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2C2724] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#D4AF37]/40">
                    {inspectTarget.customer ? `${inspectTarget.customer.firstName[0]}${inspectTarget.customer.lastName[0]}` : 'PT'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#FAF7F2]">
                      {inspectTarget.customer ? `${inspectTarget.customer.firstName} ${inspectTarget.customer.lastName}` : 'Patron'}
                    </h4>
                    <p className="text-xs text-stone-400">{inspectTarget.customer?.phone || '+251 91 123 4567'}</p>
                  </div>
                </div>

                {/* Ritual & Specialist Details */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Selected Ritual</span>
                    <p className="font-serif font-bold text-sm text-[#FAF7F2]">
                      {inspectTarget.items[0]?.serviceTitleSnapshot}
                    </p>
                    <p className="text-stone-400">{inspectTarget.items[0]?.durationSnapshot} Mins Active Session</p>
                  </div>

                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Lead Specialist</span>
                    <p className="font-bold text-[#FAF7F2]">
                      {inspectTarget.items[0]?.employee
                        ? `${inspectTarget.items[0].employee.firstName} ${inspectTarget.items[0].employee.lastName}`
                        : 'Unassigned'}
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Sanctuary Suite</span>
                    <p className="font-bold text-[#D4AF37]">{inspectTarget.branch?.name}</p>
                    <p className="text-stone-400">{inspectTarget.items[0]?.employee?.workstation || 'Private Suite #01'}</p>
                  </div>

                  {inspectTarget.notes && (
                    <div>
                      <span className="text-stone-400 block mb-0.5 font-bold uppercase text-[10px]">Patron Notes</span>
                      <p className="text-stone-300 italic bg-[#2C2724] p-2 rounded text-[11px]">
                        "{inspectTarget.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="pt-4 border-t border-[#2C2724] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Total Tariff</span>
                    <span>{Number(inspectTarget.totalAmount).toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Deposit Paid</span>
                    <span className="text-[#D4AF37] font-bold">- {Number(inspectTarget.depositPaid).toLocaleString()} ETB</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#2C2724] text-sm font-bold text-[#FAF7F2]">
                    <span>Remaining Balance</span>
                    <span className="text-[#D4AF37]">{Number(inspectTarget.balanceDue).toLocaleString()} ETB</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {inspectTarget.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(inspectTarget.id, 'IN_PROGRESS')}
                      className="w-full py-2.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] font-bold text-xs uppercase tracking-wider transition"
                    >
                      Start Session
                    </button>
                  )}
                  {inspectTarget.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(inspectTarget.id, 'COMPLETED')}
                      className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition"
                    >
                      Mark Session Complete
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="w-full py-2 rounded bg-[#2C2724] hover:bg-[#3E342F] text-stone-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-xs">print</span>
                    Print Thermal Slip
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#181412] text-stone-400 rounded-xl p-8 border border-[#2C2724] text-center text-xs">
                Select an appointment from the master grid to open the live record inspector.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAppointmentsPage;
