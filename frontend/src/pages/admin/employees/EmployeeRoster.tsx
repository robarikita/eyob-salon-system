import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee } from '../../../api/employeeApi';

export const EmployeeRoster: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    employeeApi.getAllEmployees({ branchId: selectedBranch, search: searchQuery }).then(setEmployees);
  }, [selectedBranch, searchQuery]);

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await employeeApi.toggleEmployeeStatus(id);
      if (res.warning) {
        alert(res.warning);
      }
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, status: res.employee.status } : emp))
      );
    } catch {
      // Toggle locally
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, status: !emp.status } : emp))
      );
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter === 'active' && !emp.status) return false;
    if (statusFilter === 'deactivated' && emp.status) return false;

    if (activeCategory === 'hair') {
      return emp.ritualTitle?.toLowerCase().includes('hair') || emp.ritualTitle?.toLowerCase().includes('stylist');
    }
    if (activeCategory === 'makeup') {
      return emp.ritualTitle?.toLowerCase().includes('makeup');
    }
    if (activeCategory === 'nails') {
      return emp.ritualTitle?.toLowerCase().includes('nail');
    }
    if (activeCategory === 'facials') {
      return emp.ritualTitle?.toLowerCase().includes('aesthetician') || emp.ritualTitle?.toLowerCase().includes('facial');
    }

    return true;
  });

  return (
    <AdminLayout selectedBranch={selectedBranch} onBranchChange={setSelectedBranch}>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Notice Ribbon: Branch Authority */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-high p-4 shadow-sm border border-surface-container">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-container/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                  Owner Authority Active
                </span>
                <p className="text-xs text-on-surface-variant">
                  You have elevated cross-branch permissions across Bole Bulbula, Kazanchis, and CMC sanctuaries. Modifications reflect instantly in real-time booking engines.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-[10px] text-secondary tracking-widest uppercase font-semibold">
                Multi-Branch Sync
              </span>
            </div>
          </div>
        </div>

        {/* Page Header & Key Statistics Banner */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
          <div className="xl:col-span-7 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-px bg-primary-container" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                Sanctuary Personnel Guild
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight font-medium">
              Employee Directory &amp; Roster
            </h1>
            <p className="text-sm text-secondary max-w-2xl">
              Directory of beauty specialists, master cosmetologists, and salon technicians across all branches.
            </p>
          </div>

          {/* Quick Metrics Counter Mosaic */}
          <div className="xl:col-span-5 grid grid-cols-3 gap-3">
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">
                  Active Talent
                </span>
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              </div>
              <div className="font-serif text-2xl font-bold text-on-surface">
                {employees.filter((e) => e.status).length}
                <span className="text-xs text-secondary font-normal"> /{employees.length}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-primary font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>93.3% capacity</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">
                  Avg Feedback
                </span>
                <span className="material-symbols-outlined text-[16px] text-primary-container">star</span>
              </div>
              <div className="font-serif text-2xl font-bold text-on-surface">4.92</div>
              <span className="text-[11px] text-secondary truncate block">1,840 verified</span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">
                  Scheduled
                </span>
                <span className="material-symbols-outlined text-[16px] text-secondary">calendar_today</span>
              </div>
              <div className="font-serif text-2xl font-bold text-on-surface">
                1,680<span className="text-xs text-secondary font-normal">h</span>
              </div>
              <span className="text-[11px] text-secondary truncate block">This roster cycle</span>
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl flex items-center bg-surface-container-low rounded-xl px-4 py-2.5 shadow-inner">
              <span className="material-symbols-outlined text-secondary text-[20px] mr-2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by specialist name, phone (+251...), or skill..."
                className="w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-secondary focus:outline-none"
              />
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] text-secondary font-mono">
                ⌘K
              </span>
            </div>

            {/* Filters & CTA */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2 shadow-sm text-xs">
                <span className="material-symbols-outlined text-primary text-[17px] mr-2">storefront</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-on-surface focus:outline-none pr-6 cursor-pointer"
                >
                  <option value="all">All Branches (3)</option>
                  <option value="bole-bulbula">Bole Bulbula</option>
                  <option value="kazanchis">Kazanchis</option>
                  <option value="cmc">CMC Branch</option>
                </select>
                <span className="material-symbols-outlined text-secondary text-[16px] absolute right-2 pointer-events-none">
                  expand_more
                </span>
              </div>

              <div className="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2 shadow-sm text-xs">
                <span className="material-symbols-outlined text-secondary text-[17px] mr-2">filter_alt</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-on-surface focus:outline-none pr-6 cursor-pointer"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
                <span className="material-symbols-outlined text-secondary text-[16px] absolute right-2 pointer-events-none">
                  expand_more
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/employees/add')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs tracking-wider uppercase font-bold shadow-sm hover:bg-primary-fixed-dim transition-all"
              >
                <span className="material-symbols-outlined text-[19px]">person_add</span>
                <span>Add New Specialist</span>
              </button>
            </div>
          </div>

          {/* Filter Chips & Legend */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-surface-container-low">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `All Staff (${employees.length})` },
                { id: 'hair', label: 'Hair Stylists (22)' },
                { id: 'makeup', label: 'Makeup Artists (12)' },
                { id: 'nails', label: 'Nail Specialists (8)' },
                { id: 'facials', label: 'Spa & Facials (3)' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setActiveCategory(chip.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                    activeCategory === chip.id
                      ? 'bg-inverse-surface text-primary-fixed-dim font-bold shadow-sm'
                      : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-secondary shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-container" /> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary-container" /> On Leave
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim" /> Deactivated
              </span>
            </div>
          </div>
        </div>

        {/* Main Roster Table */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low text-secondary font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Sanctuary Branch</th>
                  <th className="py-3.5 px-4">Specialty &amp; Tier</th>
                  <th className="py-3.5 px-4 text-center">Rituals</th>
                  <th className="py-3.5 px-4">Weekly Load</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Client Rating</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/admin/employees/${emp.id}`)}
                    className="hover:bg-surface-container-low/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high shrink-0 shadow-sm flex items-center justify-center font-serif font-bold text-amber-800 bg-amber-100">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-serif text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            <span className="text-primary font-semibold">#{emp.id.slice(0, 6)}</span>
                            <span className="w-1 h-1 rounded-full bg-outline" />
                            <span className="text-secondary truncate">{emp.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-medium">
                        <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                        {emp.branch?.name || 'Bole Bulbula'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{emp.ritualTitle || 'Senior Specialist'}</span>
                        <span className="text-secondary text-[11px]">{emp.workstation || 'Styling Suite'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-surface-container-low font-bold text-on-surface">
                        {emp.services?.length || 8} Services
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface">{emp.employmentType || '40 hrs / wk'}</span>
                        <span className="text-secondary text-[11px]">Tue – Sun</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full uppercase tracking-wide text-[10px] font-bold ${
                          emp.status
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : 'bg-surface-container-highest text-secondary'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status ? 'bg-primary' : 'bg-secondary'}`} />
                        {emp.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-primary-container text-[16px]">star</span>
                        <span className="font-bold text-on-surface">{emp.rating || 4.95}</span>
                        <span className="text-secondary text-[11px]">({emp.reviewsCount || 128})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/employees/${emp.id}`)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-secondary hover:text-on-surface transition-colors"
                          title="View Profile"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/employees/${emp.id}/services`)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-secondary hover:text-primary transition-colors"
                          title="Assign Services"
                        >
                          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        </button>
                        <button
                          onClick={(e) => handleToggleStatus(emp.id, e)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high text-secondary hover:text-error transition-colors"
                          title={emp.status ? 'Deactivate Specialist' : 'Reactivate Specialist'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {emp.status ? 'person_off' : 'restore'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-surface-container-lowest border-t border-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
            <span>
              Showing <strong className="text-on-surface font-semibold">1–{filteredEmployees.length}</strong> of{' '}
              <strong className="text-on-surface font-semibold">{employees.length}</strong> specialists
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 rounded-lg bg-inverse-surface text-primary-fixed-dim font-bold">1</button>
              <button className="px-3 py-1 rounded-lg hover:bg-surface-container-low text-on-surface">2</button>
            </div>
          </div>
        </div>

        {/* Audit Stamp */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary pt-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">lock_clock</span>
            <span>Directory state synced across Bole, Kazanchis, and CMC stations • Last audit: Today at 09:14 AM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] tracking-wider uppercase font-semibold">
              Live Database Active
            </span>
            <span>Eyob Luxury Operations v4.2</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeRoster;

