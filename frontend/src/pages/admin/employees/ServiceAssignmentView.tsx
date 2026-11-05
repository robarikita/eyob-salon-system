import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';

interface RitualItem {
  id: string;
  code: string;
  name: string;
  category: 'hair' | 'bridal' | 'therapy' | 'scalp' | 'facial' | 'nails';
  categoryLabel: string;
  standardDuration: number;
  customDuration: number;
  paceBadge?: string;
  basePrice: number;
  tier: string;
  commissionRate: number;
  assigned: boolean;
  lockedReason?: string;
  image: string;
  alt: string;
}

export const ServiceAssignmentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [rituals, setRituals] = useState<RitualItem[]>([
    {
      id: 'srv-1',
      code: '#SR-201',
      name: 'Hair Styling & Couture Cut',
      category: 'hair',
      categoryLabel: 'Hair',
      standardDuration: 60,
      customDuration: 60,
      basePrice: 500,
      tier: 'Master Stylist',
      commissionRate: 15,
      assigned: true,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAajVFBoi6wTcJCE6KZ9w83jOp0_Sn8YLjxvJKECGGLwFNs4TVJAZUzxA-CE6OErOnCQQ2SfU3YnvmJjnWZczy11ozlceH6hOBcvYrvwl1CIr1uinckO3SN1B5rWRs4MJc2l6u9VvKuZjAmakx1OvmSryjxI8C8fzB_659j1rxXFUMEj0ORqLDkz_z3mLEbGTExutnV_-m6a0TuHy-WDrF6l-WpqEYkqeXebyjxyHML',
      alt: 'Hair Styling',
    },
    {
      id: 'srv-2',
      code: '#SR-310',
      name: 'Bridal Hair & Haute Couture Updo',
      category: 'bridal',
      categoryLabel: 'Bridal',
      standardDuration: 90,
      customDuration: 75,
      paceBadge: 'Expert Pace (-15m)',
      basePrice: 1200,
      tier: 'Master Stylist',
      commissionRate: 18,
      assigned: true,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBTKgNgvJ3fi3GLtk3HyEH5AsuZKTEEQ1LKNwOT-33lhobHAays-k1n8a_JPt0Q0mnchab52oXTskxFogQqiKARqAnXEYgbdoUFV2BOFZ75-A6de-TQjH9N3AQnanc0sdZE74AU6x7Up0oVvuqrZ6CrmwTu9OrRfvHrSiiZAKzdlFhA-EIRXNoyVaez5xTqOWTYPym3DqJBRsPZ36P80bXQrcoQOn9cukJ_-16Wr_4v',
      alt: 'Bridal Hair',
    },
    {
      id: 'srv-3',
      code: '#SR-208',
      name: 'Keratin & Protein Therapy',
      category: 'therapy',
      categoryLabel: 'Therapy',
      standardDuration: 90,
      customDuration: 90,
      basePrice: 800,
      tier: 'Senior Specialist',
      commissionRate: 15,
      assigned: true,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDe_y_Xd1JHieotgkygxK1TCiMyjQxcKP_UX4nCD-TgmsKL5ds1BVT0gD11tDUQgXlLiHBPqZGFhHDWAdpcJUReoe1tSCXtCOL0HvVOpt2ytMLk3yguHGKdhGO2SHb1c1pGYLIjwRi1uJkBhNQdNE5rmJc1ozUmfm-zhsxqcB5d_J8fwKAk_UPvq1X7jOvBezGnmUCDeIyc4pvKAsoE_0LwJJtelCyo26XS5FXQVSr8',
      alt: 'Keratin Therapy',
    },
    {
      id: 'srv-4',
      code: '#SR-412',
      name: 'Deep Scalp Detox & Botanical Ritual',
      category: 'scalp',
      categoryLabel: 'Scalp Spa',
      standardDuration: 45,
      customDuration: 45,
      basePrice: 400,
      tier: 'Scalp Specialist',
      commissionRate: 12,
      assigned: true,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAaEcO0MGEl9OqHjmkhocFA9CYSa2oDabZIbeWF-AwitiO4NB4ReM0gm2AsMX4Kjurn-woN0FMBD1JX4PUfc4ppzrDJkhTY1Lzi02SFFjVId9FTQOrWtpqniiZbuw1CZ59PcJX8AA7I5XUAEbABl_1oIUZUSuOLyMV9wqkBNo-PAl_iGlFnyV0BKr68htlR_l5tEIKiTjjN5LnE0diBR0bHwczFaMW3LQv5GPcoyaMD',
      alt: 'Deep Scalp Detox',
    },
    {
      id: 'srv-5',
      code: '#SR-502',
      name: 'Facial Rejuvenation Ritual',
      category: 'facial',
      categoryLabel: 'Facial',
      standardDuration: 60,
      customDuration: 60,
      basePrice: 500,
      tier: 'Aesthetician I',
      commissionRate: 12,
      assigned: false,
      lockedReason: 'Specialist requires skin aesthetician certification',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA-HUiq9Ly1Ob2mSw7rmsBqfX4PsxuOVHT5hy0kEPizH9r3pyQ0zhFqfJBnUVMqAACsqqCSNRFVlC2Jm13Dzf5NxirazrgkQBYOSRZP7lDcfuALi-pNRT0wPi-xvvga8hdFa_rZPdXEXC8hUCTIptEKxoyctvWlAklB9vZDpFqQlNEM8FLpOlOhF3oQu8EPt5qNKLLvyVC3qmj708yb_1Mx30m1ur4m4uRvhGSmpuG8',
      alt: 'Facial Rejuvenation',
    },
    {
      id: 'srv-6',
      code: '#SR-118',
      name: 'Signature Gel Manicure',
      category: 'nails',
      categoryLabel: 'Nails',
      standardDuration: 40,
      customDuration: 40,
      basePrice: 300,
      tier: 'Nail Artist II',
      commissionRate: 10,
      assigned: false,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD_BYMBF1hce7Q-a9MrBdPBu09UA1eTvbabL8w64XOKUTmlu8ZJmaD1D8tWquW3gWQ0P4h6Gew-1NTb-wHFoaY021enMNOxbv29seSE1Bt8Rnd1xTCpEBIGTJoizWcb0UPN0DTAgGmYNW0LS2UEKH9CbCSAC1iqXK9fpxcVN9g_WSx2wlE8_TZ55ut7hv_ik6IutyjbJZAyur0C7G0UTpOwNyHeTO1YKHN0cdovylsd',
      alt: 'Signature Gel Manicure',
    },
  ]);

  const toggleAssigned = (id: string) => {
    setRituals((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          if (r.lockedReason && !r.assigned) {
            alert(r.lockedReason);
            return r;
          }
          return { ...r, assigned: !r.assigned };
        }
        return r;
      })
    );
  };

  const handleSelectAllHair = () => {
    setRituals((prev) =>
      prev.map((r) => (r.category === 'hair' || r.category === 'bridal' || r.category === 'therapy' || r.category === 'scalp' ? { ...r, assigned: true } : r))
    );
  };

  const handleResetStandard = () => {
    setRituals((prev) =>
      prev.map((r) => ({ ...r, customDuration: r.standardDuration, paceBadge: undefined }))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }, 500);
  };

  const assignedCount = rituals.filter((r) => r.assigned).length;

  const filteredRituals = rituals.filter((r) => {
    if (activeCategory === 'hair' && !(r.category === 'hair' || r.category === 'therapy')) return false;
    if (activeCategory === 'bridal' && r.category !== 'bridal') return false;
    if (activeCategory === 'scalp' && r.category !== 'scalp') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1560px] mx-auto w-full pb-28">
        {/* Breadcrumb & Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <nav className="flex items-center gap-2 uppercase tracking-widest text-secondary font-semibold">
            <button onClick={() => navigate('/admin/employees')} className="hover:text-primary transition-colors">
              Employees
            </button>
            <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            <button onClick={() => id && navigate(`/admin/employees/${id}`)} className="hover:text-primary transition-colors">
              Specialist Profile
            </button>
            <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            <span className="text-primary font-bold">Assign Services</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              Live Sync • Bole Bulbula Master Calendar
            </span>
          </div>
        </div>

        {/* Editorial Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                Sanctuary Roster Protocol
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight font-medium">
              Assign Services &amp; Beauty Rituals
            </h1>
            <p className="text-sm text-secondary leading-relaxed">
              Configure qualified service rituals, custom execution durations, specialist commission tiers, and booking eligibility for Sara Ahmed.
            </p>
          </div>

          {/* Quick Telemetry Card */}
          <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl shadow-sm self-start lg:self-auto shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                <circle
                  className="text-surface-container-highest"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="text-primary-container"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="20"
                  stroke="currentColor"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * assignedCount) / rituals.length}
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="absolute font-serif text-sm font-bold text-on-surface leading-none">
                {Math.round((assignedCount / rituals.length) * 100)}%
              </span>
            </div>
            <div className="flex flex-col text-xs">
              <span className="uppercase tracking-widest text-secondary text-[10px] font-semibold">
                Roster Coverage
              </span>
              <span className="font-serif text-base font-bold text-on-surface">
                {assignedCount} of {rituals.length} Rituals
              </span>
              <span className="text-[11px] text-primary font-medium">Hair Stylist Guild Tier II</span>
            </div>
          </div>
        </div>

        {/* Staff Summary Luxury Profile Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-inverse-surface text-inverse-on-surface p-6 sm:p-8 shadow-xl">
          <div className="absolute -right-20 -top-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpqI-X8f5UFtXQlblh9q45rKLJT4unACQlrNA1254UIBCdTzsU2rZPf9FyNctqs2ZhFoN3CTF7pbNoss0rK0Zb3fbJD8uLNRtoRyg1-wToaGAUyyM4fckXdI3kNtg0IJLoogmLwkIoNvfAhTFA2zvZ7HdRSgOnJtQ9olbKnxdYANxZKe12mldPAbeh33EWdIBqUCHL_Zki18zLkTAGEFKHPpSKVm572ryoOExZymaB"
                  alt="Sara Ahmed"
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-serif text-2xl font-bold text-primary-fixed">Sara Ahmed</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest/20 text-primary-fixed-dim text-[10px] tracking-widest uppercase font-semibold">
                    ID #EB-101
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] tracking-wider uppercase font-bold">
                    Active Staff
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-surface-variant text-xs mt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">workspace_premium</span>
                    Senior Hair Stylist &amp; Colorist
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">location_on</span>
                    Bole Bulbula Branch
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto text-xs">
              <div className="flex flex-col bg-surface-container-highest/10 p-3 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-outline-variant font-semibold">Rating</span>
                <span className="font-serif text-lg font-bold text-primary-fixed mt-0.5 flex items-center gap-1">
                  4.96 <span className="text-primary-container text-xs">★</span>
                </span>
                <span className="text-[10px] text-surface-variant/80">142 reviews</span>
              </div>
              <div className="flex flex-col bg-surface-container-highest/10 p-3 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-outline-variant font-semibold">Avg Ticket</span>
                <span className="font-serif text-lg font-bold text-surface-bright mt-0.5">820 ETB</span>
                <span className="text-[10px] text-primary-fixed-dim">Top 5% Salon</span>
              </div>
              <div className="flex flex-col bg-surface-container-highest/10 p-3 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase tracking-wider text-outline-variant font-semibold">Assigned</span>
                <span className="font-serif text-lg font-bold text-primary-container mt-0.5">
                  {assignedCount} Active
                </span>
                <span className="text-[10px] text-surface-variant/80">{rituals.length} Catalog</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search Sub-System */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 max-w-xl">
              <span className="material-symbols-outlined text-secondary absolute left-3.5 top-3 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog rituals by name, code or category..."
                className="w-full bg-surface-container-low text-on-surface placeholder:text-secondary rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:bg-surface shadow-inner"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end text-xs">
              <button
                type="button"
                onClick={handleSelectAllHair}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px] text-primary">done_all</span>
                Select All Hair Services
              </button>
              <button
                type="button"
                onClick={handleResetStandard}
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px] text-secondary">update</span>
                Set Standard Duration
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs uppercase tracking-widest font-semibold">
            {[
              { id: 'all', label: `All Services (${rituals.length})` },
              { id: 'hair', label: 'Hair & Treatments' },
              { id: 'bridal', label: 'Bridal & Occasions' },
              { id: 'scalp', label: 'Spa & Scalp Therapy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-5 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-inverse-surface text-primary-fixed shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Header (Desktop) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-secondary text-[11px] uppercase tracking-widest font-bold">
          <div className="col-span-5">Service Ritual &amp; Catalog Details</div>
          <div className="col-span-2">Specialist Tier</div>
          <div className="col-span-2">Execution Pace</div>
          <div className="col-span-2 text-right">Commission &amp; Yield</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {/* Ritual Cards */}
        <div className="space-y-3">
          {filteredRituals.map((r) => {
            const yieldAmount = Math.round((r.basePrice * r.commissionRate) / 100);
            return (
              <div
                key={r.id}
                className={`group rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                  r.assigned
                    ? 'bg-surface-container-lowest hover:bg-surface-bright'
                    : 'bg-surface-container-low/60 opacity-85'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Col 1: Details */}
                  <div className="lg:col-span-5 flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={r.image} alt={r.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-inverse-surface/80 text-primary-fixed text-[9px] uppercase font-bold">
                        {r.categoryLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                          {r.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                          {r.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <span>Standard: {r.standardDuration} mins</span>
                        <span>•</span>
                        <span className="font-bold text-on-surface">{r.basePrice} ETB Base</span>
                      </div>
                      {r.lockedReason && (
                        <span className="text-[10px] text-error flex items-center gap-1 font-semibold pt-0.5">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          {r.lockedReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Tier */}
                  <div className="lg:col-span-2">
                    <span className="text-[10px] uppercase text-secondary font-semibold lg:hidden block mb-1">
                      Tier
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low text-xs">
                      <span className="material-symbols-outlined text-[17px] text-primary-container">stars</span>
                      <span className="font-semibold text-on-surface">{r.tier}</span>
                    </div>
                  </div>

                  {/* Col 3: Pace */}
                  <div className="lg:col-span-2">
                    <span className="text-[10px] uppercase text-secondary font-semibold lg:hidden block mb-1">
                      Pace
                    </span>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-xs">
                      <span className="font-bold text-on-surface">{r.customDuration} mins</span>
                      {r.paceBadge ? (
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary-fixed/30 px-1.5 py-0.5 rounded">
                          {r.paceBadge}
                        </span>
                      ) : (
                        <span className="text-[10px] text-secondary uppercase font-semibold">Standard Pace</span>
                      )}
                    </div>
                  </div>

                  {/* Col 4: Commission */}
                  <div className="lg:col-span-2 flex flex-col items-start lg:items-end justify-center text-xs">
                    <span className="text-[10px] text-secondary uppercase font-semibold">
                      Commission {r.commissionRate}%
                    </span>
                    <span className="font-serif text-base font-bold text-primary">
                      {yieldAmount} ETB <span className="text-secondary text-[11px] font-normal">/ session</span>
                    </span>
                  </div>

                  {/* Col 5: Assignment Toggle */}
                  <div className="lg:col-span-1 flex items-center justify-between lg:justify-center pt-2 lg:pt-0">
                    <span className="text-xs uppercase text-secondary font-semibold lg:hidden">
                      Assigned Status
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleAssigned(r.id)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ${
                        r.assigned ? 'bg-primary-container' : 'bg-surface-container-highest'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-md transition duration-200 ${
                          r.assigned
                            ? 'translate-x-5 bg-on-primary'
                            : 'translate-x-0 bg-on-secondary'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Floating Action Bar */}
        <div className="fixed bottom-6 left-0 lg:left-72 right-0 px-4 sm:px-8 z-40 pointer-events-none">
          <div className="max-w-5xl mx-auto w-full pointer-events-auto bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl border border-surface-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">bookmark_added</span>
              </div>
              <div className="flex flex-col text-xs">
                <span className="text-primary-fixed uppercase tracking-widest font-semibold text-[10px]">
                  Rituals Assignment Roster
                </span>
                <span className="font-serif text-sm font-bold text-surface-bright">
                  {assignedCount} Rituals Assigned • Total Service Coverage: Hair &amp; Bridal Guild
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <button
                type="button"
                onClick={() => (id ? navigate(`/admin/employees/${id}`) : navigate('/admin/employees'))}
                className="px-4 py-2.5 rounded-xl bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-surface-variant hover:text-surface-bright uppercase tracking-wider font-semibold transition-colors"
              >
                Cancel &amp; Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container uppercase tracking-wider font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <span>{isSaving ? 'Synchronizing...' : 'Save & Synchronize Service Rules'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-24 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-primary-container/30 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
            <div className="flex flex-col text-xs">
              <span className="font-serif text-sm font-bold text-primary-fixed">Rules Synchronized</span>
              <span className="text-surface-variant">
                Sara Ahmed's service matrix is active across online booking and reception docks.
              </span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServiceAssignmentView;

