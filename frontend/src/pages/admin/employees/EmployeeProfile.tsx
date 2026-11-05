import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee } from '../../../api/employeeApi';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'schedule' | 'history' | 'payroll'>('overview');

  useEffect(() => {
    if (id) {
      employeeApi.getEmployeeById(id).then(setEmployee);
    }
  }, [id]);

  const handleToggleStatus = async () => {
    if (!employee) return;
    try {
      const res = await employeeApi.toggleEmployeeStatus(employee.id);
      if (res.warning) alert(res.warning);
      setEmployee({ ...employee, status: res.employee.status });
    } catch {
      setEmployee({ ...employee, status: !employee.status });
    }
  };

  const displayName = employee ? `${employee.firstName} ${employee.lastName}` : 'Sara Ahmed';
  const roleTitle = employee?.ritualTitle || 'Senior Hair Stylist & Haute Bridal Specialist';
  const branchName = employee?.branch?.name || 'Bole Bulbula Branch';

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1560px] mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-secondary">
          <nav className="flex items-center gap-2 uppercase tracking-wider text-on-surface-variant font-semibold">
            <button onClick={() => navigate('/admin/employees')} className="hover:text-primary transition-colors">
              Employees
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <button onClick={() => navigate('/admin/employees')} className="hover:text-primary transition-colors">
              Roster
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-bold">
              {displayName} (#{employee?.id?.slice(0, 6) || 'EB-101'})
            </span>
          </nav>
          <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full font-semibold uppercase tracking-widest text-[10px] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            Demonstration Mode • Live Branch Sync
          </div>
        </div>

        {/* Hero Banner Section */}
        <section className="relative bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden">
          {/* Banner Graphic */}
          <div className="relative h-44 sm:h-52 w-full bg-inverse-surface overflow-hidden">
            <div
              className="bg-cover bg-center w-full h-full opacity-40 mix-blend-luminosity"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDh090EyM-X_HQc9jWFcmV1f2DVOJuGL28NaaJBgAptDTNZG_NbZP2rik1wP_bVV7i54cXHlOeoPHk7W2BDiTRdk122kvrknzaYJiIsFQSCtRNz_0xcgBGMlNTtFKT-3iL7ZW7OD5IPCNcyEfLrXGmWWppcJYHwe3E0u9yGUQX_qEpg8MjFgeTXvjxj3588mp0cWzWY_RC_sgwXrsWJzUsTPXyilOmlCQe25eU6XG-O')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent" />
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-inverse-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full text-primary-fixed text-xs uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-primary-fixed text-[16px]">verified</span>
              Verified Senior Specialist
            </div>
          </div>

          {/* Profile Details Overlapping Banner */}
          <div className="relative px-6 sm:px-8 pb-6 -mt-16 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-surface-container shadow-xl shrink-0 border-4 border-surface-container-lowest">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo923VMXiVfqPPnfGUqUi9FQjy8HmI7-72Yn0pPl1B0W-hXBGUg1-_OEHWEx6c-9sO8i_iQ3fNWoiEAkhwBL4opiY3KHatAICzg69cyscX3FJcEfUB_1J_ceggfnGix2D6UbwFHlbfzqQYNDZh-T7aZHTatzZU7Q69AWoN1E29m5ws3XrEHIS8uL2OV9vZaSxJtHET0hJyQ1uD5FkV-tvDzwkjLdC_SPQ0uv-Vh0Wn"
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full shadow-sm ${
                    employee?.status !== false ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-tertiary font-bold uppercase tracking-wider">
                    {employee?.status !== false ? 'Active • Full-Time' : 'Deactivated'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
                    {branchName}
                  </span>
                  <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-full text-primary font-bold">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span className="text-on-surface">4.95</span>
                    <span className="text-secondary font-normal">(142 reviews)</span>
                  </div>
                </div>

                <h1 className="font-serif text-3xl font-bold text-on-surface tracking-tight leading-none mt-1">
                  {displayName}
                </h1>
                <p className="text-sm font-medium text-on-surface-variant">{roleTitle}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">calendar_today</span>
                    Joined Jan 2023
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">call</span>
                    {employee?.phone || '+251 911 234 567'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">mail</span>
                    {employee?.email || 'sara.ahmed@eyobbeauty.com'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 xl:pt-0">
              <button
                type="button"
                onClick={() => employee?.id && navigate(`/admin/employees/${employee.id}/schedule`)}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">calendar_today</span>
                Schedule
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-error-container text-error text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {employee?.status !== false ? 'person_off' : 'restore'}
                </span>
                {employee?.status !== false ? 'Deactivate' : 'Reactivate'}
              </button>
              <button
                type="button"
                onClick={() => employee?.id && navigate(`/admin/employees/${employee.id}/services`)}
                className="px-5 py-2 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                Assign Services
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="px-6 sm:px-8 bg-surface-container-low flex items-center gap-1 overflow-x-auto text-xs uppercase tracking-widest font-semibold border-t border-surface-container">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'text-primary font-bold shadow-[inset_0_-2px_0_0_currentColor]'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              Profile Overview
            </button>
            <button
              onClick={() => employee?.id && navigate(`/admin/employees/${employee.id}/services`)}
              className="py-3 px-4 text-secondary hover:text-on-surface transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">spa</span>
              Assigned Services
            </button>
            <button
              onClick={() => employee?.id && navigate(`/admin/employees/${employee.id}/schedule`)}
              className="py-3 px-4 text-secondary hover:text-on-surface transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Working Schedule
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'history'
                  ? 'text-primary font-bold shadow-[inset_0_-2px_0_0_currentColor]'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history_toggle_off</span>
              Appointments &amp; History
            </button>
          </div>
        </section>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Biography & Qualifications */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
                  <h2 className="font-serif text-lg font-bold text-on-surface">
                    Specialist Biography &amp; Qualifications
                  </h2>
                </div>
                <span className="text-secondary text-xs uppercase tracking-widest font-semibold">Master Tier II</span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Sara brings over nine years of bespoke artisanal styling across Addis Ababa’s premier bridal suites and aesthetic retreats. Educated in advanced trichology and reconstructive keratin therapies in Dubai, she curates transformative bridal transformations fusing ancestral Habesha coronation braids with contemporary Parisian editorial cuts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-secondary uppercase font-semibold">Couture Specialty</span>
                  <span className="font-bold text-on-surface">Habesha Bridal Crown &amp; Weave</span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-secondary uppercase font-semibold">Certification</span>
                  <span className="font-bold text-on-surface">L’Oréal Pro Paris (KER-90)</span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] text-secondary uppercase font-semibold">Spoken Languages</span>
                  <span className="font-bold text-on-surface">Amharic, English, Italian</span>
                </div>
              </div>
            </div>

            {/* Assigned Beauty Rituals List */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-on-surface">
                      Assigned Beauty Rituals &amp; Services
                    </h2>
                    <span className="text-xs text-secondary">8 Rituals authorized for booking</span>
                  </div>
                </div>
                <button
                  onClick={() => employee?.id && navigate(`/admin/employees/${employee.id}/services`)}
                  className="text-xs font-bold text-primary uppercase tracking-wider hover:underline"
                >
                  Manage All (8)
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'Hair Styling & Couture Cut', desc: '60 mins • Master Tier • 20% Stylist Cut', price: '500 Br', icon: 'content_cut' },
                  { title: 'Bridal Updo & Headpiece Fitting', desc: '120 mins • Signature Ritual • VIP Lounge', price: '1,200 Br', icon: 'diamond' },
                  { title: 'Keratin Brazilian Smooth Complex', desc: '90 mins • Restorative Care • Thermal Seal', price: '800 Br', icon: 'sanitizer' },
                  { title: 'Botanical Scalp Spa & Reflexology', desc: '45 mins • Ayurvedic Oils • Scalp Exfoliation', price: '400 Br', icon: 'waves' },
                ].map((ritual) => (
                  <div
                    key={ritual.title}
                    className="bg-surface-container-low hover:bg-surface-container p-3.5 rounded-xl flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">{ritual.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">{ritual.title}</span>
                        <span className="text-[11px] text-secondary">{ritual.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-base font-bold text-on-surface">{ritual.price}</span>
                      <span className="w-2 h-2 rounded-full bg-primary-container" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule Snapshot */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">date_range</span>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-on-surface">Weekly Working Schedule Snapshot</h2>
                    <span className="text-xs text-secondary">Standard Shift (45 hrs/week regular)</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold uppercase tracking-wider">
                  Tuesday – Sunday
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                <div className="bg-surface-container-high/40 p-2.5 rounded-xl flex flex-col gap-1 opacity-60">
                  <span className="text-[10px] uppercase text-secondary font-bold">Mon</span>
                  <span className="material-symbols-outlined text-[18px] text-outline mx-auto">bedtime</span>
                  <span className="text-[11px] font-bold text-secondary">Off</span>
                </div>
                {['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="bg-surface-container p-2.5 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-primary font-bold">{day}</span>
                    <span className="text-[11px] text-on-surface font-semibold">8:30 AM</span>
                    <span className="text-[10px] text-secondary">5:30 PM</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Appointments & Reviews */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">rate_review</span>
                  <h2 className="font-serif text-lg font-bold text-on-surface">Recent Client Feedback</h2>
                </div>
                <span className="text-xs text-secondary">Last 7 Days</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-surface-container-low rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-container/20 text-on-primary-container font-bold flex items-center justify-center">
                        HD
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">Hana Desta</span>
                        <span className="text-[11px] text-secondary">Bridal Updo &amp; Trial Session • 2 days ago</span>
                      </div>
                    </div>
                    <div className="flex text-amber-500 text-xs">★★★★★</div>
                  </div>
                  <p className="text-on-surface-variant italic text-[11px] leading-relaxed">
                    “Sara was extraordinary! She incorporated my family heirloom veil effortlessly and the updo remained intact through the entire photoshoot. A true master of bridal artistry.”
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Operational Performance */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">monitoring</span>
                  <h2 className="font-serif text-lg font-bold text-on-surface">Operational Performance</h2>
                </div>
                <span className="text-primary font-bold uppercase tracking-wider text-[10px]">This Month</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Completed Rituals
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold text-on-surface">124</span>
                    <span className="text-xs text-primary font-bold">+12%</span>
                  </div>
                  <span className="text-[11px] text-secondary mt-1">Target: 110/mo</span>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Client Retention
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold text-on-surface">78%</span>
                    <span className="text-xs text-primary font-bold">Top 5%</span>
                  </div>
                  <span className="text-[11px] text-secondary mt-1">Network avg: 61%</span>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Punctuality Score
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold text-on-surface">98.4%</span>
                    <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                  </div>
                  <span className="text-[11px] text-secondary mt-1">Zero late checks</span>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                    Net Commission
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-primary">42.8k</span>
                    <span className="text-xs text-on-surface uppercase font-semibold">ETB</span>
                  </div>
                  <span className="text-[11px] text-secondary mt-1">Base salary excl.</span>
                </div>
              </div>
            </div>

            {/* Sanctuary Station & Access */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">domain</span>
                  <h2 className="font-serif text-lg font-bold text-on-surface">Sanctuary Station &amp; Access</h2>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="space-y-3">
                <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">apartment</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Designated Sanctuary
                    </span>
                    <span className="font-bold text-on-surface text-xs">{branchName}</span>
                    <span className="text-[11px] text-secondary">
                      {employee?.workstation || 'Morning Star Mall, 3rd Floor • Suite 304 (Chair #03)'}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">contact_emergency</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      Emergency Contact
                    </span>
                    <span className="font-bold text-on-surface text-xs">
                      {employee?.emergencyContactName || 'Dawit Ahmed (Brother)'}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {employee?.emergencyContactPhone || '+251 922 884 100'} • Bole Sub-City, Addis Ababa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proprietor Action Dock */}
            <div className="bg-inverse-surface text-inverse-on-surface p-6 rounded-2xl shadow-lg space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-primary-fixed font-bold">
                  Proprietor Action Dock
                </span>
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">lock</span>
              </div>
              <p className="text-surface-variant text-[11px] leading-relaxed">
                Export biometric logs, revise commission splits, or transfer specialist between Kazanchis and Bole branches.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-surface-bright text-[11px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">file_download</span>
                  Payroll Dossier
                </button>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-surface-bright text-[11px] uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">move_up</span>
                  Transfer Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeProfile;

