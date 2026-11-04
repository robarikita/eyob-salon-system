import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi } from '../../../api/employeeApi';

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('Bethelhem Kebede');
  const [amharicName, setAmharicName] = useState('ቤተልሔም ከበደ');
  const [phone, setPhone] = useState('+251 911 234 567');
  const [email, setEmail] = useState('bethelhem.k@eyobbeauty.com');
  const [emergencyContactName, setEmergencyContactName] = useState('Dawit Tadesse');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+251 922 884 100');
  const [branchId, setBranchId] = useState('bole-bulbula');
  const [ritualTitle, setRitualTitle] = useState('Senior Hair Stylist');
  const [employmentType, setEmploymentType] = useState('Full-Time (40 hrs/wk)');
  const [joinedDate, setJoinedDate] = useState('2025-03-01');
  const [workstation, setWorkstation] = useState('Chair 04 — VIP Styling Suite A');
  const [baseSalary, setBaseSalary] = useState(12000);
  const [commissionRate, setCommissionRate] = useState(15);
  const [retailRate, setRetailRate] = useState(10);
  const [createPortalAccess, setCreatePortalAccess] = useState(true);
  const [tempPassword, setTempPassword] = useState('EyobSanctuary#2025!');
  const [sysRole, setSysRole] = useState<'specialist' | 'assistant'>('specialist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Eyob#';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full legal name is required.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await employeeApi.createEmployee({
        fullName,
        amharicName,
        phone,
        email,
        branchId,
        ritualTitle,
        employmentType,
        workstation,
        joinedDate,
        emergencyContactName,
        emergencyContactPhone,
        baseSalary,
        commissionRate,
        createPortalAccess,
        tempPassword,
      });

      // Redirect to Service Assignment for the newly created specialist
      navigate(`/admin/employees/${created.id}/services`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to onboard employee.');
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1560px] mx-auto w-full">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <nav className="flex items-center gap-2 text-xs text-secondary uppercase tracking-widest">
              <span>Employees</span>
              <span className="material-symbols-outlined text-[13px] text-tertiary">chevron_right</span>
              <span>Roster</span>
              <span className="material-symbols-outlined text-[13px] text-tertiary">chevron_right</span>
              <span className="text-primary font-bold">Add New Employee</span>
            </nav>
            <h1 className="font-serif text-3xl sm:text-4xl text-on-surface tracking-tight font-medium">
              Onboard New Specialist
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-2xl">
              Create staff profile, configure credentials, assign primary branch location, and set starting operational status.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-surface-container px-3 py-1.5 rounded-full shadow-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-on-surface-variant font-semibold uppercase tracking-wider">
              Owner Clearance Mode
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-error-container text-on-error-container text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols) */}
            <div className="xl:col-span-7 space-y-6">
              {/* Card 1: Personal & Contact Information */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                    <h2 className="font-serif text-lg font-bold text-on-surface">
                      Personal &amp; Contact Information
                    </h2>
                  </div>
                  <span className="text-[10px] text-secondary font-semibold bg-surface-container-low px-2 py-0.5 rounded uppercase">
                    Step 01/02
                  </span>
                </div>

                {/* Headshot Upload Box */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-surface-container-low p-4 rounded-xl">
                  <div className="relative w-24 h-24 rounded-xl bg-surface-container-highest flex flex-col items-center justify-center overflow-hidden group cursor-pointer shadow-inner shrink-0">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO6NSGmtT_Lrk0GoEu5IYgoCwNZPIis1JduVWsjQmxHXfvYJoOiz6K6zhLKCAxl4iR18mf4yeCHDMHEw7d1YcMeG6lCuPwObAkmzfy5NpBlxmJ9qOZsdeGnuUsMybBojr1wsqMtRAr4LE05eTratid7svn8doLyF2rcm9ajUhDJkERdZEIBRx17B2nuiAb9o7l-N9Khz9RVJIZcHLoAoQEjN_QDlIRsWE6-O4QgW9O"
                      alt="Headshot Preview"
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-inverse-surface/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-primary-fixed text-[24px]">photo_camera</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 text-center sm:text-left text-xs">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold uppercase tracking-wider text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[17px]">cloud_upload</span>
                      <span>Specialist Headshot</span>
                    </div>
                    <p className="text-secondary text-[11px] leading-snug">
                      Drag &amp; drop headshot or Browse, JPG/PNG up to 5MB. 1:1 ratio recommended for client booking ledger.
                    </p>
                    <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        className="bg-surface-container px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                      >
                        Browse Files
                      </button>
                      <span className="text-[10px] text-outline">Max 5MB</span>
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                      <span>Full Legal Name</span>
                      <span className="text-error font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Bethelhem Kebede"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-medium focus:outline-none focus:bg-surface shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                      <span>Amharic / Local Display Name</span>
                      <span className="text-[10px] text-outline font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={amharicName}
                      onChange={(e) => setAmharicName(e.target.value)}
                      placeholder="ቤተልሔም ከበደ"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-medium focus:outline-none focus:bg-surface shadow-sm"
                    />
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Phone Number (Ethiopia)
                    </label>
                    <div className="flex items-center h-11 bg-surface-container-low rounded-xl px-3 shadow-sm">
                      <span className="text-primary font-bold mr-2">+251</span>
                      <input
                        type="tel"
                        value={phone.replace(/^\+251\s*/, '')}
                        onChange={(e) => setPhone(`+251 ${e.target.value}`)}
                        placeholder="911..."
                        className="w-full bg-transparent text-on-surface font-medium focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="bethelhem.k@eyobbeauty.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-medium focus:outline-none focus:bg-surface shadow-sm"
                    />
                  </div>
                </div>

                {/* Emergency contact */}
                <div className="space-y-1 pt-1 text-xs">
                  <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                    Emergency Contact Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Contact Name (e.g. Dawit Tadesse)"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-medium focus:outline-none focus:bg-surface shadow-sm"
                    />
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="Relationship & Phone (e.g. Spouse, +251 922...)"
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-medium focus:outline-none focus:bg-surface shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Employment & Branch Assignment */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">store</span>
                    <h2 className="font-serif text-lg font-bold text-on-surface">
                      Employment &amp; Branch Assignment
                    </h2>
                  </div>
                  <span className="text-[10px] text-secondary font-semibold bg-surface-container-low px-2 py-0.5 rounded uppercase">
                    Facility Mapping
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Primary Sanctuary Branch
                    </label>
                    <div className="flex items-center gap-1 text-primary text-[11px]">
                      <span className="material-symbols-outlined text-[15px]">verified_user</span>
                      <span>Owner privileges active</span>
                    </div>
                  </div>
                  <div className="relative flex items-center bg-surface-container-low rounded-xl shadow-sm">
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full h-11 bg-transparent px-3.5 text-on-surface font-medium appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="bole-bulbula">Bole Bulbula Branch (Morning Star Mall)</option>
                      <option value="kazanchis">Kazanchis Branch</option>
                      <option value="cmc">CMC Branch</option>
                    </select>
                    <span className="material-symbols-outlined text-secondary absolute right-3 pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                  <p className="text-[11px] text-outline pt-0.5">
                    Proprietor can deploy staff globally across sanctuaries; branch managers are restricted to local roster.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Staff Role / Ritual Title
                    </label>
                    <div className="relative flex items-center bg-surface-container-low rounded-xl shadow-sm">
                      <select
                        value={ritualTitle}
                        onChange={(e) => setRitualTitle(e.target.value)}
                        className="w-full h-11 bg-transparent px-3.5 text-on-surface font-medium appearance-none focus:outline-none cursor-pointer"
                      >
                        <option>Senior Hair Stylist</option>
                        <option>Master Makeup Artist</option>
                        <option>Nail Specialist</option>
                        <option>Aesthetician</option>
                        <option>Junior Assistant</option>
                      </select>
                      <span className="material-symbols-outlined text-secondary absolute right-3 pointer-events-none text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Employment Classification
                    </label>
                    <div className="relative flex items-center bg-surface-container-low rounded-xl shadow-sm">
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full h-11 bg-transparent px-3.5 text-on-surface font-medium appearance-none focus:outline-none cursor-pointer"
                      >
                        <option>Full-Time (40 hrs/wk)</option>
                        <option>Part-Time (24 hrs/wk)</option>
                        <option>Contract / Guest Artist</option>
                      </select>
                      <span className="material-symbols-outlined text-secondary absolute right-3 pointer-events-none text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      value={joinedDate}
                      onChange={(e) => setJoinedDate(e.target.value)}
                      className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-medium rounded-xl focus:outline-none cursor-pointer shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Service Station Assignment
                    </label>
                    <div className="relative flex items-center bg-surface-container-low rounded-xl shadow-sm">
                      <select
                        value={workstation}
                        onChange={(e) => setWorkstation(e.target.value)}
                        className="w-full h-11 bg-transparent px-3.5 text-on-surface font-medium appearance-none focus:outline-none cursor-pointer"
                      >
                        <option>Chair 04 — VIP Styling Suite A</option>
                        <option>Chair 02 — Main Atelier</option>
                        <option>Suite 01 — Aesthetic Clinic</option>
                      </select>
                      <span className="material-symbols-outlined text-secondary absolute right-3 pointer-events-none text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols) */}
            <div className="xl:col-span-5 space-y-6">
              {/* Card 3: Compensation & Commission */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                    <h2 className="font-serif text-lg font-bold text-on-surface">
                      Compensation &amp; Commission
                    </h2>
                  </div>
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    account_balance_wallet
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                    Base Monthly Remuneration
                  </label>
                  <div className="flex items-center h-11 bg-surface-container-low rounded-xl px-3.5 shadow-sm">
                    <span className="text-primary font-bold mr-2">ETB</span>
                    <input
                      type="number"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full bg-transparent text-on-surface font-medium focus:outline-none"
                    />
                    <span className="text-[10px] text-secondary uppercase font-semibold">Birr / Mo</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Rituals Comm.
                    </label>
                    <div className="flex items-center h-11 bg-surface-container-low rounded-xl px-3.5 shadow-sm">
                      <input
                        type="number"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        className="w-full bg-transparent text-on-surface font-medium focus:outline-none"
                      />
                      <span className="text-primary font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-outline">Per service closed</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                      Retail Product
                    </label>
                    <div className="flex items-center h-11 bg-surface-container-low rounded-xl px-3.5 shadow-sm">
                      <input
                        type="number"
                        value={retailRate}
                        onChange={(e) => setRetailRate(Number(e.target.value))}
                        className="w-full bg-transparent text-on-surface font-medium focus:outline-none"
                      />
                      <span className="text-primary font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-outline">Retail conversions</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">Target Commission Tier</span>
                    <span className="text-[11px] text-secondary">Qualifies for Quarterly Master Bonus</span>
                  </div>
                  <span className="px-2.5 py-1 bg-surface-container rounded text-[10px] text-primary font-bold uppercase tracking-wider">
                    Gold Tier
                  </span>
                </div>
              </div>

              {/* Card 4: System Access & Credentials */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      admin_panel_settings
                    </span>
                    <h2 className="font-serif text-lg font-bold text-on-surface">
                      System Access &amp; Credentials
                    </h2>
                  </div>
                  <span className="material-symbols-outlined text-tertiary text-[18px]">key</span>
                </div>

                <div className="flex items-center justify-between bg-surface-container-low p-3.5 rounded-xl">
                  <div className="flex flex-col pr-4">
                    <span className="font-bold uppercase tracking-wide text-on-surface">
                      Portal Application Access
                    </span>
                    <span className="text-[11px] text-secondary">
                      Enable Specialist Dashboard &amp; Mobile Client Check-in
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createPortalAccess}
                      onChange={(e) => setCreatePortalAccess(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                    System Security Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      onClick={() => setSysRole('specialist')}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
                        sysRole === 'specialist' ? 'bg-surface-container border border-primary/40' : 'bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={sysRole === 'specialist'}
                        onChange={() => setSysRole('specialist')}
                        className="accent-primary w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">Specialist Staff</span>
                        <span className="text-[10px] text-secondary">Own clients only</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setSysRole('assistant')}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
                        sysRole === 'assistant' ? 'bg-surface-container border border-primary/40' : 'bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={sysRole === 'assistant'}
                        onChange={() => setSysRole('assistant')}
                        className="accent-primary w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">Branch Assistant</span>
                        <span className="text-[10px] text-secondary">Desk check-in</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase tracking-wider text-on-surface-variant">
                    Initial Temporary Credential
                  </label>
                  <div className="flex items-center h-11 bg-surface-container-low rounded-xl px-3.5 shadow-sm justify-between">
                    <span className="font-mono text-xs tracking-wider text-on-surface">{tempPassword}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container text-on-surface hover:text-primary transition-colors text-[10px] font-bold uppercase"
                        title="Regenerate password"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:text-primary transition-colors text-[10px] font-bold uppercase"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] text-outline pt-0.5">
                    Specialist will be prompted to reset upon first login via Eyob Concierge app.
                  </span>
                </div>
              </div>

              {/* Card 5: Default Shift Template */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                    <h2 className="font-serif text-lg font-bold text-on-surface">Default Shift Template</h2>
                  </div>
                  <span className="text-[10px] text-tertiary font-bold uppercase">Preset</span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">Standard Shift A</span>
                    <span className="text-[10px] text-primary font-bold uppercase bg-surface-container px-2 py-0.5 rounded">
                      Active Template
                    </span>
                  </div>
                  <p className="text-on-surface-variant">
                    Tue – Sun, 8:30 AM – 5:30 PM <span className="text-tertiary font-bold">(Monday Rest)</span>
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <span key={day} className="px-2 py-0.5 bg-surface-container text-secondary text-[10px] rounded">
                        {day}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 bg-surface-container-highest text-error text-[10px] rounded font-bold">
                      Mon (Off)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Summary Action Bar */}
          <div className="sticky bottom-4 z-30 bg-surface/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <span>
                Demonstration notice: Form state is initialized with simulated profile data for preview.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate('/admin/employees')}
                className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim transition-all shadow-[0_0_20px_2px_rgba(197,155,39,0.3)] text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <span>{isSubmitting ? 'Onboarding...' : 'Create Employee Profile & Continue to Service Assignment'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddEmployeePage;
