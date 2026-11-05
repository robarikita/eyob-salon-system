import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { authApi } from '../../api/authApi';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Bole');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'Patron';
      const lastName = parts.slice(1).join(' ') || 'Client';

      // Format phone: if user didn't write +251, prepend it
      let cleanPhone = phone.trim().replace(/\s+/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (!cleanPhone.startsWith('+251')) {
        cleanPhone = `+251${cleanPhone}`;
      }

      const { user, tokens } = await authApi.register({
        firstName,
        lastName,
        phone: cleanPhone,
        password,
        branch,
      });

      login(user, tokens.accessToken);
      navigate('/my-bookings', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your phone number and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0E0B09] font-sans text-neutral-200 min-h-screen flex flex-col justify-between selection:bg-[#D4AF37] selection:text-black">
      {/* Top Bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b border-white/5 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-widest text-[#D4AF37]">EYOB</span>
        </Link>
        <LanguageToggle />
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-[#181412] border border-[#D4AF37]/30 rounded-xl p-8 sm:p-10 shadow-2xl relative">
          {/* Card Title */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl text-[#D4AF37] font-medium tracking-tight mb-2">
              {t('auth.createAccount')}
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm">Eyob Salon Patron Registration</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Field 1: Full Name */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-2"
                htmlFor="fullname"
              >
                {t('auth.fullName')}
              </label>
              <input
                id="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sara Haile"
                required
                className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>

            {/* Field 2: Phone */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-2"
                htmlFor="phone"
              >
                {t('auth.phone')}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-semibold text-[#D4AF37] select-none">
                  +251
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="912 345 678"
                  required
                  className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg pl-14 pr-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            {/* Field 3: Password */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-2"
                htmlFor="password"
              >
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
                className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>

            {/* Field 4: Branch */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-2"
                htmlFor="branch"
              >
                {t('auth.branch')}
              </label>
              <div className="relative">
                <select
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-100 appearance-none focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all cursor-pointer"
                >
                  <option value="Bole">Bole Flagship</option>
                  <option value="Kazanchis">Kazanchis Executive</option>
                  <option value="CMC">CMC Heights Sanctuary</option>
                </select>
                <span className="material-symbols-outlined absolute right-3.5 top-3.5 text-neutral-500 pointer-events-none text-lg">
                  expand_more
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#D4AF37] hover:bg-[#e4c04a] disabled:opacity-50 text-black font-semibold text-sm tracking-wide py-3.5 px-4 rounded-lg transition-colors duration-200 cursor-pointer shadow-lg shadow-[#D4AF37]/10"
            >
              {loading ? '...' : t('auth.register')}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-xs text-neutral-400 hover:text-[#D4AF37] transition-colors"
            >
              {t('actions.haveAccount')}{' '}
              <span className="text-[#D4AF37] font-medium ml-1">
                {t('auth.signIn')}
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center">
        <p className="text-[11px] text-neutral-600 tracking-widest uppercase">
          © 2025 EYOB SALON
        </p>
      </footer>
    </div>
  );
};

export default RegisterPage;
