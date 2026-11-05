import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { authApi } from '../../api/authApi';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const redirectAfterLogin = (role: string) => {
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'EMPLOYEE') {
      navigate('/staff/dashboard', { replace: true });
    } else if (role === 'BRANCH_ADMIN' || role === 'OWNER') {
      navigate('/admin/appointments', { replace: true });
    } else {
      navigate('/my-bookings', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isPhoneOnly = /^(\+251|0)?9\d{8}$/.test(identifier.replace(/\s+/g, ''));
      const payload = isPhoneOnly
        ? { phone: identifier.trim(), password }
        : { identifier: identifier.trim(), password };

      const { user, tokens } = await authApi.login(payload);
      login(user, tokens.accessToken);
      redirectAfterLogin(user.role);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your phone/email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0E0B09] text-[#EDE8E3] min-h-screen flex flex-col justify-between antialiased selection:bg-[#D4AF37]/30 selection:text-[#D4AF37] font-sans">
      {/* Minimal Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-xl tracking-[0.2em] font-semibold text-[#D4AF37] uppercase select-none hover:opacity-90 transition-opacity"
        >
          EYOB
        </Link>
        <LanguageToggle />
      </header>

      {/* Central Centered Authentication Card */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] bg-[#181412] border border-[#D4AF37]/30 rounded-xl p-8 sm:p-10 shadow-2xl relative">
          {/* Card Title */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#D4AF37]">
              {t('auth.signIn')}
            </h1>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* Authentication Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Field 1: Email or Phone */}
            <div className="space-y-1.5">
              <label
                className="block text-xs uppercase tracking-wider text-[#B8ADA2] font-medium"
                htmlFor="identifier"
              >
                {t('auth.emailOrPhone')}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@eyobsalon.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-[#0E0B09] border border-[#3A332C] text-[#EDE8E3] placeholder-[#5C534B] text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
            </div>

            {/* Field 2: Password with Eye Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="block text-xs uppercase tracking-wider text-[#B8ADA2] font-medium"
                  htmlFor="password"
                >
                  {t('auth.password')}
                </label>
                <span className="text-xs text-[#D4AF37] hover:underline cursor-pointer transition-colors font-medium">
                  {t('actions.forgot')}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-4 pr-11 py-3 rounded-lg bg-[#0E0B09] border border-[#3A332C] text-[#EDE8E3] placeholder-[#5C534B] text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#80756B] hover:text-[#D4AF37] transition-colors p-1 flex items-center justify-center focus:outline-none"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#C59A3F] disabled:opacity-50 text-black font-semibold rounded-lg text-sm tracking-wide transition-colors duration-200 mt-2 active:scale-[0.99]"
            >
              {loading ? '...' : t('auth.signIn')}
            </button>
          </form>

          {/* Bottom Register Link */}
          <div className="mt-8 text-center">
            <Link
              to="/register"
              className="text-xs text-[#A3998F] hover:text-[#D4AF37] transition-colors tracking-wide"
            >
              Don't have an account?{' '}
              <span className="text-[#D4AF37] font-medium ml-1">
                {t('auth.register')}
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Footer Bottom Space */}
      <footer className="w-full py-4 text-center">
        <p className="text-[11px] text-[#4E463E] tracking-widest uppercase">
          © 2025 EYOB SALON
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;

