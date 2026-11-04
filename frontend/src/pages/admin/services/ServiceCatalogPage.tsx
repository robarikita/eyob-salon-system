import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { serviceApi, ServiceRitual } from '../../../api/serviceApi';

export const ServiceCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [notification, setNotification] = useState<string | null>(null);

  const categories = [
    { label: 'All Rituals', count: 24, key: 'All' },
    { label: 'Hair Styling & Couture', count: 8, key: 'Hair Styling & Couture' },
    { label: 'Bridal & Royal Special Occasions', count: 4, key: 'Bridal' },
    { label: 'Holistic Spa & Scalp Therapy', count: 5, key: 'Spa' },
    { label: 'Advanced Aesthetics & Facials', count: 4, key: 'Aesthetics' },
    { label: 'Luxury Nail Architecture', count: 3, key: 'Nail' },
  ];

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceApi.listServices({
        search: searchQuery,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        branchId: selectedBranch === 'all' ? undefined : selectedBranch,
        isActive: selectedStatus === 'all' ? undefined : selectedStatus === 'active',
      });
      setServices(data);
    } catch {
      // handled in serviceApi fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [searchQuery, selectedBranch, selectedStatus, selectedCategory]);

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const result = await serviceApi.toggleServiceStatus(id);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: result.service.status } : s))
      );
      if (result.warningCount > 0) {
        setNotification(`⚠️ ${result.message} (${result.warningCount} upcoming guest bookings preserved)`);
      } else {
        setNotification(`✨ Ritual "${name}" status updated successfully.`);
      }
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(`Could not toggle ritual status: ${err.message}`);
    }
  };

  return (
    <AdminLayout activePath="/admin/services">
      <div className="relative w-full">
        {/* Ambient gold luminescent back-glow */}
        <div className="absolute -top-10 left-1/4 w-96 h-32 bg-primary-container/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -top-12 right-10 w-80 h-40 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Floating Notification */}
        {notification && (
          <div className="mb-4 p-4 rounded-xl bg-inverse-surface text-surface-bright flex items-center justify-between shadow-xl border border-primary-container/30 animate-fade-in">
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

        {/* Breadcrumb & Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              Services &amp; Rituals
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Master Catalog
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold tracking-wider uppercase ml-1">
              <span className="material-symbols-outlined text-[13px] text-primary">verified</span>
              Global Sanctuary Protocol
            </span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs text-on-surface uppercase tracking-wider font-medium">
              Live Sync • 3 Branches Connected
            </span>
          </div>
        </div>

        {/* Editorial Hero Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight leading-tight">
              Sanctuary Service Rituals &amp; Treatment Catalog
            </h1>
            <p className="text-sm sm:text-base text-secondary mt-1.5 leading-relaxed">
              Configure master beauty rituals, branch pricing tiers, specialist requirements, and booking eligibility across Addis Ababa sanctuaries.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-end shrink-0 flex-wrap">
            <Link
              to="/admin/services/branch-governance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold uppercase tracking-wider shadow-sm transition-all border border-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
              <span>Branch Governance</span>
            </Link>
            <button
              onClick={() => navigate('/admin/services/create')}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-[0.08em] shadow-[0_0_20px_2px_rgba(212,175,55,0.28)] hover:bg-primary-fixed-dim transition-all active:scale-[0.98]"
              type="button"
            >
              <span className="material-symbols-outlined text-[19px] transition-transform group-hover:rotate-90">
                add
              </span>
              <span>+ Create Service Ritual</span>
            </button>
          </div>
        </div>

        {/* Statistics KPI Bar (Tier 1 Surface Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group border border-surface-container-high/60">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-secondary font-medium">
                  Total Rituals
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl text-on-surface font-semibold tracking-tight">24</span>
                  <span className="text-xs text-primary uppercase font-bold">Rituals</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-secondary">
              <span className="text-xs">+2 seasonal added</span>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
                5 Signature Guilds
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group border border-surface-container-high/60">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-secondary font-medium">
                  Instant Booking
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl text-on-surface font-semibold tracking-tight">21</span>
                  <span className="text-xs text-primary uppercase font-bold">Active</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between">
              <span className="text-xs text-secondary">91.6% available live</span>
              <div className="w-16 h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '91.6%' }} />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group border border-surface-container-high/60">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-secondary font-medium">
                  Inactive / Seasonal
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl text-on-surface font-semibold tracking-tight">3</span>
                  <span className="text-xs text-secondary uppercase font-bold">Inactive</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary group-hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined text-[22px]">archive</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-secondary">
              <span className="text-xs text-outline">Preserved audit logs</span>
              <span className="text-[11px] uppercase tracking-wider text-secondary">84 Records</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group border border-surface-container-high/60">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-secondary font-medium">
                  Sanctuary Mesh
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl text-on-surface font-semibold tracking-tight">100%</span>
                  <span className="text-xs text-primary uppercase font-bold">Core Coverage</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-[22px]">domain</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
              <span>Bole: 22</span>
              <span>•</span>
              <span>Kazanchis: 20</span>
              <span>•</span>
              <span>CMC: 19</span>
            </div>
          </div>
        </div>

        {/* Search, Filter & View Controls Ribbon */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm mb-6 flex flex-col gap-4 border border-surface-container-high/60">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Field */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                search
              </span>
              <input
                id="serviceSearch"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rituals by name, Amharic title, code, or treatment category..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner"
              />
            </div>

            {/* Quick Dropdowns & View Mode Switcher */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Branch Filter */}
              <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold uppercase tracking-wider appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-inner"
                >
                  <option value="all">All Branches (3)</option>
                  <option value="bole-bulbula">Bole Bulbula Suite</option>
                  <option value="kazanchis">Kazanchis VIP Sanctuary</option>
                  <option value="cmc">CMC Luxury Pavilions</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[140px] flex-1 sm:flex-initial">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold uppercase tracking-wider appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-inner"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive / Archive</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>

              {/* Layout View Toggle */}
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 shrink-0 shadow-inner">
                <button
                  id="btnGridView"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                  title="Refined Data Grid View"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">grid_view</span>
                </button>
                <button
                  id="btnTableView"
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                  title="Master Table View"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">view_agenda</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Pill Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 -mx-1 px-1 no-scrollbar">
            {categories.map((c) => {
              const isActive = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                    isActive
                      ? 'bg-inverse-surface text-primary-fixed-dim shadow-sm'
                      : 'bg-surface-container-low hover:bg-surface-container text-secondary'
                  }`}
                >
                  {c.label} ({c.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && services.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">spa</span>
            <h3 className="font-serif text-lg text-on-surface font-semibold">No rituals found</h3>
            <p className="text-sm text-secondary mt-1">Try broadening your search query or branch filters.</p>
          </div>
        )}

        {/* GRID VIEW */}
        {!loading && viewMode === 'grid' && services.length > 0 && (
          <div id="catalogDisplay" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {services.map((ritual) => {
              const displayPrice = ritual.effectivePrice ?? ritual.basePrice;
              const bolePrice =
                ritual.branchServices?.find((b) => b.branchId.includes('bole') || b.branch?.slug.includes('bole'))
                  ?.customPrice ?? ritual.basePrice;
              const kazanPrice =
                ritual.branchServices?.find((b) => b.branchId.includes('kazan') || b.branch?.slug.includes('kazan'))
                  ?.customPrice ?? ritual.basePrice;
              const cmcPrice =
                ritual.branchServices?.find((b) => b.branchId.includes('cmc') || b.branch?.slug.includes('cmc'))
                  ?.customPrice ?? ritual.basePrice;

              return (
                <div
                  key={ritual.id}
                  className="service-card flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-surface-container-high/60"
                >
                  {/* Media Header */}
                  <div className="relative h-52 w-full overflow-hidden bg-surface-container">
                    <img
                      src={
                        ritual.imageUrl ||
                        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={ritual.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/85 via-inverse-surface/30 to-transparent" />

                    {/* Status & Code Overlays */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-inverse-surface/90 text-primary-fixed-dim text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                        #{ritual.code}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold uppercase tracking-wider shadow-sm">
                        {ritual.category.split('&')[0].trim()}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          ritual.status
                            ? 'bg-surface-container-lowest/90 text-primary'
                            : 'bg-error-container/90 text-error'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ritual.status ? 'bg-primary animate-pulse' : 'bg-error'
                          }`}
                        />
                        {ritual.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-surface-bright">
                      <div className="max-w-[70%]">
                        <span className="text-[10px] text-surface-dim uppercase tracking-widest block">
                          Amharic Protocol
                        </span>
                        <span className="font-serif text-base sm:text-lg text-surface-bright leading-tight truncate block">
                          {ritual.amharicName || ritual.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-primary-fixed block">
                          From
                        </span>
                        <div className="font-serif text-lg sm:text-xl text-surface-bright font-bold">
                          {displayPrice.toLocaleString()}{' '}
                          <span className="text-xs font-normal">ETB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Core Information */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-serif text-lg text-on-surface font-semibold group-hover:text-primary transition-colors leading-snug">
                          {ritual.name}
                        </h2>
                      </div>
                      <p className="text-xs text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {ritual.description || 'Exclusive luxury salon treatment and styling protocol.'}
                      </p>

                      {/* Specifications Row */}
                      <div className="flex items-center justify-between py-2 mt-3 bg-surface-container-low rounded-lg px-3 text-xs text-secondary">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          <span className="font-medium">
                            {ritual.durationMinutes} min{' '}
                            <span className="text-outline text-[11px]">
                              (+{ritual.turnaroundBuffer} buffer)
                            </span>
                          </span>
                        </div>
                        <div className="w-px h-3.5 bg-outline-variant" />
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            person_celebrate
                          </span>
                          <span className="font-medium">
                            {ritual.assignedEmployees?.length || 4} Specialists
                          </span>
                        </div>
                      </div>

                      {/* Multi-Branch Tier Matrix */}
                      <div className="mt-3.5 flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-outline font-semibold">
                          Branch Pricing &amp; Tiers
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="p-1.5 rounded-lg bg-surface-container-low border border-surface-container-high">
                            <span className="text-[9px] text-secondary uppercase block font-semibold">Bole</span>
                            <span className="text-xs font-bold text-on-surface">{bolePrice} ETB</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-surface-container-low border border-surface-container-high">
                            <span className="text-[9px] text-secondary uppercase block font-semibold">
                              Kazanchis
                            </span>
                            <span className="text-xs font-bold text-on-surface">{kazanPrice} ETB</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-surface-container-low border border-surface-container-high">
                            <span className="text-[9px] text-secondary uppercase block font-semibold">CMC</span>
                            <span className="text-xs font-bold text-on-surface">{cmcPrice} ETB</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between gap-2">
                      <Link
                        to={`/admin/services/${ritual.id}`}
                        className="flex-1 text-center py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                      >
                        View Dossier
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(ritual.id, ritual.name)}
                        className={`p-2 rounded-lg transition-colors ${
                          ritual.status
                            ? 'bg-surface-container-low hover:bg-error-container hover:text-error text-secondary'
                            : 'bg-primary-container text-on-primary-container'
                        }`}
                        title={ritual.status ? 'Deactivate Ritual' : 'Reactivate Ritual'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {ritual.status ? 'toggle_on' : 'toggle_off'}
                        </span>
                      </button>
                      <Link
                        to="/admin/services/branch-governance"
                        className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary transition-colors"
                        title="Configure Branch Rules"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MASTER TABLE VIEW */}
        {!loading && viewMode === 'table' && services.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-container-high">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Ritual Nomenclature &amp; Ge'ez</th>
                    <th className="py-3 px-4">Department Guild</th>
                    <th className="py-3 px-4">Timing</th>
                    <th className="py-3 px-4">Branch Pricing Matrix</th>
                    <th className="py-3 px-4">Specialists</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {services.map((ritual) => {
                    const bolePrice =
                      ritual.branchServices?.find((b) => b.branchId.includes('bole'))?.customPrice ??
                      ritual.basePrice;
                    const kazanPrice =
                      ritual.branchServices?.find((b) => b.branchId.includes('kazan'))?.customPrice ??
                      ritual.basePrice;
                    const cmcPrice =
                      ritual.branchServices?.find((b) => b.branchId.includes('cmc'))?.customPrice ??
                      ritual.basePrice;

                    return (
                      <tr key={ritual.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">#{ritual.code}</td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/admin/services/${ritual.id}`}
                            className="font-serif font-semibold text-sm text-on-surface hover:text-primary transition-colors block"
                          >
                            {ritual.name}
                          </Link>
                          <span className="font-serif text-secondary text-[11px] block italic">
                            {ritual.amharicName || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-semibold uppercase tracking-wider">
                            {ritual.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-on-surface">{ritual.durationMinutes} min</div>
                          <div className="text-[10px] text-outline">+{ritual.turnaroundBuffer}m buffer</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-medium text-secondary">
                              Bole: <strong className="text-on-surface">{bolePrice}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-secondary">
                              Kaz: <strong className="text-on-surface">{kazanPrice}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-secondary">
                              CMC: <strong className="text-on-surface">{cmcPrice} ETB</strong>
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-on-surface">
                          {ritual.assignedEmployees?.length || 4} Certified
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(ritual.id, ritual.name)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ritual.status
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-surface-container-high text-secondary'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ritual.status ? 'bg-primary animate-pulse' : 'bg-outline'
                              }`}
                            />
                            {ritual.status ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/admin/services/${ritual.id}`}
                              className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface"
                              title="View Dossier"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </Link>
                            <Link
                              to="/admin/services/branch-governance"
                              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary"
                              title="Branch Governance"
                            >
                              <span className="material-symbols-outlined text-[16px]">tune</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServiceCatalogPage;
