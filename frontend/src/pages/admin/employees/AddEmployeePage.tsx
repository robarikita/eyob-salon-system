import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi } from '../../../api/employeeApi';
import { branchApi, BranchDTO } from '../../../api/branchApi';
import { useLanguage } from '../../../context/LanguageContext';

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === 'am';

  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [fullName, setFullName] = useState('');
  const [amharicName, setAmharicName] = useState('');
  const [phone, setPhone] = useState('+251');
  const [email, setEmail] = useState('');
  const [branchId, setBranchId] = useState('');
  const [title, setTitle] = useState('');
  const [workstation, setWorkstation] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('EyobSanctuary#2025!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    branchApi.listBranches().then((list) => {
      setBranches(list);
      if (list.length > 0) {
        setBranchId(list[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg(isAm ? 'ሙሉ ስም ያስፈልጋል' : 'Full name required');
      return;
    }

    if (!phone.trim() || phone === '+251') {
      setErrorMsg(isAm ? 'ስልክ ቁጥር ያስፈልጋል' : 'Phone number required');
      return;
    }

    if (!branchId) {
      setErrorMsg(isAm ? 'ቅርንጫፍ ይምረጡ' : 'Select branch');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await employeeApi.createEmployee({
        fullName: fullName.trim(),
        amharicName: amharicName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        branchId,
        title: title.trim() || undefined,
        ritualTitle: title.trim() || undefined,
        workstation: workstation.trim() || undefined,
        createLoginAccount: createAccount,
        password: createAccount ? password : undefined,
      });

      navigate(`/admin/employees/${created.id}/services`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout selectedBranch={branchId} onBranchChange={setBranchId}>
      <div className="max-w-2xl mx-auto w-full text-[#FAF7F2] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2724]">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#D4AF37]">
              {isAm ? 'አዲስ ባለሙያ' : 'Add Specialist'}
            </h1>
            <p className="text-xs text-stone-400">
              {isAm ? 'የባለሙያ መረጃ ይመዝግቡ' : 'Provision personnel record'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/employees')}
            className="px-3 py-1.5 rounded-lg border border-[#2C2724] text-xs text-stone-300 hover:text-[#D4AF37] transition"
          >
            {isAm ? 'ተመለስ' : 'Back'}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-[#181412] p-6 rounded-xl border border-[#2C2724] space-y-4">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAm ? 'ሙሉ ስም *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sara Tadesse"
                className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-600 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAm ? 'የአማርኛ ስም' : 'Amharic Name'}
              </label>
              <input
                type="text"
                value={amharicName}
                onChange={(e) => setAmharicName(e.target.value)}
                placeholder="ምሳሌ፡ ሳራ ታደሰ"
                className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-600 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAm ? 'ስልክ ቁጥር *' : 'Phone Number *'}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 9..."
                className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-600 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAm ? 'ኢሜይል' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="specialist@eyobbeauty.com"
                className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-600 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Branch & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAm ? 'ቅርንጫፍ *' : 'Branch *'}
              </label>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {isAm ? 'ሙያ / ሚና' : 'Title / Role'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Stylist"
                className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-600 outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Workstation */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {isAm ? 'የስራ ቦታ' : 'Workstation'}
            </label>
            <input
              type="text"
              value={workstation}
              onChange={(e) => setWorkstation(e.target.value)}
              placeholder="e.g. Chair 02, VIP Suite"
              className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-600 outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Portal Access Toggle */}
          <div className="pt-2 border-t border-[#2C2724]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] block">
                  {isAm ? 'አካውንት ክፈት' : 'Create Login Account'}
                </span>
                <span className="text-[11px] text-stone-400">
                  {isAm ? 'የሰራተኛ መግቢያ ፍቀድ' : 'Allow staff floor login'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
              />
            </div>

            {createAccount && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {isAm ? 'የይለፍ ቃል' : 'Temporary Password'}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg px-3 py-2 text-xs text-[#FAF7F2] font-mono outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {isSubmitting
                ? isAm
                  ? 'በመመዝገብ ላይ...'
                  : 'Saving...'
                : isAm
                ? 'መዝግብ እና ቀጥል'
                : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddEmployeePage;
