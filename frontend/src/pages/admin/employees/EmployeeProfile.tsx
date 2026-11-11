import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee } from '../../../api/employeeApi';
import { branchApi, BranchDTO } from '../../../api/branchApi';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAm = language === 'am';
  const isOwner = user?.role === 'OWNER';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer Branch Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editAmharicName, setEditAmharicName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editWorkstation, setEditWorkstation] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [empData, branchList] = await Promise.all([
        employeeApi.getEmployeeById(id),
        branchApi.listBranches().catch(() => []),
      ]);
      setEmployee(empData);
      setBranches(branchList);
      if (branchList.length > 0) {
        setTargetBranchId(branchList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!employee) return;
    try {
      const res = await employeeApi.toggleEmployeeStatus(employee.id);
      if (res.warning) alert(res.warning);
      setEmployee((prev) =>
        prev
          ? {
              ...prev,
              status: res.employee.status,
              isActive: res.employee.isActive,
            }
          : null
      );
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleTransferBranch = async () => {
    if (!employee || !targetBranchId || targetBranchId === employee.branchId) {
      setShowTransferModal(false);
      return;
    }
    try {
      setIsTransferring(true);
      const updated = await employeeApi.updateEmployee(employee.id, {
        branchId: targetBranchId,
      });
      setEmployee((prev) => (prev ? { ...prev, branchId: updated.branchId, branch: updated.branch } : null));
      setShowTransferModal(false);
      alert(isAm ? 'ቅርንጫፍ ተቀይሯል' : 'Branch transferred');
    } catch (err: any) {
      alert(err.message || 'Branch transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const openEditModal = () => {
    if (!employee) return;
    setEditFirstName(employee.firstName || '');
    setEditLastName(employee.lastName || '');
    setEditAmharicName(employee.amharicName || '');
    setEditPhone(employee.phone || '');
    setEditEmail(employee.email || '');
    setEditTitle(employee.ritualTitle || (employee as any).title || '');
    setEditWorkstation(employee.workstation || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      setIsSavingEdit(true);
      const updated = await employeeApi.updateEmployee(employee.id, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        amharicName: editAmharicName.trim() || null,
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        ritualTitle: editTitle.trim() || null,
        title: editTitle.trim() || null,
        workstation: editWorkstation.trim() || null,
      });
      setEmployee((prev) => (prev ? { ...prev, ...updated } : null));
      setShowEditModal(false);
    } catch (err: any) {
      alert(err.message || 'Edit failed');
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center text-xs text-stone-400">
          {isAm ? 'በመጫን ላይ...' : 'Loading profile...'}
        </div>
      </AdminLayout>
    );
  }

  if (!employee) {
    return (
      <AdminLayout>
        <div className="py-24 text-center text-xs text-stone-500">
          {isAm ? 'ባለሙያው አልተገኘም' : 'Specialist not found'}
        </div>
      </AdminLayout>
    );
  }

  const isAct = employee.status === 'ACTIVE' || (employee.status === true && employee.isActive !== false);
  const isPend = employee.status === 'PENDING_APPROVAL';
  const isRej = employee.status === 'REJECTED';

  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesAm = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

  return (
    <AdminLayout selectedBranch={employee.branchId}>
      <div className="space-y-6 max-w-[1560px] mx-auto w-full text-[#FAF7F2]">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#2C2724]">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <button
              onClick={() => navigate('/admin/employees')}
              className="hover:text-[#D4AF37] transition font-semibold"
            >
              {isAm ? 'ባለሙያዎች' : 'Specialists'}
            </button>
            <span>/</span>
            <span className="text-[#FAF7F2] font-bold">
              {employee.firstName} {employee.lastName}
            </span>
          </div>

          <button
            onClick={() => navigate('/admin/employees')}
            className="px-3 py-1.5 rounded-lg border border-[#2C2724] text-xs text-stone-300 hover:text-[#D4AF37] transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>{isAm ? 'ተመለስ' : 'Back'}</span>
          </button>
        </div>

        {/* Header Hero Card */}
        <div className="bg-[#181412] p-6 rounded-2xl border border-[#2C2724] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0E0B09] border border-[#D4AF37]/40 text-[#D4AF37] font-serif font-bold text-2xl flex items-center justify-center shrink-0 shadow-inner">
              {employee.firstName?.[0] || 'S'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-[#FAF7F2]">
                  {employee.firstName} {employee.lastName}
                </h1>

                {/* Status Badge */}
                {isPend ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/60 text-amber-400 border border-amber-700/50">
                    {isAm ? 'በመጠባበቅ' : 'Pending'}
                  </span>
                ) : isAct ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {isAm ? 'ንቁ' : 'Active'}
                  </span>
                ) : isRej ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800">
                    {isAm ? 'ውድቅ' : 'Rejected'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-800 text-stone-400 border border-stone-700">
                    {isAm ? 'ዝግ' : 'Inactive'}
                  </span>
                )}
              </div>

              {employee.amharicName && (
                <div className="text-xs text-stone-400 font-medium">
                  {employee.amharicName}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 pt-1">
                <span className="text-[#D4AF37] font-semibold">
                  {employee.ritualTitle || (employee as any).title || (isAm ? 'ባለሙያ' : 'Specialist')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-stone-500">location_on</span>
                  {employee.branch?.name || (isAm ? 'ቅርንጫፍ' : 'Branch')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Strictly 1-2 words) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openEditModal}
              className="px-3.5 py-2 rounded-lg bg-[#0E0B09] border border-[#2C2724] hover:border-[#D4AF37] text-xs font-bold text-stone-300 hover:text-[#D4AF37] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>{isAm ? 'አድስ' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/admin/employees/${employee.id}/services`)}
              className="px-3.5 py-2 rounded-lg bg-[#0E0B09] border border-[#2C2724] hover:border-[#D4AF37] text-xs font-bold text-stone-300 hover:text-[#D4AF37] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">spa</span>
              <span>{isAm ? 'ሙያዎች' : 'Skills'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/admin/employees/${employee.id}/schedule`)}
              className="px-3.5 py-2 rounded-lg bg-[#0E0B09] border border-[#2C2724] hover:border-[#D4AF37] text-xs font-bold text-stone-300 hover:text-[#D4AF37] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>{isAm ? 'ሰዓት' : 'Schedule'}</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="px-3.5 py-2 rounded-lg bg-[#0E0B09] border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                <span>{isAm ? 'ቅርንጫፍ ቀይር' : 'Transfer'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isPend || isRej}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isPend || isRej
                  ? 'border border-stone-800 text-stone-600 bg-stone-900/50 cursor-not-allowed opacity-50'
                  : isAct
                  ? 'border border-red-900/60 text-red-400 hover:bg-red-950/40'
                  : 'border border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/40'
              }`}
              title={isPend ? 'Pending Approval / በመጠባበቅ ላይ' : isRej ? 'Rejected / ውድቅ የተደረገ' : isAct ? 'Deactivate' : 'Activate'}
            >
              <span className="material-symbols-outlined text-sm">
                {isPend ? 'hourglass_empty' : isRej ? 'cancel' : isAct ? 'block' : 'check_circle'}
              </span>
              <span>
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
              </span>
            </button>
          </div>
        </div>

        {/* 3-Section Dossier Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Card 1: Personal Dossier */}
          <div className="bg-[#181412] p-6 rounded-2xl border border-[#2C2724] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2C2724]">
              <span className="material-symbols-outlined text-[#D4AF37] text-base">badge</span>
              <h2 className="font-serif text-sm font-bold text-[#FAF7F2]">
                {isAm ? 'የግል መረጃ' : 'Personal Dossier'}
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#2C2724]/50">
                <span className="text-stone-400">{isAm ? 'ስልክ' : 'Phone'}</span>
                <span className="text-[#FAF7F2] font-mono">{employee.phone || '-'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#2C2724]/50">
                <span className="text-stone-400">{isAm ? 'ኢሜይል' : 'Email'}</span>
                <span className="text-[#FAF7F2]">{employee.email || '-'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#2C2724]/50">
                <span className="text-stone-400">{isAm ? 'ቅርንጫፍ' : 'Branch'}</span>
                <span className="text-[#FAF7F2]">{employee.branch?.name || '-'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#2C2724]/50">
                <span className="text-stone-400">{isAm ? 'የስራ ቦታ' : 'Workstation'}</span>
                <span className="text-[#FAF7F2]">{employee.workstation || '-'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#2C2724]/50">
                <span className="text-stone-400">{isAm ? 'የቅጥር ዓይነት' : 'Employment'}</span>
                <span className="text-[#FAF7F2]">{employee.employmentType || 'Full-Time'}</span>
              </div>

              {employee.emergencyContactName && (
                <div className="flex justify-between py-1 border-b border-[#2C2724]/50">
                  <span className="text-stone-400">{isAm ? 'ተጠሪ' : 'Emergency'}</span>
                  <span className="text-[#FAF7F2]">{employee.emergencyContactName} ({employee.emergencyContactPhone || '-'})</span>
                </div>
              )}

              {employee.hireReason && (
                <div className="pt-2">
                  <span className="text-[#D4AF37] block font-semibold mb-1">
                    {isAm ? 'የቅጥር ምክንያት' : 'Hire Reason'}
                  </span>
                  <p className="text-stone-300 bg-[#0E0B09] p-2.5 rounded-lg border border-[#2C2724]">
                    {employee.hireReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Specialties & Services */}
          <div className="bg-[#181412] p-6 rounded-2xl border border-[#2C2724] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37] text-base">spa</span>
                <h2 className="font-serif text-sm font-bold text-[#FAF7F2]">
                  {isAm ? 'የተመደቡ ሙያዎች' : 'Specialties & Services'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/admin/employees/${employee.id}/services`)}
                className="text-[11px] font-bold text-[#D4AF37] hover:underline"
              >
                {isAm ? 'አቀናጅ' : 'Manage'}
              </button>
            </div>

            {(!employee.services || employee.services.length === 0) ? (
              <div className="py-8 text-center text-xs text-stone-500">
                {isAm ? 'ምንም አገልግሎት አልተመደበም' : 'No services assigned'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {employee.services.map((item: any) => {
                  const s = item.service || {};
                  return (
                    <div
                      key={item.id || item.serviceId}
                      className="bg-[#0E0B09] p-3 rounded-xl border border-[#2C2724] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#FAF7F2]">{s.name || s.title}</div>
                        <div className="text-[11px] text-stone-400">
                          {item.customDurationMinutes || s.durationMinutes || s.duration || 60} {isAm ? 'ደቂቃ' : 'mins'}
                        </div>
                      </div>
                      <div className="font-mono text-[#D4AF37] font-semibold">
                        {Number(s.basePrice || s.price || 0).toLocaleString()} ETB
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 3: Weekly Schedule Overview */}
          <div className="bg-[#181412] p-6 rounded-2xl border border-[#2C2724] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D4AF37] text-base">schedule</span>
                <h2 className="font-serif text-sm font-bold text-[#FAF7F2]">
                  {isAm ? 'የሳምንት ሰዓት' : 'Weekly Schedule'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/admin/employees/${employee.id}/schedule`)}
                className="text-[11px] font-bold text-[#D4AF37] hover:underline"
              >
                {isAm ? 'አቀናጅ' : 'Manage'}
              </button>
            </div>

            {(!employee.schedules || employee.schedules.length === 0) ? (
              <div className="py-8 text-center text-xs text-stone-500">
                {isAm ? 'ምንም ሰዓት አልተዘጋጀም' : 'No schedule configured'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {employee.schedules.map((sch) => {
                  const dayName = isAm ? dayNamesAm[sch.dayOfWeek] : dayNamesEn[sch.dayOfWeek];
                  return (
                    <div
                      key={sch.dayOfWeek}
                      className="bg-[#0E0B09] p-2.5 rounded-xl border border-[#2C2724] flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-[#FAF7F2]">{dayName}</span>
                      {sch.isWorking ? (
                        <div className="text-right">
                          <span className="font-mono text-[#D4AF37]">
                            {sch.startTime} - {sch.endTime}
                          </span>
                          {sch.breakStartTime && sch.breakEndTime && (
                            <span className="text-[10px] text-stone-500 block">
                              {isAm ? 'እረፍት' : 'Break'}: {sch.breakStartTime} - {sch.breakEndTime}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-500 font-semibold">{isAm ? 'ዕረፍት' : 'Off'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Branch Modal (Owner Only) */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#181412] border border-[#2C2724] rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  {isAm ? 'ቅርንጫፍ ቀይር' : 'Transfer Branch'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-stone-300">
                  {isAm ? 'አዲስ ቅርንጫፍ ምረጥ' : 'Select Destination Branch'}
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === employee.branchId}>
                      {b.name} {b.id === employee.branchId ? `(${isAm ? 'የአሁኑ' : 'Current'})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#2C2724] text-xs text-stone-400 hover:text-white transition"
                >
                  {isAm ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isTransferring || !targetBranchId || targetBranchId === employee.branchId}
                  onClick={handleTransferBranch}
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {isTransferring
                    ? isAm
                      ? 'በማዛወር ላይ...'
                      : 'Transferring...'
                    : isAm
                    ? 'አዛውር'
                    : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Details Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSaveEdit}
              className="bg-[#181412] border border-[#2C2724] rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  {isAm ? 'መረጃ አድስ' : 'Edit Personnel'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAm ? 'ስም *' : 'First Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAm ? 'የአባት ስም *' : 'Last Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-stone-300 font-semibold mb-1">
                  {isAm ? 'የአማርኛ ስም' : 'Amharic Name'}
                </label>
                <input
                  type="text"
                  value={editAmharicName}
                  onChange={(e) => setEditAmharicName(e.target.value)}
                  className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAm ? 'ስልክ *' : 'Phone *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAm ? 'ኢሜይል' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAm ? 'ሙያ / ሚና' : 'Title'}
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    {isAm ? 'የስራ ቦታ' : 'Workstation'}
                  </label>
                  <input
                    type="text"
                    value={editWorkstation}
                    onChange={(e) => setEditWorkstation(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#2C2724] text-xs text-stone-400 hover:text-white transition"
                >
                  {isAm ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                >
                  {isSavingEdit ? (isAm ? 'በማስቀመጥ ላይ...' : 'Saving...') : (isAm ? 'አስቀምጥ' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EmployeeProfile;
