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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Format phone: if user didn't write +251, prepend it
      let cleanPhone = phone.trim().replace(/\s+/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (!cleanPhone.startsWith('+251')) {
        cleanPhone = `+251${cleanPhone}`;
      }

      const { user, tokens } = await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        password,
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
        <div className="w-full max-w-md bg-[#181412] border border-[#D4AF37]/30 rounded-2xl p-8 sm:p-10 shadow-2xl relative">
          {/* Card Title & Global Access Badge */}
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl text-[#D4AF37] font-medium tracking-tight mb-2">
              {t('auth.createAccount')}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium tracking-wide mt-1">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>{t('profile.globalPass')}</span>
            </div>
            <p className="text-neutral-400 text-[11px] font-mono tracking-wider mt-1.5">
              Bole · Kazanchis · CMC
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* First & Last Name Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-1.5"
                  htmlFor="firstname"
                >
                  {t('profile.firstName')}
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Sara"
                  required
                  className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div>
                <label
                  className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-1.5"
                  htmlFor="lastname"
                >
                  {t('profile.lastName')}
                </label>
                <input
                  id="lastname"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tadesse"
                  required
                  className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            {/* Field: Phone */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-1.5"
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
                  className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg pl-14 pr-4 py-2.5 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>
            </div>

            {/* Field: Email (Optional) */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-1.5"
                htmlFor="email"
              >
                {t('profile.email')}{' '}
                <span className="text-[10px] text-neutral-500 normal-case">(Optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sara@example.com"
                className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>

            {/* Field: Password */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider text-neutral-300 font-medium mb-1.5"
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
                className="w-full bg-[#0E0B09] border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#D4AF37] hover:bg-[#e4c04a] disabled:opacity-50 text-black font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-colors duration-200 cursor-pointer shadow-lg shadow-[#D4AF37]/10"
            >
              {loading ? '...' : t('auth.register')}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
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
