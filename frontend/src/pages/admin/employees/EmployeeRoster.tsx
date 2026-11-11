import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee } from '../../../api/employeeApi';
import { branchApi, BranchDTO } from '../../../api/branchApi';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useBranchFilter } from '../../../context/BranchFilterContext';

export const EmployeeRoster: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { selectedBranchId, setSelectedBranchId, effectiveBranchId } = useBranchFilter();
  const isAm = language === 'am';

  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    branchApi.listBranches().then(setBranches).catch(() => {});
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const effectiveBranch = isBranchAdmin ? user?.branchId : effectiveBranchId;
      const list = await employeeApi.getAllEmployees({
        branchId: effectiveBranch || undefined,
        search: searchQuery.trim() || undefined,
      });
      setEmployees(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [effectiveBranchId, searchQuery, user?.branchId]);

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await employeeApi.toggleEmployeeStatus(id);
      if (res.warning) {
        alert(res.warning);
      }
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id ? { ...emp, status: res.employee.status, isActive: res.employee.isActive } : emp
        )
      );
    } catch (err: any) {
      alert(err.message || 'Status toggle failed');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const isAct = emp.status === 'ACTIVE' || (emp.status === true && emp.isActive !== false);
    const isPend = emp.status === 'PENDING_APPROVAL';
    const isRej = emp.status === 'REJECTED';
    const isInact = emp.status === 'INACTIVE' || emp.status === false || emp.isActive === false;

    if (statusFilter === 'ACTIVE') return isAct;
    if (statusFilter === 'PENDING_APPROVAL') return isPend;
    if (statusFilter === 'INACTIVE') return isInact;
    if (statusFilter === 'REJECTED') return isRej;
    return true;
  });

  return (
    <AdminLayout selectedBranch={selectedBranchId} onBranchChange={setSelectedBranchId}>
      <div className="space-y-6 max-w-[1600px] mx-auto w-full text-[#FAF7F2]">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2C2724]">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#D4AF37]">
              {isAm ? 'የባለሙያዎች ዝርዝር' : 'Specialist Roster'}
            </h1>
            <span className="text-xs text-stone-400">
              {filteredEmployees.length} {isAm ? 'ባለሙያዎች' : 'Specialists'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/employees/add')}
            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0E0B09] text-xs font-bold uppercase tracking-wider hover:bg-[#b89528] transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>{isAm ? 'አዲስ መዝግብ' : 'Add Specialist'}</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-500 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAm ? 'በስም ወይም ስልክ ፈልግ...' : 'Search name, phone...'}
              className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-500 outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Owner-only branch selector */}
            {!isBranchAdmin && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
              >
                <option value="all">{isAm ? 'ሁሉም ቅርንጫፎች' : 'All Branches'}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
            >
              <option value="all">{isAm ? 'ሁሉም ሁኔታ' : 'All Status'}</option>
              <option value="ACTIVE">{isAm ? 'ንቁ' : 'Active'}</option>
              <option value="PENDING_APPROVAL">{isAm ? 'በመጠባበቅ' : 'Pending'}</option>
              <option value="INACTIVE">{isAm ? 'ዝግ' : 'Inactive'}</option>
              <option value="REJECTED">{isAm ? 'ውድቅ' : 'Rejected'}</option>
            </select>
          </div>
        </div>

        {/* Specialists Table */}
        <div className="bg-[#181412] rounded-xl border border-[#2C2724] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-stone-400">
              {isAm ? 'በመጫን ላይ...' : 'Loading roster...'}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-500">
              {isAm ? 'ምንም ባለሙያ አልተገኘም' : 'No specialists found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0E0B09] text-stone-400 uppercase tracking-wider border-b border-[#2C2724]">
                    <th className="py-3 px-4">{isAm ? 'ስም' : 'Specialist'}</th>
                    <th className="py-3 px-4">{isAm ? 'ቅርንጫፍ' : 'Branch'}</th>
                    <th className="py-3 px-4">{isAm ? 'ሙያ / ሚና' : 'Title'}</th>
                    <th className="py-3 px-4">{isAm ? 'ስልክ' : 'Phone'}</th>
                    <th className="py-3 px-4 text-center">{isAm ? 'መግቢያ' : 'Login'}</th>
                    <th className="py-3 px-4 text-center">{isAm ? 'ሁኔታ' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isAm ? 'እርምጃ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2724]">
                  {filteredEmployees.map((emp) => {
                    const isLinked = Boolean((emp as any).userId || (emp as any).user);
                    const isAct = emp.status === 'ACTIVE' || (emp.status === true && emp.isActive !== false);
                    const isPend = emp.status === 'PENDING_APPROVAL';
                    const isRej = emp.status === 'REJECTED';

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => navigate(`/admin/employees/${emp.id}`)}
                        className="hover:bg-[#231E1B] transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2C2724] text-[#D4AF37] font-bold flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                              {emp.firstName?.[0] || 'S'}
                            </div>
                            <div>
                              <div className="font-bold text-[#FAF7F2]">
                                {emp.firstName} {emp.lastName}
                              </div>
                              {emp.amharicName && (
                                <div className="text-[11px] text-stone-400">
                                  {emp.amharicName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-stone-300">
                          {emp.branch?.name || 'Global'}
                        </td>

                        <td className="py-3.5 px-4 text-stone-300 font-medium">
                          {emp.ritualTitle || (emp as any).title || 'Specialist'}
                        </td>

                        <td className="py-3.5 px-4 text-stone-400 font-mono">
                          {emp.phone || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isLinked
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {isLinked
                              ? isAm
                                ? 'የተገናኘ'
                                : 'Linked'
                              : isAm
                              ? 'ያልተገናኘ'
                              : 'Offline'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isPend ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/60 text-amber-400 border border-amber-700/50">
                              {isAm ? 'በመጠባበቅ' : 'Pending'}
                            </span>
                          ) : isAct ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                              {isAm ? 'ንቁ' : 'Active'}
                            </span>
                          ) : isRej ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800">
                              {isAm ? 'ውድቅ' : 'Rejected'}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-800 text-stone-500">
                              {isAm ? 'ዝግ' : 'Inactive'}
                            </span>
                          )}
                        </td>

                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/employees/${emp.id}/services`)}
                              className="px-2 py-1 rounded bg-[#0E0B09] border border-[#2C2724] hover:border-[#D4AF37] text-[11px] text-stone-300 hover:text-[#D4AF37] transition"
                              title="Assign Skills"
                            >
                              {isAm ? 'ሙያዎች' : 'Skills'}
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/admin/employees/${emp.id}/schedule`)}
                              className="px-2 py-1 rounded bg-[#0E0B09] border border-[#2C2724] hover:border-[#D4AF37] text-[11px] text-stone-300 hover:text-[#D4AF37] transition"
                              title="Shift Schedule"
                            >
                              {isAm ? 'ሰዓት' : 'Schedule'}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleToggleStatus(emp.id, e)}
                              disabled={isPend || isRej}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                                isPend || isRej
                                  ? 'border border-stone-800 text-stone-600 bg-stone-900/50 cursor-not-allowed opacity-50'
                                  : isAct
                                  ? 'border border-red-900/50 text-red-400 hover:bg-red-950/40'
                                  : 'border border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                              title={isPend ? 'Pending Approval / በመጠባበቅ ላይ' : isRej ? 'Rejected / ውድቅ የተደረገ' : isAct ? 'Deactivate' : 'Activate'}
                            >
                              {isPend
                                ? isAm
                                  ? 'በመጠባበቅ'
                                  : 'Pending'
                                : isRej
                                ? isAm
                                  ? 'ውድቅ'
                                  : 'Rejected'
                                : isAct
                                ? isAm
                                  ? 'አቦዝን'
                                  : 'Deactivate'
                                : isAm
                                ? 'አንቃ'
                                : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeRoster;
