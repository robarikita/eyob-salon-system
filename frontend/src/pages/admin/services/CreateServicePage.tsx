import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { serviceApi, CreateServicePayload } from '../../../api/serviceApi';

export const CreateServicePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateServicePayload>({
    code: 'SR-101',
    name: 'Royal Habesha Bridal Hair & Crown Updo',
    amharicName: 'የሙሽራ የፀጉር አሰራር እና ዘውድ ዝግጅት',
    category: 'Bridal & Royal Special Occasions',
    subCategory: 'Crown Wefts, Bridal Veil & Traditional Braids',
    description:
      'An exquisite ancestral bridal ritual combining intricate Habesha weaving, crown headpiece setting, and 24-hour long-wear veil architecture.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhXpuwSeMXFO5Iir8pCbkmEsFJocEEJCq4rXtkg62rfLuTS1gtFCs-AJwJGpg_6PccZ1uOlcwHMmH-Sx7CAFnk_WTRWg4FY2sG9R_rbdTMlrhKJ4UNMAV4G_QdLUqSw-rtAWiIMblVS_VnvqBBLcNfZCW8SMAJlHa4yPh6TNte3Mzy7C77rWlFPjjVxcnaAjrXhvsFof6lJPq8-5OSFIqIQILnNb1hs1irh_psfGiq',
    basePrice: 1200,
    durationMinutes: 90,
    preSetupBuffer: 15,
    turnaroundBuffer: 15,
    workstationType: 'Private Bridal Suite & Styling Throne',
    minGuildRank: 'Master Specialist (Guild Tier II)',
    requiresApprentice: true,
    requiredProtocols: [
      'Micro-Steam Infusion',
      '24h Humidity Setting Spray',
      'Albo Filigree Anchoring',
      'Botanical Aura Misting',
    ],
    standardCommission: 18,
    branchIds: ['b-bole', 'b-kazanchis', 'b-cmc'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeToggle, setActiveToggle] = useState(true);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const durationPresets = [45, 60, 75, 90, 120];

  const protocolOptions = [
    'Micro-Steam Infusion',
    '24h Humidity Setting Spray',
    'Albo Filigree Anchoring',
    'Botanical Aura Misting',
    'Autoclave Sterilized Tools',
    'Organic Cold-Pressed Butter Infusion',
    'Thermal Stone Balancing',
  ];

  const handleProtocolToggle = (protocol: string) => {
    setFormData((prev) => {
      const exists = prev.requiredProtocols?.includes(protocol);
      return {
        ...prev,
        requiredProtocols: exists
          ? prev.requiredProtocols?.filter((p) => p !== protocol)
          : [...(prev.requiredProtocols || []), protocol],
      };
    });
  };

  const handleBranchToggle = (branchId: string) => {
    setFormData((prev) => {
      const current = prev.branchIds || [];
      const exists = current.includes(branchId);
      return {
        ...prev,
        branchIds: exists ? current.filter((b) => b !== branchId) : [...current, branchId],
      };
    });
  };

  const handleSubmit = async (publish: boolean) => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Please enter service name and ritual registry code.');
      return;
    }
    setIsSubmitting(true);
    try {
      await serviceApi.createService({
        ...formData,
      });
      setSuccessBanner(
        publish
          ? `✨ Ritual "${formData.name}" published successfully across ${formData.branchIds?.length || 3} sanctuaries.`
          : `✨ Ritual "${formData.name}" saved as draft.`
      );
      setTimeout(() => {
        navigate('/admin/services');
      }, 1500);
    } catch (err: any) {
      alert(`Failed to save ritual: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Economics calculations
  const price = formData.basePrice || 0;
  const commission = formData.standardCommission || 0;
  const specialistPayout = Math.round(price * (commission / 100));
  const sanctuaryNetYield = price - specialistPayout;
  const totalAppointmentMinutes =
    (formData.preSetupBuffer || 0) + formData.durationMinutes + (formData.turnaroundBuffer || 0);

  return (
    <AdminLayout activePath="/admin/services">
      <div className="relative w-full">
        {/* Ambient Gold Glow Container */}
        <div className="absolute -top-10 right-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-10 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Success Banner */}
        {successBanner && (
          <div className="mb-4 p-4 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-between shadow-xl font-semibold text-sm">
            <span>{successBanner}</span>
          </div>
        )}

        {/* Editorial Header & Actions Ribbon */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Breadcrumb Bar */}
          <div className="flex items-center gap-2 text-on-surface-variant text-xs">
            <span
              onClick={() => navigate('/admin/services')}
              className="uppercase tracking-[0.18em] text-primary cursor-pointer hover:underline font-semibold"
            >
              Services &amp; Rituals
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            <span
              onClick={() => navigate('/admin/services')}
              className="uppercase tracking-[0.18em] text-secondary cursor-pointer hover:underline"
            >
              Catalog
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
            <span className="uppercase tracking-[0.18em] text-on-surface font-semibold">
              Create New Service Ritual
            </span>
          </div>

          {/* Main Title Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                  Protocol Architect
                </span>
                <span className="text-[10px] text-outline tracking-wider uppercase">• Edition 2025</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight leading-tight">
                Curate New Service Ritual
              </h1>
              <p className="text-xs sm:text-sm text-secondary mt-1 max-w-2xl">
                Define global ritual parameters, dual English-Amharic branding, execution pacing, and sanctuary station requirements across all grand suites.
              </p>
            </div>

            {/* Actions & Active Switch */}
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
              <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm border border-surface-container-high">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                    Ritual Status
                  </span>
                  <span className="text-xs text-primary font-bold">
                    {activeToggle ? 'Active Ritual' : 'Draft / Inactive'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveToggle(!activeToggle)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    activeToggle ? 'bg-primary-container' : 'bg-surface-container-highest'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-surface-container-lowest shadow-md transform transition-transform ${
                      activeToggle ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/services')}
                className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold uppercase tracking-wider transition-all"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-all"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_2px_rgba(212,175,55,0.28)] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                <span>{isSubmitting ? 'Publishing...' : 'Publish Ritual'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Master Form Workspace (Two Columns) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Ritual Engine (8 Cols) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* SECTION 1: Identity & Multi-lingual Nomenclature */}
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold">
                    01
                  </span>
                  <div>
                    <h2 className="font-serif text-lg text-on-surface leading-tight font-semibold">
                      Ritual Identity &amp; Multi-lingual Nomenclature
                    </h2>
                    <p className="text-xs text-secondary">
                      Global registry nomenclature for salon front desk and guest concierge.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full">
                  <span className="text-[10px] uppercase text-secondary">Registry Code:</span>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-20 bg-transparent text-xs font-mono font-bold text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold flex items-center justify-between">
                    <span>
                      English Service Name <span className="text-primary">*</span>
                    </span>
                    <span className="text-outline font-normal text-[11px]">Latin Script</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    placeholder="e.g. Imperial Silk Press Infusion"
                  />
                </div>

                {/* Amharic Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold flex items-center justify-between">
                    <span>
                      የአማርኛ መጠሪያ (Amharic Title) <span className="text-primary">*</span>
                    </span>
                    <span className="text-outline font-normal text-[11px]">Ge'ez Script</span>
                  </label>
                  <input
                    type="text"
                    value={formData.amharicName || ''}
                    onChange={(e) => setFormData({ ...formData, amharicName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm font-serif focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    placeholder="የአማርኛ ስም እዚህ ያስገቡ"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Sanctuary Department Category <span className="text-primary">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                  >
                    <option value="Hair Styling & Couture">Hair Styling &amp; Couture</option>
                    <option value="Bridal & Royal Special Occasions">Bridal &amp; Royal Special Occasions</option>
                    <option value="Holistic Spa & Scalp Therapy">Holistic Spa &amp; Scalp Therapy</option>
                    <option value="Advanced Aesthetics & Facials">Advanced Aesthetics &amp; Facials</option>
                    <option value="Luxury Nail Architecture">Luxury Nail Architecture</option>
                  </select>
                </div>

                {/* Subcategory */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Treatment Guild &amp; Specialty Focus
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory || ''}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    placeholder="e.g. Crown Wefts, Bridal Veil & Traditional Braids"
                  />
                </div>

                {/* Description / Manifesto */}
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                      Guest-Facing Marketing Manifesto
                    </label>
                    <span className="text-[11px] text-outline">
                      {formData.description?.length || 0} / 240 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner resize-none"
                    placeholder="Atmospheric narrative displayed on the guest booking portal and concierge tablet..."
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: Visual Media & Atmospheric Asset */}
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold">
                    02
                  </span>
                  <div>
                    <h2 className="font-serif text-lg text-on-surface leading-tight font-semibold">
                      High-Resolution Visual Media
                    </h2>
                    <p className="text-xs text-secondary">
                      Atmospheric salon photography displayed across guest VIP tablets and client portal.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                  Primary Hero Slot
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5 relative rounded-xl overflow-hidden shadow-md aspect-[4/3] bg-surface-container">
                  <img
                    src={formData.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'}
                    alt="Ritual Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-surface-bright text-[10px]">
                    <span className="bg-inverse-surface/80 px-2 py-0.5 rounded backdrop-blur-sm uppercase">
                      Asset Preview
                    </span>
                    <span className="text-primary-fixed font-bold">Editorial 4:3</span>
                  </div>
                </div>

                <div className="md:col-span-7 flex flex-col gap-3">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Hero Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    placeholder="https://images.unsplash.com/..."
                  />

                  {/* Preset quick picks */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase text-outline font-semibold tracking-wider">
                      Or Choose Sanctuary Asset Preset:
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            imageUrl:
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBhXpuwSeMXFO5Iir8pCbkmEsFJocEEJCq4rXtkg62rfLuTS1gtFCs-AJwJGpg_6PccZ1uOlcwHMmH-Sx7CAFnk_WTRWg4FY2sG9R_rbdTMlrhKJ4UNMAV4G_QdLUqSw-rtAWiIMblVS_VnvqBBLcNfZCW8SMAJlHa4yPh6TNte3Mzy7C77rWlFPjjVxcnaAjrXhvsFof6lJPq8-5OSFIqIQILnNb1hs1irh_psfGiq',
                          })
                        }
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary"
                      >
                        Habesha Bridal Crown
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            imageUrl:
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBp2mYKlmcVtxXRFVBRxK0L3TFmC9J0XTOIgCSkdgOp7BJxvqEyYPkVgNVQjRg5as94wJTzxWlhYI5UQKpunmOyPSjFxFsllVDTm29cqAgxG25iZiBf0pE5htWhr8rAZF5AOhpbAuWeh668jajceIwhMwGzRKRP1YxoQTTr4rBsCsz-QqHaT9KeaaRwIu9j0dM65r3z1wERql4gvi4ubutouJXMBxygw2zi0JxetueC',
                          })
                        }
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary"
                      >
                        Intricate Royal Braids
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            imageUrl:
                              'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
                          })
                        }
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary"
                      >
                        Herbal Scalp Spa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Time Architecture & Operational Pacing */}
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold">
                    03
                  </span>
                  <div>
                    <h2 className="font-serif text-lg text-on-surface leading-tight font-semibold">
                      Time Architecture &amp; Operational Pacing
                    </h2>
                    <p className="text-xs text-secondary">
                      Hands-on execution time, pre-treatment setup, and suite turnaround sanitization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Active Duration */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Hands-on Duration (min) <span className="text-primary">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          durationMinutes: Math.max(15, prev.durationMinutes - 15),
                        }))
                      }
                      className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center font-bold text-on-surface"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({ ...formData, durationMinutes: Number(e.target.value) || 15 })
                      }
                      className="flex-1 text-center h-10 rounded-xl bg-surface-container-low text-on-surface font-bold text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          durationMinutes: prev.durationMinutes + 15,
                        }))
                      }
                      className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-center font-bold text-on-surface"
                    >
                      +
                    </button>
                  </div>
                  {/* Presets */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {durationPresets.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormData({ ...formData, durationMinutes: mins })}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                          formData.durationMinutes === mins
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-low text-secondary hover:bg-surface-container'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pre-setup buffer */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Pre-Setup Buffer
                  </label>
                  <select
                    value={formData.preSetupBuffer || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, preSetupBuffer: Number(e.target.value) })
                    }
                    className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                  >
                    <option value={0}>0 min (Standard)</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min (VIP Herbal Prep)</option>
                    <option value={20}>20 min</option>
                  </select>
                  <span className="text-[10px] text-outline">Sanctuary suite kit setup before guest arrival</span>
                </div>

                {/* Turnaround buffer */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Turnaround &amp; Sanitize
                  </label>
                  <select
                    value={formData.turnaroundBuffer || 15}
                    onChange={(e) =>
                      setFormData({ ...formData, turnaroundBuffer: Number(e.target.value) })
                    }
                    className="h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                  >
                    <option value={10}>10 min</option>
                    <option value={15}>15 min (Standard Buffer)</option>
                    <option value={20}>20 min (Thorough Sterilization)</option>
                    <option value={30}>30 min (Bridal Reset)</option>
                  </select>
                  <span className="text-[10px] text-outline">Post-treatment linen change &amp; disinfection</span>
                </div>
              </div>

              {/* Pacing Visualizer */}
              <div className="mt-4 p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">timelapse</span>
                  <span className="text-secondary font-medium">
                    Total Appointment Footprint: <strong className="text-on-surface">{totalAppointmentMinutes} min</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-outline">
                  <span>{formData.preSetupBuffer || 0}m prep</span> +
                  <span className="text-primary font-bold">{formData.durationMinutes}m active</span> +
                  <span>{formData.turnaroundBuffer || 15}m reset</span>
                </div>
              </div>
            </section>

            {/* SECTION 4: Sanctuary Station & Guild Prerequisites */}
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold">
                    04
                  </span>
                  <div>
                    <h2 className="font-serif text-lg text-on-surface leading-tight font-semibold">
                      Sanctuary Station &amp; Guild Prerequisites
                    </h2>
                    <p className="text-xs text-secondary">
                      Workstation locking, certified specialist guild ranks, and clinical hygiene protocols.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Workstation / Suite Allocation
                  </label>
                  <select
                    value={formData.workstationType || ''}
                    onChange={(e) => setFormData({ ...formData, workstationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                  >
                    <option value="Private Bridal Suite & Styling Throne">Private Bridal Suite &amp; Styling Throne</option>
                    <option value="Artisan Braiding Station">Artisan Braiding Station</option>
                    <option value="Hydro-Therapy Suite">Hydro-Therapy Suite</option>
                    <option value="Aesthetic Dermatology Suite">Aesthetic Dermatology Suite</option>
                    <option value="Private Relaxation Pavilion">Private Relaxation Pavilion</option>
                    <option value="Styling Station">Styling Station</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Minimum Specialist Guild Rank
                  </label>
                  <select
                    value={formData.minGuildRank || ''}
                    onChange={(e) => setFormData({ ...formData, minGuildRank: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
                  >
                    <option value="Master Specialist (Guild Tier II)">Master Specialist (Guild Tier II)</option>
                    <option value="Senior Stylist (Guild Tier I)">Senior Stylist (Guild Tier I)</option>
                    <option value="Lead Aesthetician">Lead Aesthetician</option>
                    <option value="Stylist (Guild Tier I)">Stylist (Guild Tier I)</option>
                    <option value="Apprentice Artisan">Apprentice Artisan</option>
                  </select>
                </div>

                {/* Apprentice toggle */}
                <div className="md:col-span-2 flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">
                      Requires Dedicated Assistant / Apprentice
                    </span>
                    <span className="text-[11px] text-secondary">
                      Mandates a junior artisan for veil hold, tea hospitality, or micro-steaming.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, requiresApprentice: !formData.requiresApprentice })
                    }
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                      formData.requiresApprentice ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                        formData.requiresApprentice ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Required Protocols Multi-select */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Clinical Protocols &amp; Apothecary Consumables Required
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {protocolOptions.map((protocol) => {
                      const isSelected = formData.requiredProtocols?.includes(protocol);
                      return (
                        <button
                          key={protocol}
                          type="button"
                          onClick={() => handleProtocolToggle(protocol)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-primary-container text-on-primary-container border-primary font-semibold shadow-sm'
                              : 'bg-surface-container-low text-secondary border-surface-container-high hover:border-outline'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {protocol}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Standard Base Economics */}
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container-high/60">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container-high/60">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold">
                    05
                  </span>
                  <div>
                    <h2 className="font-serif text-lg text-on-surface leading-tight font-semibold">
                      Standard Base Economics &amp; Commission Model
                    </h2>
                    <p className="text-xs text-secondary">
                      Suggested base retail pricing in ETB and certified specialist payout calculations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Recommended Retail Base Price (ETB) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, basePrice: Number(e.target.value) || 0 })
                      }
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary">
                      ETB
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase text-on-surface-variant tracking-wider font-semibold">
                    Specialist Commission Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.standardCommission || 18}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standardCommission: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Yield Breakdown */}
              <div className="mt-4 p-4 rounded-xl bg-surface-container-low grid grid-cols-2 gap-4 border border-surface-container-high text-xs">
                <div>
                  <span className="text-secondary text-[11px] block uppercase tracking-wider">
                    Specialist Payout per Service
                  </span>
                  <div className="text-lg font-bold text-primary mt-0.5">
                    {specialistPayout.toLocaleString()} ETB{' '}
                    <span className="text-xs font-normal text-secondary">({commission}%)</span>
                  </div>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block uppercase tracking-wider">
                    Net Sanctuary Operating Yield
                  </span>
                  <div className="text-lg font-bold text-on-surface mt-0.5">
                    {sanctuaryNetYield.toLocaleString()} ETB{' '}
                    <span className="text-xs font-normal text-secondary">({100 - commission}%)</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Live Preview & Branch Deployment Engine (4 Cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6 xl:sticky xl:top-24">
            {/* Live Guest Concierge Preview Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-primary-container/30 overflow-hidden">
              <div className="p-3 bg-inverse-surface text-surface-bright flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Live Concierge Preview
                  </span>
                </div>
                <span className="text-[10px] text-surface-dim uppercase">Guest Tablet Screen</span>
              </div>

              {/* Card visual */}
              <div className="relative h-48 w-full bg-surface-container">
                <img
                  src={formData.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-inverse-surface/80 text-primary-fixed-dim text-[10px] font-bold uppercase backdrop-blur-md">
                    #{formData.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold uppercase">
                    {formData.category.split('&')[0].trim()}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-primary text-[10px] font-bold uppercase">
                    {activeToggle ? 'Active' : 'Draft'}
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 text-surface-bright">
                  <div className="text-[10px] text-surface-dim uppercase">Amharic Title</div>
                  <div className="font-serif text-base text-surface-bright font-bold leading-tight truncate">
                    {formData.amharicName || '—'}
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-on-surface">{formData.name}</h3>
                  <p className="text-xs text-secondary mt-1 line-clamp-3">
                    {formData.description || 'No description provided.'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-secondary block">Duration</span>
                    <span className="font-bold text-on-surface">
                      {formData.durationMinutes} min{' '}
                      <span className="text-[10px] font-normal text-outline">
                        (+{formData.turnaroundBuffer || 15}m)
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-secondary block">Starting At</span>
                    <span className="font-serif text-base font-bold text-primary">
                      {formData.basePrice?.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider shadow-sm opacity-90 cursor-default"
                >
                  Reserve Consultation
                </button>
              </div>
            </div>

            {/* Sanctuary Branch Deployment */}
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-high/60">
              <h3 className="font-serif text-base font-semibold text-on-surface mb-1">
                Sanctuary Branch Deployment
              </h3>
              <p className="text-xs text-secondary mb-3">
                Auto-generates synchronized BranchService governance records for selected sanctuaries.
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { id: 'b-bole', name: 'Bole Bulbula Sanctuary', subtitle: 'Morning Star Mall' },
                  { id: 'b-kazanchis', name: 'Kazanchis VIP Sanctuary', subtitle: 'ECA Quartier' },
                  { id: 'b-cmc', name: 'CMC Luxury Pavilions', subtitle: 'Heights Blvd' },
                ].map((b) => {
                  const checked = formData.branchIds?.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-surface-container-low border-primary/50'
                          : 'bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleBranchToggle(b.id)}
                          className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-on-surface">{b.name}</span>
                          <span className="text-[10px] text-secondary">{b.subtitle}</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-primary">
                        {checked ? 'Deploying' : 'Excluded'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Readiness Checklist */}
            <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high text-xs">
              <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-2">
                Ritual Specification Readiness
              </span>
              <ul className="space-y-1.5 text-on-surface">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  <span>Dual English &amp; Ge'ez branding defined</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  <span>Hands-on pacing &amp; turnaround verified</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  <span>Retail base price &amp; commission balanced</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                  <span>{formData.branchIds?.length || 0} of 3 branches selected for rollout</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateServicePage;

