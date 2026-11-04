import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  serviceApi,
  BranchGovernanceData,
  UpdateBranchRulePayload,
  ServiceRitual,
} from '../../../api/serviceApi';

export const BranchServiceGovernancePage: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('bole-bulbula');
  const [governanceData, setGovernanceData] = useState<BranchGovernanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState<boolean>(false);

  // Drawer / Modal state for editing a branch rule
  const [editingRitual, setEditingRitual] = useState<
    | (ServiceRitual & {
        localPrice: number;
        localTurnaround: number;
        localDeposit: number;
        localWorkstation: string;
        isBranchActive: boolean;
      })
    | null
  >(null);
  const [drawerForm, setDrawerForm] = useState<UpdateBranchRulePayload>({
    customPrice: 1200,
    customTurnaround: 15,
    requiredDeposit: 400,
    workstationLock: 'Suite Gold-1',
    isActive: true,
  });
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false);

  const branches = [
    {
      id: 'b-bole',
      slug: 'bole-bulbula',
      name: 'Bole Bulbula Sanctuary',
      location: 'Morning Star Mall, 3rd Floor',
    },
    {
      id: 'b-kazanchis',
      slug: 'kazanchis',
      name: 'Kazanchis VIP Sanctuary',
      location: 'ECA Quartier',
    },
    {
      id: 'b-cmc',
      slug: 'cmc',
      name: 'CMC Luxury Pavilions',
      location: 'Heights Blvd',
    },
  ];

  const fetchGovernance = async (branchSlug: string) => {
    setLoading(true);
    try {
      const data = await serviceApi.getBranchGovernance(branchSlug);
      setGovernanceData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernance(selectedBranch);
  }, [selectedBranch]);

  const handleOpenDrawer = (
    ritual: ServiceRitual & {
      localPrice: number;
      localTurnaround: number;
      localDeposit: number;
      localWorkstation: string;
      isBranchActive: boolean;
    }
  ) => {
    setEditingRitual(ritual);
    setDrawerForm({
      customPrice: ritual.localPrice,
      customTurnaround: ritual.localTurnaround,
      requiredDeposit: ritual.localDeposit,
      workstationLock: ritual.localWorkstation,
      isActive: ritual.isBranchActive,
    });
  };

  const handleSaveDrawerRule = async () => {
    if (!editingRitual || !governanceData) return;
    setIsSavingRule(true);
    try {
      await serviceApi.updateBranchRules(
        editingRitual.id,
        governanceData.branch.id,
        drawerForm
      );
      setNotification(
        `✨ Branch rule for "${editingRitual.name}" at ${governanceData.branch.name} updated successfully.`
      );
      setEditingRitual(null);
      fetchGovernance(selectedBranch);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(`Could not save rule: ${err.message}`);
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleQuickToggleActive = async (ritualId: string, currentActive: boolean) => {
    if (!governanceData) return;
    try {
      await serviceApi.updateBranchRules(ritualId, governanceData.branch.id, {
        isActive: !currentActive,
      });
      fetchGovernance(selectedBranch);
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const filteredRituals = governanceData?.rituals.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      (r.amharicName && r.amharicName.includes(q))
    );
  });

  // Calculate live yield for drawer
  const editPrice = drawerForm.customPrice || 0;
  const specialistCut = Math.round(editPrice * 0.15); // Standard 15% branch baseline
  const netYield = editPrice - specialistCut;

  return (
    <AdminLayout
      activePath="/admin/services"
      selectedBranch={selectedBranch}
      onBranchChange={(b) => setSelectedBranch(b)}
    >
      <div className="relative w-full">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-10 right-20 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-64 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Floating Notification */}
        {notification && (
          <div className="mb-4 p-4 rounded-xl bg-inverse-surface text-surface-bright flex items-center justify-between shadow-xl border border-primary-container/30">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-fixed">info</span>
              <span className="text-sm font-medium">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-surface-dim hover:text-white text-xs uppercase tracking-wider"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Breadcrumb & Mode Notice */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Link to="/admin/services" className="hover:text-primary transition-colors">
              Services &amp; Rituals
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-primary transition-colors">Branch Management</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold capitalize">
              {selectedBranch.replace('-', ' ')}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 bg-inverse-surface text-surface-bright px-3.5 py-1.5 rounded-full shadow-sm text-xs">
            <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]">
              verified_user
            </span>
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Owner Clearance Mode — Multi-Branch Override
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-secondary-fixed-dim" />
            <span className="hidden sm:inline text-secondary-fixed-dim text-[10px]">
              Branch Admins limited to local pricing &amp; status
            </span>
          </div>
        </div>

        {/* Header & Branch Switcher Hub */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div className="max-w-3xl">
            {/* Branch Quick Selector */}
            <div className="relative inline-block mb-2">
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center gap-2.5 bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all text-left border border-surface-container-high"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-secondary uppercase tracking-widest leading-none font-semibold">
                    Operating Sanctuary
                  </span>
                  <span className="font-serif text-sm font-semibold text-on-surface tracking-tight mt-0.5">
                    {governanceData?.branch.name || 'Bole Bulbula Sanctuary'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-primary ml-1 text-[20px]">
                  unfold_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {branchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl py-2 z-30 border border-surface-container-high animate-fade-in">
                  <div className="px-4 py-1 text-secondary text-[10px] uppercase font-bold tracking-wider">
                    Switch Sanctuary
                  </div>
                  {branches.map((b) => (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => {
                        setSelectedBranch(b.slug);
                        setBranchDropdownOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-semibold ${
                            selectedBranch === b.slug ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {b.name}
                        </span>
                        <span className="text-[10px] text-secondary">{b.location}</span>
                      </div>
                      {selectedBranch === b.slug && (
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface font-normal tracking-tight">
              Branch Ritual Governance &amp; Pricing Engine
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Configure branch-specific pricing in ETB, local turnaround buffers, workstation locks, and active booking availability for {governanceData?.branch.name || 'Bole Bulbula'}.
            </p>
          </div>

          {/* Top Action Group */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
            <button
              type="button"
              onClick={() => fetchGovernance(selectedBranch)}
              className="flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface px-3.5 py-2 rounded-xl shadow-sm text-xs font-semibold uppercase tracking-wider transition-all border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">cloud_sync</span>
              <span>Sync Engine</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Synchronized master ritual catalog rules.')}
              className="flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface px-3.5 py-2 rounded-xl shadow-sm text-xs font-semibold uppercase tracking-wider transition-all border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">input</span>
              <span>Import Specs</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Exporting branch governance matrix schedule PDF...')}
              className="flex items-center gap-1.5 bg-inverse-surface hover:bg-on-background text-surface-bright px-4 py-2 rounded-xl shadow-md text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">picture_as_pdf</span>
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Branch Metrics Summary Bar (4 Cards Bento) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                Active Rituals
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">spa</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-semibold text-on-surface">
                  {governanceData?.metrics.activeBranchRituals || 22}
                </span>
                <span className="text-xs text-secondary">
                  of {governanceData?.metrics.totalMasterRituals || 24} Available
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full"
                  style={{ width: `${governanceData?.metrics.offeringPercentage || 91.7}%` }}
                />
              </div>
              <p className="text-[11px] text-primary font-semibold mt-1.5">
                {governanceData?.metrics.offeringPercentage || 91.7}% branch menu offering
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                Average Ticket Price
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl font-semibold text-on-surface">
                  {governanceData?.metrics.averageTicketPrice || 820}
                </span>
                <span className="text-xs font-bold text-primary">ETB</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-secondary font-medium">
                <span>Kazanchis: 890 ETB</span>
                <span>•</span>
                <span>CMC: 780 ETB</span>
              </div>
              <p className="text-[11px] text-secondary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">trending_up</span>
                Optimized for local clientele
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                Daily Chair Capacity
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">chair</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-semibold text-on-surface">
                  {governanceData?.metrics.dailyCapacitySlots || 48}
                </span>
                <span className="text-xs text-secondary">Appointment Slots</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-inverse-surface h-full rounded-full"
                  style={{ width: `${governanceData?.metrics.occupancyRate || 92}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface font-semibold mt-1.5">
                Occupancy running at {governanceData?.metrics.occupancyRate || 92}%
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                Qualified Specialists
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-semibold text-on-surface">
                  {governanceData?.metrics.totalQualifiedSpecialists || 18}
                </span>
                <span className="text-xs text-secondary">On-site Staff</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-secondary font-medium">
                <span>Roster Coverage: 100%</span>
                <span>•</span>
                <span>+3 Floaters</span>
              </div>
              <p className="text-[11px] text-primary font-semibold mt-1.5">
                All 6 Master Rituals Covered
              </p>
            </div>
          </div>
        </div>

        {/* Governance Controls Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-surface-container-high/60">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rituals by code or name to adjust local rules..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Branch Status:</span>
            <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container font-bold text-[10px] uppercase">
              Online &amp; Taking Bookings
            </span>
          </div>
        </div>

        {/* Governance Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-container-high">
                <tr>
                  <th className="py-3 px-4">Code &amp; Guild</th>
                  <th className="py-3 px-4">Ritual Specification</th>
                  <th className="py-3 px-4 text-center">Master Base</th>
                  <th className="py-3 px-4 text-center">Branch Price</th>
                  <th className="py-3 px-4 text-center">Local Turnaround</th>
                  <th className="py-3 px-4 text-center">Workstation Lock</th>
                  <th className="py-3 px-4 text-center">Branch Active</th>
                  <th className="py-3 px-4 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-secondary">
                      <div className="inline-block w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                      <div className="text-xs">Loading branch governance parameters...</div>
                    </td>
                  </tr>
                ) : filteredRituals && filteredRituals.length > 0 ? (
                  filteredRituals.map((ritual) => {
                    return (
                      <tr key={ritual.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary block">#{ritual.code}</span>
                          <span className="text-[10px] text-secondary uppercase block">
                            {ritual.category.split('&')[0].trim()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/admin/services/${ritual.id}`}
                            className="font-serif font-bold text-sm text-on-surface hover:text-primary transition-colors block"
                          >
                            {ritual.name}
                          </Link>
                          <span className="font-serif text-secondary text-[11px] block italic">
                            {ritual.amharicName || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-secondary font-medium">
                            {ritual.basePrice.toLocaleString()} ETB
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-on-surface text-sm">
                            {ritual.localPrice.toLocaleString()} ETB
                          </span>
                          {ritual.localPrice !== ritual.basePrice && (
                            <span className="text-[9px] uppercase font-bold text-primary block">
                              Branch Override
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-on-surface">
                            +{ritual.localTurnaround} min
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-semibold">
                            {ritual.localWorkstation}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleQuickToggleActive(ritual.id, ritual.isBranchActive)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ritual.isBranchActive
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-surface-container-high text-secondary'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ritual.isBranchActive ? 'bg-primary animate-pulse' : 'bg-outline'
                              }`}
                            />
                            {ritual.isBranchActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(ritual)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              tune
                            </span>
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-secondary">
                      No rituals match your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-out / Modal Drawer for Editing Branch Rules */}
        {editingRitual && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-surface-container-high">
              <div>
                {/* Drawer Header */}
                <div className="flex items-start justify-between pb-4 border-b border-surface-container-high">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-inverse-surface text-primary-fixed text-xs px-2 py-0.5 rounded font-mono font-bold">
                        #{editingRitual.code}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-secondary font-bold">
                        Local Branch Rule
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-on-surface mt-1">
                      {editingRitual.name}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5">
                      Sanctuary: <strong className="text-on-surface">{governanceData?.branch.name}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRitual(null)}
                    className="p-1 rounded-lg text-secondary hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Drawer Form Fields */}
                <div className="flex flex-col gap-4 mt-6">
                  {/* Branch Configured Price */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold flex items-center justify-between">
                      <span>Branch Retail Price (ETB)</span>
                      <span className="text-[10px] text-outline font-normal">
                        Master Spec: {editingRitual.basePrice} ETB
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={drawerForm.customPrice || 0}
                        onChange={(e) =>
                          setDrawerForm({ ...drawerForm, customPrice: Number(e.target.value) || 0 })
                        }
                        className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary">
                        ETB
                      </span>
                    </div>
                  </div>

                  {/* Real-time Yield Calculator */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block mb-1">
                      Live Financial Yield Calculator
                    </span>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-secondary">Specialist Commission (15%):</span>
                      <span className="font-semibold text-primary">{specialistCut.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-surface-container-high/60 mt-1">
                      <span className="text-on-surface font-semibold">Net Salon Operating Yield:</span>
                      <span className="font-bold text-on-surface text-sm">{netYield.toLocaleString()} ETB</span>
                    </div>
                  </div>

                  {/* Required Deposit */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                      Required Guest Deposit (ETB)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={drawerForm.requiredDeposit || 0}
                        onChange={(e) =>
                          setDrawerForm({
                            ...drawerForm,
                            requiredDeposit: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary">
                        ETB
                      </span>
                    </div>
                  </div>

                  {/* Turnaround Buffer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                      Local Suite Turnaround Buffer
                    </label>
                    <select
                      value={drawerForm.customTurnaround || 15}
                      onChange={(e) =>
                        setDrawerForm({
                          ...drawerForm,
                          customTurnaround: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                    >
                      <option value={10}>+10 Minutes</option>
                      <option value={15}>+15 Minutes (Standard)</option>
                      <option value={20}>+20 Minutes (Peak Hours)</option>
                      <option value={30}>+30 Minutes (Bridal Restock)</option>
                    </select>
                  </div>

                  {/* Workstation Lock */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                      Sanctuary Workstation Suite Lock
                    </label>
                    <input
                      type="text"
                      value={drawerForm.workstationLock || ''}
                      onChange={(e) =>
                        setDrawerForm({ ...drawerForm, workstationLock: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      placeholder="e.g. Suite Gold-1"
                    />
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">
                        Enable for Online Booking
                      </span>
                      <span className="text-[10px] text-secondary">
                        Controls whether guests at this branch can reserve this ritual.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDrawerForm({ ...drawerForm, isActive: !drawerForm.isActive })
                      }
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        drawerForm.isActive ? 'bg-primary-container' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-surface-container-lowest shadow-sm transform transition-transform ${
                          drawerForm.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Calendar Preservation Notice */}
                  <div className="p-3 rounded-xl bg-surface-container-high/40 text-[11px] text-secondary flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                      info
                    </span>
                    <span>
                      Historical and future booked guest appointments will remain valid with their original lock terms even after adjusting pricing.
                    </span>
                  </div>
                </div>
              </div>

              {/* Drawer Action Footer */}
              <div className="pt-4 border-t border-surface-container-high flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingRitual(null)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDrawerRule}
                  disabled={isSavingRule}
                  className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_2px_rgba(212,175,55,0.28)] disabled:opacity-50"
                >
                  {isSavingRule ? 'Saving Rule...' : 'Save Branch Rule'}
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
