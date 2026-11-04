import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { serviceApi, ServiceRitual } from '../../../api/serviceApi';

export const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ritual, setRitual] = useState<ServiceRitual | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  useEffect(() => {
    const fetchDossier = async () => {
      setLoading(true);
      try {
        const data = await serviceApi.getServiceById(id || 'srv-101');
        setRitual(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDossier();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!ritual) return;
    setIsDeactivating(true);
    try {
      const res = await serviceApi.toggleServiceStatus(ritual.id);
      setRitual((prev) => (prev ? { ...prev, status: res.service.status } : null));
      if (res.warningCount > 0) {
        setNotification(`⚠️ ${res.message} (${res.warningCount} upcoming guest bookings preserved)`);
      } else {
        setNotification(`✨ Ritual "${ritual.name}" status updated to ${res.service.status ? 'Active' : 'Inactive'}.`);
      }
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(`Could not toggle status: ${err.message}`);
    } finally {
      setIsDeactivating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout activePath="/admin/services">
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!ritual) {
    return (
      <AdminLayout activePath="/admin/services">
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center">
          <h2 className="font-serif text-xl font-bold text-on-surface">Ritual Dossier Not Found</h2>
          <button
            onClick={() => navigate('/admin/services')}
            className="mt-4 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider"
          >
            Back to Catalog
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePath="/admin/services">
      <div className="relative w-full">
        {/* Subtle Ambient Glow Element */}
        <div className="absolute -top-24 right-12 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Notification Toast */}
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

        {/* Breadcrumbs & Quick Access Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <nav className="flex items-center gap-2 text-on-surface-variant text-xs">
            <Link to="/admin/services" className="hover:text-primary transition-colors font-medium">
              Services &amp; Rituals
            </Link>
            <span className="text-outline text-[11px]">/</span>
            <Link to="/admin/services" className="hover:text-primary transition-colors font-medium">
              Catalog
            </Link>
            <span className="text-outline text-[11px]">/</span>
            <span className="text-primary font-semibold truncate max-w-xs sm:max-w-md">
              {ritual.name} (#{ritual.code})
            </span>
          </nav>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold tracking-widest uppercase">
              Version 3.4.1
            </span>
            <span className="px-3 py-1 rounded-full bg-primary-fixed/40 text-on-tertiary-fixed-variant text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Spec
            </span>
          </div>
        </div>

        {/* Header Executive Briefing Block */}
        <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm mb-6 border border-surface-container-high/60">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-inverse-surface text-primary-fixed text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  #{ritual.code}
                </span>
                <span className="text-on-surface-variant text-xs uppercase tracking-widest font-semibold">
                  {ritual.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                    ritual.status
                      ? 'bg-primary-container/20 text-primary'
                      : 'bg-error-container/20 text-error'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ritual.status ? 'bg-primary animate-pulse' : 'bg-error'
                    }`}
                  />
                  {ritual.status ? 'Active in 3 of 3 Sanctuaries' : 'Deactivated / Preserved Archive'}
                </span>
              </div>

              <div className="mt-1">
                <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight leading-tight">
                  {ritual.name}
                </h1>
                <p className="font-serif text-lg text-primary italic mt-0.5">
                  {ritual.amharicName || 'የሙሽራ የፀጉር አሰራር'}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-secondary leading-relaxed max-w-2xl mt-1">
                {ritual.description || 'Imperial bridal coiffure engineered with heirloom braiding architectures.'}
              </p>
            </div>

            {/* Header Action Cluster */}
            <div className="flex flex-wrap items-center gap-2.5 xl:self-center">
              <button
                type="button"
                onClick={() => alert(`Exporting PDF specification dossier for #${ritual.code}...`)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider transition-all border border-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">picture_as_pdf</span>
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/services/create')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider transition-all border border-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">content_copy</span>
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isDeactivating}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  ritual.status
                    ? 'bg-surface-container-low hover:bg-error-container hover:text-error text-secondary border border-surface-container-high'
                    : 'bg-primary-container text-on-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {ritual.status ? 'power_settings_new' : 'check_circle'}
                </span>
                <span>{ritual.status ? 'Deactivate' : 'Reactivate'}</span>
              </button>
              <Link
                to="/admin/services/branch-governance"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_2px_rgba(212,175,55,0.28)]"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Branch Governance</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid (Two-Column Asymmetrical Luxury Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Visual Media & Operational Architecture (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Hero Photograph Card & Sensory Narrative */}
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col border border-surface-container-high/60 group">
              <div className="relative w-full h-80 sm:h-96 overflow-hidden bg-surface-container">
                <img
                  src={
                    ritual.imageUrl ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBhXpuwSeMXFO5Iir8pCbkmEsFJocEEJCq4rXtkg62rfLuTS1gtFCs-AJwJGpg_6PccZ1uOlcwHMmH-Sx7CAFnk_WTRWg4FY2sG9R_rbdTMlrhKJ4UNMAV4G_QdLUqSw-rtAWiIMblVS_VnvqBBLcNfZCW8SMAJlHa4yPh6TNte3Mzy7C77rWlFPjjVxcnaAjrXhvsFof6lJPq8-5OSFIqIQILnNb1hs1irh_psfGiq'
                  }
                  alt={ritual.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/40 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full bg-inverse-surface/80 backdrop-blur-md text-primary-fixed text-[11px] uppercase tracking-widest font-bold shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed">hotel_class</span>
                    Flagship Signature Ritual • Guild Tier II
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex flex-col text-surface-bright">
                    <span className="text-[10px] uppercase tracking-widest text-primary-fixed-dim font-bold">
                      Sanctuary Treatment Suite
                    </span>
                    <span className="font-serif text-xl sm:text-2xl tracking-tight leading-snug">
                      Ancestral Haute Coiffure
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-inverse-surface/90 backdrop-blur-sm px-3.5 py-2 rounded-xl text-surface-bright">
                    <span className="material-symbols-outlined text-primary-fixed text-[20px]">
                      nest_clock_farsight_analog
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] uppercase text-surface-dim font-semibold">Hands-on</span>
                      <span className="font-serif text-sm font-bold text-primary-fixed">
                        {ritual.durationMinutes} Min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-xs uppercase tracking-[0.14em] text-primary font-bold mb-1.5">
                    Curatorial Narrative
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                    {ritual.description ||
                      'The quintessential Eyob bridal experience. Curated for Habesha weddings and royal celebratory galas, this ritual fuses ancestral cornrow styling, intricate high-crown updos, golden filigree positioning, and 24-hour humidity-resistant setting techniques. Includes private bridal suite hospitality with traditional spiced tea and botanical aura misting.'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="bg-surface-container-low p-3 rounded-xl flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-1">water_drop</span>
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Moisture Retention
                    </span>
                    <span className="text-xs text-on-surface font-semibold mt-0.5">Micro-Steam Infusion</span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-1">lock_clock</span>
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Sculpt Hold
                    </span>
                    <span className="text-xs text-on-surface font-semibold mt-0.5">24h Humidity Guard</span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-1">clean_hands</span>
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Tension Metric
                    </span>
                    <span className="text-xs text-on-surface font-semibold mt-0.5">Gentle Ergonomics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Pacing, Duration & Turnaround Breakdown */}
            <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">timelapse</span>
                  <h2 className="font-serif text-lg text-on-surface font-semibold">
                    Pacing &amp; Turnaround Architecture
                  </h2>
                </div>
                <span className="px-3 py-1 rounded bg-surface-container text-secondary text-[10px] uppercase tracking-widest font-bold">
                  Strict Timing Protocol
                </span>
              </div>

              {/* Metric Highlight Banner */}
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-surface-container-high">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-secondary font-semibold">
                      Active Ritual Duration
                    </span>
                    <span className="font-serif text-lg text-on-surface font-bold">
                      {ritual.durationMinutes} Minutes Active Work
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-secondary block">
                      Turnaround Buffer
                    </span>
                    <span className="text-sm font-bold text-primary">+{ritual.turnaroundBuffer} Min Reset</span>
                  </div>
                </div>
              </div>

              {/* 5-Stage Chronological Timeline Bar */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  Chronological Pacing Stages
                </span>
                <div className="space-y-2">
                  {[
                    { stage: '1', title: 'Botanical Cleansing & Scalp Prep', duration: '15 min', type: 'prep' },
                    { stage: '2', title: 'Ancestral Micro-Braiding Architecture', duration: '30 min', type: 'active' },
                    { stage: '3', title: 'Sculpted Updo & Crown Anchoring', duration: '35 min', type: 'active' },
                    { stage: '4', title: 'Veil Securing & Finishing Mist', duration: '10 min', type: 'active' },
                    { stage: '5', title: 'Suite Turnaround & UV Sterilization', duration: `${ritual.turnaroundBuffer} min`, type: 'buffer' },
                  ].map((s) => (
                    <div
                      key={s.stage}
                      className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container-high text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-[11px] text-on-surface">
                          {s.stage}
                        </span>
                        <span className="font-medium text-on-surface">{s.title}</span>
                      </div>
                      <span className="font-semibold text-primary">{s.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Sanctuary Station & Consumable Kit */}
            <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">chair</span>
                  <h2 className="font-serif text-lg text-on-surface font-semibold">
                    Station &amp; Apothecary Consumable Kit
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[10px] uppercase text-secondary block font-semibold">
                    Sanctuary Station Lock
                  </span>
                  <span className="text-sm font-bold text-on-surface mt-0.5 block">
                    {ritual.workstationType || 'Private Bridal Suite & Styling Throne'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[10px] uppercase text-secondary block font-semibold">
                    Specialist Guild Prerequisite
                  </span>
                  <span className="text-sm font-bold text-primary mt-0.5 block">
                    {ritual.minGuildRank || 'Master Specialist (Guild Tier II)'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold block mb-2">
                  Required Apothecary &amp; Hygiene Protocols
                </span>
                <div className="space-y-1.5">
                  {(ritual.requiredProtocols && ritual.requiredProtocols.length > 0
                    ? ritual.requiredProtocols
                    : [
                        'Micro-Steam Infusion',
                        '24h Humidity Setting Spray',
                        'Albo Filigree Anchoring',
                        'Botanical Aura Misting',
                      ]
                  ).map((protocol, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-low text-xs text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                      <span>{protocol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Multi-Branch Pricing Matrix & Specialists (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* 1. Multi-Branch Sanctuary Pricing Matrix */}
            <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-on-surface">
                    Multi-Branch Sanctuary Pricing
                  </h3>
                  <p className="text-xs text-secondary">
                    Local pricing tiers and booking deposit rules across Addis Ababa.
                  </p>
                </div>
                <Link
                  to="/admin/services/branch-governance"
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span>Edit</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Bole Bulbula Suite',
                    slug: 'bole-bulbula',
                    price: 1200,
                    deposit: 400,
                    buffer: '+15m buffer',
                    suite: 'Suite Gold-1',
                  },
                  {
                    name: 'Kazanchis VIP Sanctuary',
                    slug: 'kazanchis',
                    price: 1400,
                    deposit: 500,
                    buffer: '+20m buffer',
                    suite: 'VIP Pavilion A',
                  },
                  {
                    name: 'CMC Luxury Pavilions',
                    slug: 'cmc',
                    price: 1150,
                    deposit: 350,
                    buffer: '+15m buffer',
                    suite: 'CMC Suite 3',
                  },
                ].map((b) => {
                  const bRule = ritual.branchServices?.find((br) => br.branchId.includes(b.slug) || br.branch?.slug.includes(b.slug));
                  const effectiveCustomPrice = bRule?.customPrice ?? b.price;
                  const effectiveDeposit = bRule?.requiredDeposit ?? b.deposit;

                  return (
                    <div
                      key={b.slug}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface">{b.name}</span>
                        <span className="text-[10px] text-secondary">
                          Deposit: {effectiveDeposit} ETB • {b.buffer}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-base font-bold text-primary">
                          {effectiveCustomPrice.toLocaleString()} ETB
                        </span>
                        <span className="text-[10px] text-outline block font-medium">
                          {bRule?.workstationLock || b.suite}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. 30-Day Ritual Performance & Financial Yield */}
            <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <h3 className="font-serif text-lg font-semibold text-on-surface mb-1">
                30-Day Performance &amp; Yield
              </h3>
              <p className="text-xs text-secondary mb-4">
                Operational turnover and guest satisfaction metrics for #{ritual.code}.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[10px] uppercase text-secondary font-semibold block">
                    Revenue Yield
                  </span>
                  <span className="font-serif text-lg font-bold text-on-surface mt-0.5 block">
                    252,000 ETB
                  </span>
                  <span className="text-[10px] text-primary font-medium">+14% vs last mo</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[10px] uppercase text-secondary font-semibold block">
                    Appointments
                  </span>
                  <span className="font-serif text-lg font-bold text-on-surface mt-0.5 block">
                    180 Completed
                  </span>
                  <span className="text-[10px] text-secondary font-medium">96% fulfillment</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[10px] uppercase text-secondary font-semibold block">
                    Guest Rating
                  </span>
                  <span className="font-serif text-lg font-bold text-primary mt-0.5 block">
                    ★ 4.98 / 5.0
                  </span>
                  <span className="text-[10px] text-secondary font-medium">142 reviews</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <span className="text-[10px] uppercase text-secondary font-semibold block">
                    Re-booking Rate
                  </span>
                  <span className="font-serif text-lg font-bold text-on-surface mt-0.5 block">
                    88%
                  </span>
                  <span className="text-[10px] text-secondary font-medium">VIP loyalty tier</span>
                </div>
              </div>

              {/* Distribution bar */}
              <div>
                <div className="flex justify-between text-xs text-secondary mb-1">
                  <span>Branch Share Distribution</span>
                  <span className="font-semibold text-on-surface">Bole 44% • Kaz 38% • CMC 18%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-container-high">
                  <div className="bg-primary h-full" style={{ width: '44%' }} title="Bole 44%" />
                  <div className="bg-primary-container h-full" style={{ width: '38%' }} title="Kazanchis 38%" />
                  <div className="bg-secondary-fixed-dim h-full" style={{ width: '18%' }} title="CMC 18%" />
                </div>
              </div>
            </div>

            {/* 3. Qualified Specialist Roster */}
            <div className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-on-surface">
                    Certified Specialists
                  </h3>
                  <p className="text-xs text-secondary">
                    Artisans certified to conduct this ritual on-sanctuary.
                  </p>
                </div>
                <Link
                  to="/admin/employees"
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Manage Roster
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: 'Sara Ahmed',
                    amharic: 'ሳራ አህመድ',
                    title: 'Senior Master Stylist',
                    branch: 'Bole Bulbula',
                    rating: 4.95,
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  },
                  {
                    name: 'Tigist G.',
                    amharic: 'ትዕግስት ገብሬ',
                    title: 'Bridal Texture Artisan',
                    branch: 'Bole Bulbula',
                    rating: 4.98,
                    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
                  },
                  {
                    name: 'Helen T.',
                    amharic: 'ሄለን ተስፋዬ',
                    title: 'Haute Updo Specialist',
                    branch: 'Kazanchis VIP',
                    rating: 4.92,
                    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
                  },
                ].map((spec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={spec.avatar}
                        alt={spec.name}
                        className="w-10 h-10 rounded-full object-cover border border-primary/30"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface">{spec.name}</span>
                        <span className="text-[10px] text-secondary font-medium">
                          {spec.title} • {spec.branch}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-primary">★ {spec.rating}</span>
                      <span className="text-[10px] text-outline block">Certified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ServiceDetailsPage;
