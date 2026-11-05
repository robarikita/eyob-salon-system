import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { authApi } from '../../api/authApi';

export const StaffLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [workstation, setWorkstation] = useState('Hair');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // In live backend, login via identifier and pin/password
      const isPhone = /^(\+251|0)?9\d{8}$/.test(staffId.replace(/\s+/g, ''));
      const payload = isPhone
        ? { phone: staffId.trim(), password: pin }
        : { identifier: staffId.trim(), password: pin };

      const { user, tokens } = await authApi.login(payload);
      if (user.role !== 'EMPLOYEE' && user.role !== 'BRANCH_ADMIN' && user.role !== 'OWNER') {
        throw new Error('Access denied. Floor specialist credentials required.');
      }
      login({ ...user, workstation }, tokens.accessToken);
      navigate('/staff/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid Staff ID or PIN. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0E0B09] text-stone-200 font-sans antialiased min-h-screen flex flex-col justify-between select-none">
      {/* Top Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif tracking-widest text-lg sm:text-xl font-bold text-[#D4AF37]">
            EYOB STAFF
          </span>
        </Link>
        <LanguageToggle />
      </header>

      {/* Center Card Area */}
      <main className="w-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#181412] rounded-xl p-8 border border-[#D4AF37]/30 shadow-2xl">
          {/* Title */}
          <h1 className="font-serif text-2xl sm:text-3xl text-[#D4AF37] font-semibold text-center tracking-wide mb-8">
            {t('auth.staffLogin')}
          </h1>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Field 1: Staff ID */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs uppercase tracking-wider text-stone-400 font-semibold"
                htmlFor="staff-id"
              >
                {t('auth.staffId')}
              </label>
              <div className="relative flex items-center">
                <input
                  id="staff-id"
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. 104 or +251911234567"
                  required
                  className="w-full h-12 px-4 rounded-lg bg-black/40 border border-stone-800 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37] transition-colors text-base"
                />
              </div>
            </div>

            {/* Field 2: PIN */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs uppercase tracking-wider text-stone-400 font-semibold"
                htmlFor="pin-input"
              >
                {t('auth.pin')}
              </label>
              <div className="relative flex items-center">
                <input
                  id="pin-input"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="••••"
                  required
                  className="w-full h-12 px-4 rounded-lg bg-black/40 border border-stone-800 text-stone-100 placeholder:text-stone-600 tracking-[0.3em] focus:outline-none focus:border-[#D4AF37] transition-colors text-lg"
                />
              </div>
            </div>

            {/* Field 3: Workstation */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs uppercase tracking-wider text-stone-400 font-semibold"
                htmlFor="workstation"
              >
                {t('auth.workstation')}
              </label>
              <div className="relative flex items-center">
                <select
                  id="workstation"
                  value={workstation}
                  onChange={(e) => setWorkstation(e.target.value)}
                  required
                  className="w-full h-12 px-4 pr-10 rounded-lg bg-black/40 border border-stone-800 text-stone-100 focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer transition-colors text-base"
                >
                  <option className="bg-[#181412] text-stone-100" value="Reception">
                    Reception / መስተንግዶ
                  </option>
                  <option className="bg-[#181412] text-stone-100" value="Hair">
                    Hair / ፀጉር ማስተካከል
                  </option>
                  <option className="bg-[#181412] text-stone-100" value="Nails">
                    Nails / ጥፍር
                  </option>
                  <option className="bg-[#181412] text-stone-100" value="Spa">
                    Spa / ስፓና ገላ
                  </option>
                </select>
                <span className="material-symbols-outlined absolute right-3 pointer-events-none text-stone-500 text-xl">
                  expand_more
                </span>
              </div>
            </div>

            {/* Clock In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 py-3 mt-2 rounded-lg bg-[#D4AF37] hover:bg-[#EED888] active:scale-[0.99] text-black font-bold text-base uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? '...' : t('actions.clockIn')}</span>
            </button>
          </form>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full py-4 text-center text-xs text-stone-600">
        <span>Eyob Floor Specialist Terminal</span>
      </footer>
    </div>
  );
};

export default StaffLoginPage;

