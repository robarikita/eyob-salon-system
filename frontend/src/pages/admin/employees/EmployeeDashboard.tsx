import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, DashboardMetrics } from '../../../api/employeeApi';

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isGlobalOwner, setIsGlobalOwner] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_session' | 'available'>('all');

  useEffect(() => {
    employeeApi.getDashboardMetrics(selectedBranch).then(setMetrics);
  }, [selectedBranch]);

  const scheduleMatrix = [
    {
      id: 'emp-101',
      name: 'Sara Ahmed',
      role: 'Senior Hair Stylist',
      branch: 'Bole Bulbula',
      bookings: '6 Sessions',
      bookingsSub: '(4 Completed)',
      status: 'In Session',
      statusClass: 'bg-primary-fixed text-on-primary-fixed-variant font-bold',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBU2AymHfKPXZ63YfZfFN9NdbQRjCCpgSPZns2jF3xGMTle1BHKlLCkgWvs5vceQwZmBKAqi7ZPIboCv4UUVdjYI6dSSJPPXp498jO_Qb6A8lYJm2x8l-b3A6biLZaPMSCuwhC8v54f_NGuLP80INHzrsLy3WnL5kGzvTqjByYiAGsUlTH1YripFkGrXLZX9lcLM7WN--W763YjdaKRUAVKL4WMXbqcnuISetGmZsRD',
    },
    {
      id: 'emp-102',
      name: 'Helen T.',
      role: 'Master Makeup Artist',
      branch: 'Kazanchis',
      bookings: '5 Sessions',
      bookingsSub: '(Next at 15:30)',
      status: 'Available',
      statusClass: 'bg-surface-container-high text-on-surface-variant font-semibold',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBToyMfSMRkx7YxBcNf5lnVOGxiAzbCIaX0Q0MvXmnjo7dO-YBAXr7R8yszd3UfhiNagZ_DZMoXEfJ9pSanPasVQZAzJxqkU4-wgKhWv4gGIY-_fEmJYjAtM-RKZO6DcX9yAu7KYq20IrL34mBWsarHmeBCXbocbeN3UaseKIpanuRYf8mvddq2Il6TXrVWKIcxn8SlLBzaeaLBiYN46J_S5hMP7LuoTXkgQrxyX6TP',
    },
    {
      id: 'emp-103',
      name: 'Tigist G.',
      role: 'Nail Specialist',
      branch: 'Bole Bulbula',
      bookings: '4 Sessions',
      bookingsSub: '(Resume 14:45)',
      status: 'On Break',
      statusClass: 'bg-secondary-container text-on-secondary-container',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAaJ7wXmFO8c0d8ucHkt3EVQ1yJsgOdaMYW3L7PpuoVyJZRT8IvNAjrJGB0oGmYr5_bT2PEEB7d2DXjTTcLL53N62F9iyEjjxT0EUsh-mYwx8-Y3PMCrV9yjB39ZS__4k0wX3td8V0f6AgiLbPIPbZ-beIcaR5-wKfOPeji-xQB1ffcxyEhnepEbfBD35aM1-nuwj2I2KUuPUh3-9PgLmhnGPG2ZL6lXKABPhTiDoqr',
    },
    {
      id: 'emp-104',
      name: 'Bethel Alemu',
      role: 'Senior Colorist',
      branch: 'CMC Branch',
      bookings: '7 Sessions',
      bookingsSub: '(Balayage Suite)',
      status: 'In Session',
      statusClass: 'bg-primary-fixed text-on-primary-fixed-variant font-bold',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD_CmRw2f9aonM_wGWTYvOhvbT7Q9VQCwY24nMwhMkQpV4WeiIBoQmiR6HvTXgOl7ROZIgK-O4tHe2D_tXiYcqpG7Fw_pZV0usew4_TLocvxOjy2WGdHR9h4HxGv5W1eC5nwk66Uwn2a7aBC3blaumthryW80VzAIu5Kep2roCqVT54hdkN7GvRr1qLWaxn9znXJGGBrnMBlIwIFj8Iaudz855hd9EvIJ6FcM2Tun3x',
    },
  ];

  const filteredMatrix = scheduleMatrix.filter((item) => {
    if (statusFilter === 'in_session') return item.status === 'In Session';
    if (statusFilter === 'available') return item.status === 'Available';
    return true;
  });

  return (
    <AdminLayout selectedBranch={selectedBranch} onBranchChange={setSelectedBranch}>
      <div className="space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Top Editorial Header & Scope Switcher */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Personnel &amp; Talent Sanctuary</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight font-medium">
              Staff &amp; Specialists Overview
            </h1>
            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              Staff allocation, real-time specialist presence, performance metrics, and multi-branch roster controls across Addis Ababa.
            </p>
          </div>

          {/* Scope Switcher Control */}
          <div className="bg-surface-container-low p-2 rounded-xl flex flex-wrap items-center gap-2 self-start xl:self-auto shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm text-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span className="text-secondary">Viewing as:</span>
              <span className="font-bold text-on-surface">
                {isGlobalOwner ? 'Global Owner (Cross-Branch)' : 'Bole Admin'}
              </span>
            </div>
            <button
              onClick={() => setIsGlobalOwner(!isGlobalOwner)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-variant transition-colors text-xs text-secondary hover:text-on-surface"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">swap_horiz</span>
              <span>{isGlobalOwner ? 'Switch to Bole Admin' : 'Switch to Global Owner'}</span>
            </button>
          </div>
        </div>

        {/* KPI Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                  Total Active Specialists
                </span>
                <span className="p-1.5 rounded-lg bg-surface-container-low text-primary material-symbols-outlined text-[18px]">
                  group
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-on-surface">
                  {metrics?.totalActiveSpecialists || 45}
                </span>
                <span className="text-xs text-secondary font-medium">/ 3 sanctuaries</span>
              </div>
              <p className="mt-1 text-xs text-secondary">
                22 Hair &amp; Couture, 12 Makeup, 8 Nails, 3 Lead Aestheticians
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-surface-container-low flex items-center gap-1 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>+4.2% vs last month</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                  On Duty Today
                </span>
                <span className="p-1.5 rounded-lg bg-surface-container-low text-primary material-symbols-outlined text-[18px]">
                  badge
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-on-surface">
                  {metrics?.onDutyToday || 34}
                </span>
                <span className="text-xs text-secondary font-semibold">Active In-House</span>
              </div>
              <p className="mt-1 text-xs text-secondary">
                8 On Scheduled Break • 3 Approved Leave
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-surface-container-low flex items-center justify-between text-xs">
              <span className="text-secondary">Attendance Rate</span>
              <span className="font-bold bg-surface-container-low px-2 py-0.5 rounded text-primary">
                96% Target
              </span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                  Utilization &amp; Capacity
                </span>
                <span className="p-1.5 rounded-lg bg-surface-container-low text-primary material-symbols-outlined text-[18px]">
                  donut_large
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-on-surface">
                  {metrics?.utilizationRate || 88}%
                </span>
                <span className="text-xs text-primary font-bold">Peak Demand</span>
              </div>
              <p className="mt-1 text-xs text-secondary">
                Critical load: Bole Bulbula &amp; Kazanchis Suites
              </p>
            </div>
            <div className="mt-4 pt-2 w-full bg-surface-container-low rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-700"
                style={{ width: `${metrics?.utilizationRate || 88}%` }}
              />
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between relative">
            <div className="absolute right-0 top-0 w-1.5 h-full bg-primary-container rounded-r-2xl" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                  Staff Commission &amp; Rev
                </span>
                <span className="p-1.5 rounded-lg bg-surface-container-low text-primary material-symbols-outlined text-[18px]">
                  payments
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-on-surface">
                  {(metrics?.totalCommissionPool || 184500).toLocaleString()}{' '}
                  <span className="text-sm font-normal text-secondary">ETB</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-secondary">
                Distributed pool for current billing cycle
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-surface-container-low flex items-center justify-between text-xs">
              <span className="text-secondary">Lead Performer:</span>
              <span className="font-bold text-primary">Sara Ahmed</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout (8 cols + 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Branch Distribution Breakdown & Quick Actions */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-on-surface">
                    Branch Staff Distribution &amp; Activity
                  </h2>
                  <p className="text-xs text-secondary">
                    Synchronized coverage quotas per sanctuary facility
                  </p>
                </div>

                {/* Quick Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate('/admin/employees/add')}
                    className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>+ Add Employee</span>
                  </button>
                </div>
              </div>

              {/* Branch Distribution Mini-Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="bg-surface-container-low p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        Bole Bulbula
                      </span>
                      <div className="font-serif text-xl text-on-surface font-bold mt-0.5">
                        18 Specialists
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-secondary">
                      <span>Occupancy</span>
                      <span className="font-bold text-on-surface">94%</span>
                    </div>
                    <div className="w-full bg-surface-variant rounded-full h-1">
                      <div className="bg-primary h-full rounded-full w-[94%]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-secondary">14 Present • 3 On Break • 1 Leave</p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        Kazanchis
                      </span>
                      <div className="font-serif text-xl text-on-surface font-bold mt-0.5">
                        15 Specialists
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-secondary">
                      <span>Occupancy</span>
                      <span className="font-bold text-on-surface">86%</span>
                    </div>
                    <div className="w-full bg-surface-variant rounded-full h-1">
                      <div className="bg-tertiary h-full rounded-full w-[86%]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-secondary">12 Present • 2 On Break • 1 Leave</p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                        CMC Branch
                      </span>
                      <div className="font-serif text-xl text-on-surface font-bold mt-0.5">
                        12 Specialists
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-outline" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-secondary">
                      <span>Occupancy</span>
                      <span className="font-bold text-on-surface">80%</span>
                    </div>
                    <div className="w-full bg-surface-variant rounded-full h-1">
                      <div className="bg-outline h-full rounded-full w-[80%]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-secondary">8 Present • 3 On Break • 1 Leave</p>
                </div>
              </div>
            </div>

            {/* Today's Specialists Schedule Matrix */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container-low">
                <div>
                  <h2 className="font-serif text-xl font-bold text-on-surface">
                    Today's Specialists Schedule Matrix
                  </h2>
                  <p className="text-xs text-secondary">
                    Live session allocation, station availability, and shift engagements
                  </p>
                </div>

                {/* Filter Tags */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-inverse-surface text-primary-fixed-dim font-bold'
                        : 'bg-surface-container-low text-secondary hover:text-on-surface'
                    }`}
                  >
                    All (34)
                  </button>
                  <button
                    onClick={() => setStatusFilter('in_session')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      statusFilter === 'in_session'
                        ? 'bg-inverse-surface text-primary-fixed-dim font-bold'
                        : 'bg-surface-container-low text-secondary hover:text-on-surface'
                    }`}
                  >
                    In Session (21)
                  </button>
                  <button
                    onClick={() => setStatusFilter('available')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      statusFilter === 'available'
                        ? 'bg-inverse-surface text-primary-fixed-dim font-bold'
                        : 'bg-surface-container-low text-secondary hover:text-on-surface'
                    }`}
                  >
                    Available (5)
                  </button>
                </div>
              </div>

              {/* Schedule Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-secondary font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 rounded-l-xl">Specialist</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Today's Bookings</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {filteredMatrix.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface-container"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-on-surface">{item.name}</span>
                              <span className="text-secondary text-[11px]">{item.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface font-medium">
                            {item.branch}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-on-surface">{item.bookings}</span>
                            <span className="text-secondary text-[11px]">{item.bookingsSub}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${item.statusClass}`}>
                            {item.status === 'In Session' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />
                            )}
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/admin/employees/${item.id}`)}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-primary transition-colors"
                              title="View Profile"
                            >
                              <span className="material-symbols-outlined text-[18px]">account_circle</span>
                            </button>
                            <button
                              onClick={() => navigate(`/admin/employees/${item.id}/schedule`)}
                              className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-primary transition-colors"
                              title="Shift Schedule"
                            >
                              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-secondary">
                <span>Showing 4 of 45 registered staff</span>
                <Link
                  to="/admin/employees"
                  className="text-primary hover:text-tertiary font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <span>View Full Staff Directory</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Exceptions & Leave Approval Deck */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-on-surface">Schedule Exceptions</h2>
                  <p className="text-xs text-secondary">3 approvals pending review</p>
                </div>
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">
                  3
                </span>
              </div>

              <div className="space-y-3">
                {/* Request 1 */}
                <div className="p-4 rounded-xl bg-surface-container-low space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        flight_takeoff
                      </span>
                      <div>
                        <h3 className="font-bold text-on-surface">Leave Request (Eid Holiday)</h3>
                        <p className="text-secondary text-[11px]">Tigist G. • Bole Bulbula</p>
                      </div>
                    </div>
                    <span className="text-secondary">3 Days</span>
                  </div>
                  <p className="text-on-surface-variant text-[11px]">
                    Dates: April 10 - 12. Backup cover confirmed with Selamawit K.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 py-1.5 px-3 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-[11px] uppercase font-bold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] uppercase font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>

                {/* Request 2 */}
                <div className="p-4 rounded-xl bg-surface-container-low space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">
                        swap_horiz
                      </span>
                      <div>
                        <h3 className="font-bold text-on-surface">Shift Swap Request</h3>
                        <p className="text-secondary text-[11px]">Sara Ahmed ↔ Rahel M.</p>
                      </div>
                    </div>
                    <span className="text-secondary">Tomorrow</span>
                  </div>
                  <p className="text-on-surface-variant text-[11px]">
                    Trading Saturday 09:00 morning shift for Sunday 14:00 VIP bridal slot.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 py-1.5 px-3 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-[11px] uppercase font-bold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] uppercase font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Performance Spotlight (Obsidian Prestige Card) */}
            <div className="bg-inverse-surface text-inverse-on-surface p-6 rounded-2xl shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-primary-fixed-dim font-bold">
                    Star Talent
                  </span>
                  <h2 className="font-serif text-lg font-bold text-surface-bright mt-0.5">
                    Performance Spotlight
                  </h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-fixed">
                  <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-highest/10 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrssgVnYV-AkL8LcWz12ItHkxXJe6n5UTox9pACjb3CZFPcpl5rOPUx_-KYbx5alzbQZlF5xb7p_ye-7W87uddgCoEF5s3H06Kmr3cP1G9oOQqj01tm8qhunhQGGofunmSFHkg1uAuwmOEQkjcDbyzvcT7A77DyeO8tXWgNHlsFUMND857M_gqeroiBM1Up35XiiKfhmsXFknODElbtPbi4Tmf43jd_XVUnYvHO4VQ"
                    alt="Sara Ahmed"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-serif text-base text-surface-bright font-bold">
                      Sara Ahmed
                    </h3>
                    <p className="text-xs text-surface-variant">Lead Stylist • Bole Bulbula</p>
                  </div>
                </div>

                {/* Spotlight Stats */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-inverse-surface/60 p-2 rounded-lg">
                    <div className="flex items-center justify-center gap-0.5 text-primary-fixed font-bold text-xs">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      <span>4.9/5</span>
                    </div>
                    <span className="text-[10px] text-outline-variant">Rating</span>
                  </div>
                  <div className="bg-inverse-surface/60 p-2 rounded-lg">
                    <span className="font-bold text-surface-bright text-xs">78%</span>
                    <span className="block text-[10px] text-outline-variant">Rebooking</span>
                  </div>
                  <div className="bg-inverse-surface/60 p-2 rounded-lg">
                    <span className="font-bold text-primary-fixed text-xs">42.8k</span>
                    <span className="block text-[10px] text-outline-variant">Gross ETB</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-highest/5 flex items-center gap-2 text-xs text-surface-variant">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]">
                  sync
                </span>
                <span>Synchronized with Branch Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeDashboard;

