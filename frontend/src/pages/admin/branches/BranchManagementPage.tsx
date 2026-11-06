import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

interface BranchHoursItem {
  id?: string;
  dayOfWeek: number;
  dayName?: string;
  openTime: string;
  closeTime: string;
  closesNextDay: boolean;
  isClosed: boolean;
}

interface BranchAdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface BranchItem {
  id: string;
  name: string;
  slug: string;
  phoneNumber?: string;
  phone?: string;
  addressLine?: string;
  address?: string;
  city: string;
  description: string | null;
  timezone: string;
  isActive: boolean;
  slotBufferMinutes: number;
  admin?: BranchAdminUser | null;
  branchHours?: BranchHoursItem[];
  _count?: {
    employees: number;
    services: number;
    bookings: number;
  };
}

const DAY_LABELS: { [key: number]: { en: string; am: string } } = {
  1: { en: 'Monday', am: 'ሰኞ' },
  2: { en: 'Tuesday', am: 'ማክሰኞ' },
  3: { en: 'Wednesday', am: 'ረቡዕ' },
  4: { en: 'Thursday', am: 'ሐሙስ' },
  5: { en: 'Friday', am: 'አርብ' },
  6: { en: 'Saturday', am: 'ቅዳሜ' },
  0: { en: 'Sunday', am: 'እሁድ' },
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const BranchManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isOwner = user?.role === 'OWNER';

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Operating Hours state
  const [hoursModalBranch, setHoursModalBranch] = useState<BranchItem | null>(null);
  const [hoursFormData, setHoursFormData] = useState<BranchHoursItem[]>([]);
  const [savingHours, setSavingHours] = useState(false);

  // Edit / Create Branch state
  const [editModalBranch, setEditModalBranch] = useState<BranchItem | null>(null);
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Addis Ababa',
    timezone: 'Africa/Addis_Ababa',
    description: '',
    slotBufferMinutes: 10,
  });
  const [savingBranch, setSavingBranch] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // In-Modal Admin Provisioning state
  const [provisionAdmin, setProvisionAdmin] = useState(true);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    phone: '+251',
    password: '',
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Assign Admin state
  const [assignModalBranch, setAssignModalBranch] = useState<BranchItem | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assigningAdmin, setAssigningAdmin] = useState(false);

  // Reset Admin Password state
  const [resetPasswordUser, setResetPasswordUser] = useState<BranchAdminUser | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [savingResetPassword, setSavingResetPassword] = useState(false);

  const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('eyob_auth_token');

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/branches', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBranches(data.data || []);
      }
    } catch {
      setNotification({ text: 'Failed to load branches', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle status
  const handleToggleStatus = async (branch: BranchItem) => {
    if (!isOwner) return;
    try {
      const res = await fetch(`/api/v1/branches/${branch.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      if (res.ok) {
        showToast(`${branch.name} ${!branch.isActive ? 'activated' : 'deactivated'}`);
        fetchBranches();
      } else {
        const err = await res.json();
        showToast(err.message || 'Status update failed', 'error');
      }
    } catch {
      showToast('Error toggling branch status', 'error');
    }
  };

  // Open hours editor
  const handleOpenHoursModal = (branch: BranchItem) => {
    setHoursModalBranch(branch);
    const existing = branch.branchHours || [];
    const populated = DAY_ORDER.map((d) => {
      const found = existing.find((h) => h.dayOfWeek === d);
      return {
        dayOfWeek: d,
        openTime: found ? found.openTime : '09:00',
        closeTime: found ? found.closeTime : '20:00',
        closesNextDay: found ? found.closesNextDay : false,
        isClosed: found ? found.isClosed : false,
      };
    });
    setHoursFormData(populated);
  };

  // Update hours state
  const handleHourChange = (dayOfWeek: number, field: keyof BranchHoursItem, val: any) => {
    setHoursFormData((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek === dayOfWeek) {
          const updated = { ...item, [field]: val };
          if (field === 'closeTime' || field === 'openTime') {
            const [oH, oM] = (field === 'openTime' ? val : item.openTime).split(':').map(Number);
            const [cH, cM] = (field === 'closeTime' ? val : item.closeTime).split(':').map(Number);
            if (cH * 60 + cM <= oH * 60 + oM && !item.isClosed) {
              updated.closesNextDay = true;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Save hours
  const handleSaveHours = async () => {
    if (!hoursModalBranch) return;
    try {
      setSavingHours(true);
      const res = await fetch(`/api/v1/branches/${hoursModalBranch.id}/hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(hoursFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${hoursModalBranch.name} operating hours updated.`);
        setHoursModalBranch(null);
        fetchBranches();
      } else {
        showToast(data.message || 'Failed to update hours', 'error');
      }
    } catch {
      showToast('Error saving operating hours', 'error');
    } finally {
      setSavingHours(false);
    }
  };

  // Open Edit / Create Modal
  const handleOpenEdit = (branch?: BranchItem) => {
    if (branch) {
      setIsCreatingNew(false);
      setEditModalBranch(branch);
      setBranchFormData({
        name: branch.name,
        phone: branch.phone || branch.phoneNumber || '',
        address: branch.address || branch.addressLine || '',
        city: branch.city || 'Addis Ababa',
        timezone: branch.timezone || 'Africa/Addis_Ababa',
        description: branch.description || '',
        slotBufferMinutes: branch.slotBufferMinutes || 10,
      });
    } else {
      setIsCreatingNew(true);
      setEditModalBranch(null);
      setBranchFormData({
        name: '',
        phone: '+251',
        address: '',
        city: 'Addis Ababa',
        timezone: 'Africa/Addis_Ababa',
        description: '',
        slotBufferMinutes: 10,
      });
      setProvisionAdmin(true);
      setAdminFormData({
        name: '',
        email: '',
        phone: '+251',
        password: '',
      });
      setShowAdminPassword(false);
    }
  };

  // Save Branch (Create or Update)
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBranch(true);
      const url = isCreatingNew ? '/api/v1/branches' : `/api/v1/branches/${editModalBranch?.id}`;
      const method = isCreatingNew ? 'POST' : 'PATCH';

      const payload: any = { ...branchFormData };
      if (isCreatingNew && provisionAdmin) {
        payload.admin = {
          name: adminFormData.name.trim(),
          email: adminFormData.email.trim().toLowerCase(),
          phone: adminFormData.phone.trim(),
          password: adminFormData.password,
        };
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          isCreatingNew
            ? provisionAdmin
              ? 'Branch & Admin account created successfully'
              : 'Branch created successfully'
            : 'Branch updated successfully'
        );
        setEditModalBranch(null);
        setIsCreatingNew(false);
        fetchBranches();
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error while saving branch', 'error');
    } finally {
      setSavingBranch(false);
    }
  };

  // Assign Admin
  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalBranch || !assignUserId) return;
    try {
      setAssigningAdmin(true);
      const res = await fetch(`/api/v1/branches/${assignModalBranch.id}/assign-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: assignUserId.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Administrator assigned to ${assignModalBranch.name}`);
        setAssignModalBranch(null);
        setAssignUserId('');
        fetchBranches();
      } else {
        showToast(data.message || 'Assignment failed', 'error');
      }
    } catch {
      showToast('Error assigning administrator', 'error');
    } finally {
      setAssigningAdmin(false);
    }
  };

  // Reset Admin Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !resetNewPassword) return;
    try {
      setSavingResetPassword(true);
      const res = await fetch(`/api/v1/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: resetNewPassword }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showToast(`Password updated for ${resetPasswordUser.name}`);
        setResetPasswordUser(null);
        setResetNewPassword('');
      } else {
        showToast(data.message || 'Failed to update password', 'error');
      }
    } catch {
      showToast('Error resetting password', 'error');
    } finally {
      setSavingResetPassword(false);
    }
  };

  return (
    <AdminLayout activePath="/admin/branches">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between border shadow-lg ${
              notification.type === 'success'
                ? 'bg-[#181412] text-[#D4AF37] border-[#D4AF37]/40'
                : 'bg-red-950/80 text-red-200 border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                {notification.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Minimal Luxury Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2C2724]">
          <div>
            <h1 className="text-2xl font-serif text-[#FAF7F2] font-medium tracking-wide">
              {t('branch.management')}
            </h1>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              Multi-branch locations, operating windows, and administrator assignments.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => handleOpenEdit()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add_business</span>
              <span>{t('branch.newBranch')}</span>
            </button>
          )}
        </div>

        {/* Branches Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#D4AF37]">progress_activity</span>
            <p className="text-xs text-[#A8A29E] mt-2">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-[#181412] border border-[#2C2724] rounded-xl p-12 text-center text-[#A8A29E] space-y-3">
            <span className="material-symbols-outlined text-4xl text-[#D4AF37]/60">store</span>
            <p className="text-sm">No branches registered in the salon network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => {
              const phone = branch.phone || branch.phoneNumber;
              const address = branch.address || branch.addressLine;

              return (
                <div
                  key={branch.id}
                  className="bg-[#181412] border border-[#2C2724] hover:border-[#D4AF37]/40 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-colors"
                >
                  <div className="space-y-4">
                    {/* Top Row: Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-serif font-semibold text-[#FAF7F2] tracking-wide">
                          {branch.name}
                        </h2>
                        <span className="inline-block text-[10px] font-mono text-[#A8A29E] mt-0.5">
                          slug: {branch.slug}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          branch.isActive
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            branch.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                          }`}
                        />
                        {branch.isActive ? t('branch.active') : t('branch.inactive')}
                      </span>
                    </div>

                    {/* Details Block */}
                    <div className="space-y-2 text-xs text-[#FAF7F2]/80 border-t border-[#2C2724] pt-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[#D4AF37]">call</span>
                        <span className="font-mono">{phone || '—'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[#D4AF37]">location_on</span>
                        <span className="truncate">{address}, {branch.city}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-[#D4AF37]">schedule</span>
                        <span className="text-[11px] font-mono bg-[#231D1A] px-2 py-0.5 rounded text-[#D4AF37]">
                          {branch.timezone}
                        </span>
                      </div>
                    </div>

                    {/* Branch Administrator Badge Card */}
                    <div className="bg-[#120F0D] border border-[#2C2724] rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#A8A29E]">
                        <span>Administrator / አስተዳዳሪ</span>
                        {isOwner && (
                          <div className="flex items-center gap-2">
                            {branch.admin && (
                              <button
                                onClick={() => {
                                  setResetPasswordUser(branch.admin || null);
                                  setResetNewPassword('');
                                }}
                                className="text-[#D4AF37] hover:underline"
                                title="Reset Administrator Password"
                              >
                                Reset Key
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setAssignModalBranch(branch);
                                setAssignUserId(branch.admin?.id || '');
                              }}
                              className="text-stone-400 hover:text-white"
                            >
                              {branch.admin ? 'Reassign' : 'Assign'}
                            </button>
                          </div>
                        )}
                      </div>

                      {branch.admin ? (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#FAF7F2]">
                              Manager: {branch.admin.name}
                            </p>
                            <p className="text-[11px] text-[#A8A29E] font-mono truncate">
                              {branch.admin.email}
                            </p>
                          </div>
                          <span className="text-[10px] bg-[#231D1A] text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-mono uppercase font-bold">
                            ADMIN
                          </span>
                        </div>
                      ) : (
                        <p className="text-stone-500 italic text-[11px]">Unassigned</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-[#2C2724] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenHoursModal(branch)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#231D1A] hover:bg-[#2C2724] text-[#FAF7F2] border border-[#3E3834] rounded-lg text-xs font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-[#D4AF37]">pace</span>
                      <span>{t('branch.hours')}</span>
                    </button>

                    {isOwner && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(branch)}
                          className="p-1.5 bg-[#231D1A] hover:bg-[#2C2724] text-[#FAF7F2] border border-[#3E3834] rounded-lg text-xs transition-colors"
                          title={t('branch.edit')}
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(branch)}
                          className={`p-1.5 border rounded-lg text-xs transition-colors ${
                            branch.isActive
                              ? 'bg-red-950/40 text-red-300 border-red-900/50 hover:bg-red-900/50'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50 hover:bg-emerald-900/50'
                          }`}
                          title={t('branch.statusToggle')}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {branch.isActive ? 'power_settings_new' : 'check'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Operating Hours Modal */}
        {hoursModalBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#181412] border border-[#2C2724] text-[#FAF7F2] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#D4AF37]">
                    {hoursModalBranch.name} — {t('branch.hours')}
                  </h3>
                  <p className="text-xs text-[#A8A29E]">
                    Set weekly open/close times, closed days, and overnight windows.
                  </p>
                </div>
                <button
                  onClick={() => setHoursModalBranch(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Hours Rows */}
              <div className="space-y-2.5">
                {DAY_ORDER.map((d) => {
                  const item = hoursFormData.find((h) => h.dayOfWeek === d);
                  if (!item) return null;
                  const label = DAY_LABELS[d] || { en: 'Day', am: '' };

                  return (
                    <div
                      key={d}
                      className={`grid grid-cols-12 items-center gap-3 p-2.5 rounded-lg border text-xs ${
                        item.isClosed
                          ? 'bg-[#120F0D] border-stone-800 text-stone-500 opacity-75'
                          : 'bg-[#231D1A] border-[#3E3834] text-[#FAF7F2]'
                      }`}
                    >
                      {/* Day Label */}
                      <div className="col-span-3 font-semibold tracking-wide">
                        <span>{label.en}</span>
                        <span className="text-[10px] text-[#A8A29E] block">{label.am}</span>
                      </div>

                      {/* Closed Checkbox */}
                      <div className="col-span-2 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`closed-${d}`}
                          checked={item.isClosed}
                          onChange={(e) => handleHourChange(d, 'isClosed', e.target.checked)}
                          className="accent-[#D4AF37] cursor-pointer"
                        />
                        <label htmlFor={`closed-${d}`} className="cursor-pointer text-[11px]">
                          {t('branch.closed')}
                        </label>
                      </div>

                      {/* Open Time */}
                      <div className="col-span-2">
                        <input
                          type="time"
                          disabled={item.isClosed}
                          value={item.openTime}
                          onChange={(e) => handleHourChange(d, 'openTime', e.target.value)}
                          className="w-full bg-[#181412] border border-[#3E3834] text-[#FAF7F2] disabled:opacity-40 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Close Time */}
                      <div className="col-span-2">
                        <input
                          type="time"
                          disabled={item.isClosed}
                          value={item.closeTime}
                          onChange={(e) => handleHourChange(d, 'closeTime', e.target.value)}
                          className="w-full bg-[#181412] border border-[#3E3834] text-[#FAF7F2] disabled:opacity-40 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Overnight Checkbox */}
                      <div className="col-span-3 flex items-center gap-1.5 justify-end">
                        <input
                          type="checkbox"
                          id={`overnight-${d}`}
                          disabled={item.isClosed}
                          checked={item.closesNextDay}
                          onChange={(e) => handleHourChange(d, 'closesNextDay', e.target.checked)}
                          className="accent-[#D4AF37] cursor-pointer"
                        />
                        <label
                          htmlFor={`overnight-${d}`}
                          className="cursor-pointer text-[11px] text-[#D4AF37] whitespace-nowrap"
                          title="Operating hours extend past midnight into next morning"
                        >
                          {t('branch.overnight')}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setHoursModalBranch(null)}
                  className="px-4 py-2 bg-[#231D1A] hover:bg-[#2C2724] text-stone-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel / ሰርዝ
                </button>
                <button
                  type="button"
                  onClick={handleSaveHours}
                  disabled={savingHours}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50"
                >
                  {savingHours ? 'Saving...' : t('branch.saveSchedule')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Branch Modal (Owner Only) */}
        {(editModalBranch || isCreatingNew) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#181412] border border-[#2C2724] text-[#FAF7F2] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <h3 className="text-lg font-serif font-bold text-[#D4AF37]">
                  {isCreatingNew ? t('branch.newBranch') : `${t('branch.edit')}: ${editModalBranch?.name}`}
                </h3>
                <button
                  onClick={() => {
                    setEditModalBranch(null);
                    setIsCreatingNew(false);
                  }}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
                {/* Branch Details */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    Branch Name / ስም *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchFormData.name}
                    onChange={(e) => setBranchFormData({ ...branchFormData, name: e.target.value })}
                    className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                    placeholder="e.g. Eyob Beauty Salon - Sarbet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                      Phone Number / ስልክ *
                    </label>
                    <input
                      type="text"
                      required
                      value={branchFormData.phone}
                      onChange={(e) => setBranchFormData({ ...branchFormData, phone: e.target.value })}
                      className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                      placeholder="+251911..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                      Timezone / ሰዓት አቆጣጠር
                    </label>
                    <input
                      type="text"
                      value={branchFormData.timezone}
                      onChange={(e) => setBranchFormData({ ...branchFormData, timezone: e.target.value })}
                      className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    Address Line / አድራሻ *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                    className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                    placeholder="e.g. Sarbet, Near Pushkin Square"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    Description / መግለጫ (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={branchFormData.description}
                    onChange={(e) => setBranchFormData({ ...branchFormData, description: e.target.value })}
                    className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Collapsible In-Modal Admin Provisioning (New Branch Only) */}
                {isCreatingNew && (
                  <div className="border border-[#3E3834] rounded-xl p-3.5 bg-[#120F0D] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="provision-admin-toggle"
                          checked={provisionAdmin}
                          onChange={(e) => setProvisionAdmin(e.target.checked)}
                          className="accent-[#D4AF37] cursor-pointer"
                        />
                        <label htmlFor="provision-admin-toggle" className="font-semibold text-xs text-[#D4AF37] cursor-pointer">
                          Branch Administrator Account / የአስተዳዳሪ መለያ
                        </label>
                      </div>
                      <span className="text-[10px] text-[#A8A29E]">Provision Credentials</span>
                    </div>

                    {provisionAdmin && (
                      <div className="space-y-3 pt-2.5 border-t border-[#2C2724]">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                              Admin Full Name / ሙሉ ስም *
                            </label>
                            <input
                              type="text"
                              required={provisionAdmin}
                              value={adminFormData.name}
                              onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                              className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                              placeholder="e.g. Tigist Alemu"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                              Admin Email / ኢሜይል *
                            </label>
                            <input
                              type="email"
                              required={provisionAdmin}
                              value={adminFormData.email}
                              onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                              className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                              placeholder="manager@eyobsalon.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                              Admin Phone / ስልክ *
                            </label>
                            <input
                              type="text"
                              required={provisionAdmin}
                              value={adminFormData.phone}
                              onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                              className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                              placeholder="+251911..."
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                              Admin Password / የይለፍ ቃል *
                            </label>
                            <div className="relative">
                              <input
                                type={showAdminPassword ? 'text' : 'password'}
                                required={provisionAdmin}
                                minLength={8}
                                value={adminFormData.password}
                                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg pl-3 pr-8 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                                placeholder="Min 8 chars"
                              />
                              <button
                                type="button"
                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {showAdminPassword ? 'visibility_off' : 'visibility'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalBranch(null);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 bg-[#231D1A] hover:bg-[#2C2724] text-stone-300 rounded-lg font-semibold"
                  >
                    Cancel / ሰርዝ
                  </button>
                  <button
                    type="submit"
                    disabled={savingBranch}
                    className="px-5 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50"
                  >
                    {savingBranch ? 'Saving...' : 'Save Branch / መዝግብ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Admin Modal (Owner Only) */}
        {assignModalBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#181412] border border-[#2C2724] text-[#FAF7F2] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <h3 className="text-base font-serif font-bold text-[#D4AF37]">
                  {t('branch.assignAdmin')} — {assignModalBranch.name}
                </h3>
                <button
                  onClick={() => setAssignModalBranch(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAssignAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    User UUID / የተጠቃሚ መለያ *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg px-3 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                    placeholder="e.g. b61e054a-d75f-46fb-a9ec-870a426165b8"
                  />
                  <p className="text-[10px] text-[#A8A29E] mt-1">
                    User will be linked to this branch and granted BRANCH_ADMIN credentials.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignModalBranch(null)}
                    className="px-4 py-2 bg-[#231D1A] hover:bg-[#2C2724] text-stone-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningAdmin}
                    className="px-5 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50"
                  >
                    {assigningAdmin ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal (Owner Only) */}
        {resetPasswordUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[#181412] border border-[#2C2724] text-[#FAF7F2] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#D4AF37]">
                    Reset Credentials / የይለፍ ቃል ቀይር
                  </h3>
                  <p className="text-xs text-[#A8A29E]">{resetPasswordUser.name} ({resetPasswordUser.email})</p>
                </div>
                <button
                  onClick={() => setResetPasswordUser(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#A8A29E] mb-1">
                    New Password / አዲስ የይለፍ ቃል *
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="w-full bg-[#231D1A] border border-[#3E3834] rounded-lg pl-3 pr-8 py-2 text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {showResetPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(null)}
                    className="px-4 py-2 bg-[#231D1A] hover:bg-[#2C2724] text-stone-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingResetPassword}
                    className="px-5 py-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0E0B09] rounded-lg font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50"
                  >
                    {savingResetPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BranchManagementPage;
