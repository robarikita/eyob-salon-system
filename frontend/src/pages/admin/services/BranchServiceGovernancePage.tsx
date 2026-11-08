import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import {
  serviceApi,
  ServiceRitual,
  ServicePriceHistoryItem,
} from '../../../api/serviceApi';
import { branchApi, BranchDTO } from '../../../api/branchApi';

export const BranchServiceGovernancePage: React.FC = () => {
  const { user } = useAuth();
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';

  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('serviceId');

  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Branch Default Deposit Rule state
  const [isEditingBranchDeposit, setIsEditingBranchDeposit] = useState<boolean>(false);
  const [branchDepositType, setBranchDepositType] = useState<'NONE' | 'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [branchDepositValue, setBranchDepositValue] = useState<number>(20);
  const [isSavingBranchDeposit, setIsSavingBranchDeposit] = useState<boolean>(false);

  // Service Branch Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServiceRitual | null>(null);
  const [customPrice, setCustomPrice] = useState<number>(1000);
  const [customDuration, setCustomDuration] = useState<number | ''>('');
  const [overrideDepositType, setOverrideDepositType] = useState<'DEFAULT' | 'NONE' | 'FIXED' | 'PERCENTAGE'>('DEFAULT');
  const [overrideDepositValue, setOverrideDepositValue] = useState<number>(20);
  const [reason, setReason] = useState<string>('');
  const [isSavingOverride, setIsSavingOverride] = useState<boolean>(false);

  // History Drawer state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [historyService, setHistoryService] = useState<ServiceRitual | null>(null);
  const [priceHistory, setPriceHistory] = useState<ServicePriceHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // 1. Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const list = await branchApi.listBranches();
        setBranches(list);
        if (list.length > 0) {
          const defaultBranch =
            isBranchAdmin && user?.branchId
              ? list.find((b) => b.id === user.branchId) || list[0]
              : list[0];
          setSelectedBranchId(defaultBranch.id);
          setBranchDepositType(defaultBranch.defaultDepositType || 'PERCENTAGE');
          setBranchDepositValue(Number(defaultBranch.defaultDepositValue ?? 20));
        }
      } catch (err: any) {
        console.error('Failed to load branches:', err);
      }
    }
    loadBranches();
  }, [isBranchAdmin, user?.branchId]);

  // 2. Load services for selected branch
  const fetchServices = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const data = await serviceApi.listServices({
        branchId: selectedBranchId,
      });
      setServices(data || []);

      // If initialServiceId passed in query params, open override modal
      if (initialServiceId) {
        const matched = data.find((s) => s.id === initialServiceId);
        if (matched) {
          openOverrideModal(matched);
        }
      }
    } catch (err: any) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      const currentBranch = branches.find((b) => b.id === selectedBranchId);
      if (currentBranch) {
        setBranchDepositType(currentBranch.defaultDepositType || 'PERCENTAGE');
        setBranchDepositValue(Number(currentBranch.defaultDepositValue ?? 20));
      }
      fetchServices();
    }
  }, [selectedBranchId, branches]);

  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  // Handle Save Branch Deposit Rule
  const handleSaveBranchDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;
    setIsSavingBranchDeposit(true);
    try {
      await serviceApi.setBranchDepositRule(selectedBranchId, {
        defaultDepositType: branchDepositType,
        defaultDepositValue: Number(branchDepositValue),
      });
      setNotification('Branch default deposit rule updated / የቅድመ ክፍያ ደንብ ተቀይሯል');
      setIsEditingBranchDeposit(false);
      // Update local branch state
      setBranches((prev) =>
        prev.map((b) =>
          b.id === selectedBranchId
            ? { ...b, defaultDepositType: branchDepositType, defaultDepositValue: branchDepositValue }
            : b
        )
      );
      fetchServices();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Failed to save deposit rule: ${err.message}`);
    } finally {
      setIsSavingBranchDeposit(false);
    }
  };

  // Open Override Modal
  const openOverrideModal = (s: ServiceRitual) => {
    setSelectedService(s);
    const existingBranchPrice = s.branchPrices?.find((bp) => bp.branchId === selectedBranchId);

    if (existingBranchPrice) {
      setCustomPrice(Number(existingBranchPrice.customPrice));
      setCustomDuration(existingBranchPrice.customDurationMinutes ?? '');
      if (existingBranchPrice.depositType) {
        setOverrideDepositType(existingBranchPrice.depositType);
        setOverrideDepositValue(Number(existingBranchPrice.depositValue ?? 0));
      } else {
        setOverrideDepositType('DEFAULT');
        setOverrideDepositValue(20);
      }
    } else {
      setCustomPrice(Number(s.basePrice));
      setCustomDuration('');
      setOverrideDepositType('DEFAULT');
      setOverrideDepositValue(20);
    }
    setReason('');
    setOverrideModalOpen(true);
  };

  // Save Branch Price & Deposit Override / Submit Price Proposal
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBranchId) return;

    if (isBranchAdmin && !reason.trim()) {
      alert('Reason for Change is required / የለውጡ ምክንያት ያስፈልጋል');
      return;
    }

    setIsSavingOverride(true);
    try {
      const depositTypePayload =
        overrideDepositType === 'DEFAULT' ? null : overrideDepositType;
      const depositValuePayload =
        overrideDepositType === 'DEFAULT' || overrideDepositType === 'NONE'
          ? null
          : Number(overrideDepositValue);

      const res = await serviceApi.setBranchPrice(selectedService.id, {
        branchId: selectedBranchId,
        customPrice: Number(customPrice),
        customDurationMinutes: customDuration === '' ? null : Number(customDuration),
        depositType: depositTypePayload,
        depositValue: depositValuePayload,
        reason: reason.trim() || undefined,
      });

      if ((res as any)?.pendingApproval || isBranchAdmin) {
        setNotification('Price proposal submitted / ጥያቄው ቀርቧል');
      } else {
        setNotification(`Price updated for ${selectedService.name} / ዋጋ ተሻሽሏል`);
      }
      setOverrideModalOpen(false);
      fetchServices();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setIsSavingOverride(false);
    }
  };

  // Open History Drawer
  const openHistoryDrawer = async (s: ServiceRitual) => {
    setHistoryService(s);
    setHistoryDrawerOpen(true);
    setLoadingHistory(true);
    try {
      const history = await serviceApi.getPriceHistory(s.id, selectedBranchId);
      setPriceHistory(history || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredServices = services.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nameAm && s.nameAm.toLowerCase().includes(q)) ||
      (s.amharicName && s.amharicName.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q) ||
      (s.code && s.code.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout activePath="/admin/services">
      <div className="relative w-full text-[#FAF7F2]">
        {/* Notification Toast */}
        {notification && (
          <div className="mb-4 p-3 rounded-lg bg-[#181412] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-between shadow-lg text-xs font-semibold animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-white text-[10px] uppercase tracking-wider"
            >
              Dismiss / ዝጋ
            </button>
          </div>
        )}

        {/* Minimalist Header & Branch Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#2C2724]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
              <Link to="/admin/services" className="hover:text-[#D4AF37] transition">
                Services / አገልግሎቶች
              </Link>
              <span>•</span>
              <span className="text-[#D4AF37]">Branch Pricing / ቅርንጫፍ ዋጋዎች</span>
            </div>
            <h1 className="text-2xl font-serif text-[#FAF7F2] font-semibold tracking-tight mt-0.5">
              Branch Pricing / ቅርንጫፍ ዋጋዎች
            </h1>
          </div>

          {/* Branch Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedBranchId}
                disabled={isBranchAdmin}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="h-10 px-3.5 pr-8 rounded-lg bg-[#181412] text-xs font-bold text-[#D4AF37] uppercase tracking-wider border border-[#2C2724] focus:outline-none focus:border-[#D4AF37] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {(isBranchAdmin && user?.branchId
                  ? branches.filter((b) => b.id === user.branchId)
                  : branches
                ).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none text-[16px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Branch Default Deposit Rule Strip */}
        <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
              Default Deposit Rule / መደበኛ ቅድመ ክፍያ
            </span>
            <div className="text-sm font-semibold text-[#FAF7F2] mt-0.5 flex items-center gap-2">
              <span className="text-[#D4AF37]">
                {currentBranch?.defaultDepositType === 'NONE'
                  ? 'No Deposit Required / ያለ ቅድመ ክፍያ'
                  : currentBranch?.defaultDepositType === 'PERCENTAGE'
                  ? `${currentBranch?.defaultDepositValue ?? 20}% of Service Price`
                  : `${currentBranch?.defaultDepositValue ?? 200} ETB Fixed Deposit`}
              </span>
              <span className="text-stone-500 text-xs">• Applies to all non-overridden services</span>
            </div>
          </div>

          <div>
            {!isEditingBranchDeposit ? (
              <button
                type="button"
                onClick={() => setIsEditingBranchDeposit(true)}
                className="px-3 py-1.5 rounded-lg bg-[#2C2724] hover:bg-[#38322e] text-xs font-semibold text-[#D4AF37] uppercase tracking-wider transition"
              >
                Edit Rule / ደንብ ቀይር
              </button>
            ) : (
              <form onSubmit={handleSaveBranchDeposit} className="flex items-center gap-2 flex-wrap">
                <select
                  value={branchDepositType}
                  onChange={(e) => setBranchDepositType(e.target.value as any)}
                  className="h-8 px-2 rounded bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724]"
                >
                  <option value="PERCENTAGE">Percent (%)</option>
                  <option value="FIXED">Fixed (ETB)</option>
                  <option value="NONE">None (0)</option>
                </select>
                {branchDepositType !== 'NONE' && (
                  <input
                    type="number"
                    min={0}
                    value={branchDepositValue}
                    onChange={(e) => setBranchDepositValue(Number(e.target.value))}
                    className="h-8 w-20 px-2 rounded bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724]"
                  />
                )}
                <button
                  type="submit"
                  disabled={isSavingBranchDeposit}
                  className="px-3 py-1 rounded bg-[#D4AF37] text-[#0E0B09] text-xs font-bold uppercase"
                >
                  Save / አስቀምጥ
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBranchDeposit(false)}
                  className="px-2 py-1 rounded bg-[#2C2724] text-stone-400 text-xs"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Search Ribbon */}
        <div className="bg-[#181412] p-3 rounded-xl border border-[#2C2724] mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services / አገልግሎት ፈልግ..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] placeholder-stone-500 border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-[#181412] rounded-xl border border-[#2C2724] overflow-hidden mb-8 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E0B09] text-stone-400 uppercase tracking-wider font-semibold border-b border-[#2C2724]">
                <tr>
                  <th className="py-3 px-4">Service / አገልግሎት</th>
                  <th className="py-3 px-4">Category / ምድብ</th>
                  <th className="py-3 px-4 text-right">Base Price / መነሻ</th>
                  <th className="py-3 px-4 text-right">Branch Price / ቅርንጫፍ</th>
                  <th className="py-3 px-4 text-center">Duration / ቆይታ</th>
                  <th className="py-3 px-4 text-center">Deposit / ቅድመ ክፍያ</th>
                  <th className="py-3 px-4 text-right">Actions / እርምጃዎች</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2724]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-2" />
                      <div>Loading branch pricing...</div>
                    </td>
                  </tr>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((s) => {
                    const branchPriceObj = s.branchPrices?.find((bp) => bp.branchId === selectedBranchId);
                    const isOverridden = !!branchPriceObj;
                    const effectivePrice = Number(s.effectivePrice ?? (branchPriceObj ? branchPriceObj.customPrice : s.basePrice));
                    const effectiveDuration = s.effectiveDuration ?? (branchPriceObj?.customDurationMinutes || s.durationMinutes);

                    // Deposit calculation label
                    let depositText = 'Branch Default';
                    if (branchPriceObj?.depositType) {
                      depositText =
                        branchPriceObj.depositType === 'NONE'
                          ? 'None (0 ETB)'
                          : branchPriceObj.depositType === 'PERCENTAGE'
                          ? `${branchPriceObj.depositValue}%`
                          : `${branchPriceObj.depositValue} ETB`;
                    } else if (s.depositType && s.depositType !== 'NONE') {
                      depositText =
                        s.depositType === 'PERCENTAGE' ? `${s.depositValue}%` : `${s.depositValue} ETB`;
                    } else if (currentBranch?.defaultDepositType) {
                      depositText =
                        currentBranch.defaultDepositType === 'NONE'
                          ? 'None (0 ETB)'
                          : currentBranch.defaultDepositType === 'PERCENTAGE'
                          ? `${currentBranch.defaultDepositValue}%`
                          : `${currentBranch.defaultDepositValue} ETB`;
                    }

                    return (
                      <tr key={s.id} className="hover:bg-[#201B18] transition">
                        <td className="py-3 px-4">
                          <span className="font-serif font-bold text-sm text-[#FAF7F2] block">{s.name}</span>
                          <span className="text-[11px] text-stone-400 font-serif block">
                            {s.nameAm || s.amharicName || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-300">
                          <span className="px-2 py-0.5 rounded bg-[#2C2724] text-[10px] font-semibold uppercase">
                            {s.category.split('&')[0].trim()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-stone-400">
                          {Number(s.basePrice).toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-[#D4AF37] font-serif text-sm">
                            {effectivePrice.toLocaleString()} ETB
                          </span>
                          {isOverridden && (
                            <span className="text-[9px] uppercase font-bold text-[#D4AF37] block">
                              Branch Override
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-stone-300">
                          {effectiveDuration} min
                        </td>
                        <td className="py-3 px-4 text-center text-stone-400">
                          <span className="text-xs font-semibold">{depositText}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openOverrideModal(s)}
                              className="px-2.5 py-1 rounded bg-[#2C2724] hover:bg-[#38322e] text-xs font-semibold text-[#D4AF37] uppercase tracking-wider transition"
                            >
                              Override / አስተካክል
                            </button>
                            <button
                              type="button"
                              onClick={() => openHistoryDrawer(s)}
                              className="p-1 rounded bg-[#2C2724] hover:bg-[#38322e] text-stone-400 hover:text-white transition"
                              title="Price History / ታሪክ"
                            >
                              <span className="material-symbols-outlined text-[16px]">history</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      No services match search / አገልግሎት አልተገኘም
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* OVERRIDE MODAL */}
        {overrideModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#181412] w-full max-w-md rounded-2xl border border-[#2C2724] shadow-2xl p-6 text-[#FAF7F2]">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2724] mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                    {currentBranch?.name}
                  </span>
                  <h2 className="text-base font-serif font-bold text-[#FAF7F2]">
                    Override Price / ዋጋ አስተካክል
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="text-stone-400 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveOverride} className="space-y-4">
                <div>
                  <span className="text-xs text-stone-400 block mb-0.5">Service:</span>
                  <p className="font-bold text-sm text-[#FAF7F2]">{selectedService.name}</p>
                  <p className="text-xs text-stone-400">
                    Master Base Price: {Number(selectedService.basePrice).toLocaleString()} ETB
                  </p>
                </div>

                {/* Custom Branch Price */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Branch Price (ETB) / ቅርንጫፍ ዋጋ *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Custom Duration (Optional) */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Custom Duration (min) / የተለየ ቆይታ
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={customDuration}
                    onChange={(e) =>
                      setCustomDuration(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder={`Default: ${selectedService.durationMinutes} min`}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Deposit Override */}
                <div className="p-3 bg-[#0E0B09] rounded-xl border border-[#2C2724]">
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
                    Deposit Override / ቅድመ ክፍያ
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {(['DEFAULT', 'NONE', 'PERCENTAGE', 'FIXED'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setOverrideDepositType(mode)}
                        className={`py-1.5 px-2 rounded text-[11px] font-semibold uppercase tracking-wider transition ${
                          overrideDepositType === mode
                            ? 'bg-[#D4AF37] text-[#0E0B09]'
                            : 'bg-[#181412] text-stone-400 hover:text-white border border-[#2C2724]'
                        }`}
                      >
                        {mode === 'DEFAULT'
                          ? 'Default'
                          : mode === 'NONE'
                          ? 'None'
                          : mode === 'PERCENTAGE'
                          ? 'Percent (%)'
                          : 'Fixed (ETB)'}
                      </button>
                    ))}
                  </div>

                  {overrideDepositType === 'PERCENTAGE' && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={overrideDepositValue}
                      onChange={(e) => setOverrideDepositValue(Number(e.target.value))}
                      placeholder="Deposit %"
                      className="w-full h-8 px-2 mt-1 rounded bg-[#181412] text-xs text-[#FAF7F2] border border-[#2C2724]"
                    />
                  )}

                  {overrideDepositType === 'FIXED' && (
                    <input
                      type="number"
                      min={0}
                      value={overrideDepositValue}
                      onChange={(e) => setOverrideDepositValue(Number(e.target.value))}
                      placeholder="Fixed ETB Deposit"
                      className="w-full h-8 px-2 mt-1 rounded bg-[#181412] text-xs text-[#FAF7F2] border border-[#2C2724]"
                    />
                  )}
                </div>

                {/* Reason for Audit Log / Proposal */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    {isBranchAdmin ? 'Reason for Change / የለውጡ ምክንያት *' : 'Reason / ምክንያት (Audit Log)'}
                  </label>
                  <input
                    type="text"
                    required={isBranchAdmin}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      isBranchAdmin
                        ? 'Mandatory reason for Owner approval...'
                        : 'e.g. VIP pricing tier or festival promotion'
                    }
                    className={`w-full h-9 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border focus:outline-none focus:border-[#D4AF37] ${
                      isBranchAdmin && !reason.trim() ? 'border-amber-600/70' : 'border-[#2C2724]'
                    }`}
                  />
                  {isBranchAdmin && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      Branch modifications require Owner authorization / ማሻሻያው የባለቤት ፈቃድ ያስፈልገዋል
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-[#2C2724] text-xs font-semibold uppercase text-stone-300"
                  >
                    Cancel / ሰርዝ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOverride || (isBranchAdmin && !reason.trim())}
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase disabled:opacity-50"
                  >
                    {isSavingOverride
                      ? 'Saving...'
                      : isBranchAdmin
                      ? 'Submit Request / ጥያቄ ላክ'
                      : 'Save Override / አስቀምጥ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRICE HISTORY AUDIT DRAWER */}
        {historyDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#181412] w-full max-w-lg h-full border-l border-[#2C2724] shadow-2xl p-6 text-[#FAF7F2] flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#2C2724] mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">
                      Audit Trail / ኦዲት
                    </span>
                    <h2 className="text-base font-serif font-bold text-[#D4AF37]">
                      Price History / የዋጋ ታሪክ
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryDrawerOpen(false)}
                    className="text-stone-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {historyService && (
                  <div className="mb-4 p-3 bg-[#0E0B09] rounded-xl border border-[#2C2724]">
                    <div className="font-bold text-sm text-[#FAF7F2]">{historyService.name}</div>
                    <div className="text-xs text-stone-400 font-serif">
                      {historyService.nameAm || historyService.amharicName || '—'}
                    </div>
                  </div>
                )}

                {loadingHistory ? (
                  <div className="py-12 text-center text-stone-400">
                    <div className="inline-block w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-2" />
                    <div className="text-xs">Loading audit records...</div>
                  </div>
                ) : priceHistory.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                    {priceHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-[#0E0B09] rounded-lg border border-[#2C2724] text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#D4AF37] text-sm font-serif">
                            {Number(item.price).toLocaleString()} ETB
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#181412] text-[10px] font-semibold text-stone-300">
                            {item.branch ? item.branch.name : 'Global / ዓለምአቀፍ'}
                          </span>
                        </div>
                        <div className="text-stone-400 text-[11px] flex items-center justify-between">
                          <span>By: {item.changedBy}</span>
                          <span>{new Date(item.effectiveFrom).toLocaleDateString()}</span>
                        </div>
                        {item.reason && (
                          <div className="text-stone-300 text-[11px] mt-1 italic">
                            "{item.reason}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    No price history recorded yet.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#2C2724]">
                <button
                  type="button"
                  onClick={() => setHistoryDrawerOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-[#2C2724] hover:bg-[#38322e] text-xs font-semibold uppercase tracking-wider text-stone-300"
                >
                  Close / ዝጋ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BranchServiceGovernancePage;
