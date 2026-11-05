import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { authApi } from '../../api/authApi';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const val = value.slice(-1);
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, tokens } = await authApi.login({
        identifier: username.trim(),
        password,
      });

      if (user.role !== 'BRANCH_ADMIN' && user.role !== 'OWNER') {
        throw new Error('Access denied. Administrator clearance required.');
      }

      login(user, tokens.accessToken);
      navigate('/admin/appointments', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authorization failed. Please check your administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0E0B09] font-sans text-[#F5F2EB] antialiased min-h-screen flex flex-col justify-between select-none">
      {/* Top Bar */}
      <header className="w-full px-6 py-6 sm:px-12 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <span className="tracking-[0.25em] text-xs font-semibold text-[#D4AF37] uppercase">
            GOVERNANCE
          </span>
          <span className="text-xs text-[#7A7268] tracking-widest hidden sm:inline">• EYOB SALON</span>
        </Link>
        <LanguageToggle showIcon />
      </header>

      {/* Center Card Area */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-[#181412] border border-[#D4AF37]/30 rounded-xl max-w-md w-full p-8 shadow-2xl relative">
          {/* Card Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl sm:text-[26px] text-[#D4AF37] tracking-tight leading-snug">
              {t('auth.adminPortal')}
            </h1>
            <p className="text-xs text-[#8C8377] mt-1.5 tracking-wide">
              Authorized Salon Managers &amp; Proprietor Gateway
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Field 1: Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#C7BFA7] tracking-wider">
                {t('auth.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@eyobsalon.com"
                required
                className="w-full bg-[#100D0B] border border-[#D4AF37]/25 focus:border-[#D4AF37] text-[#F5F2EB] text-sm rounded-lg px-3.5 py-2.5 outline-none transition-colors placeholder-[#5C554B]"
              />
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-[#C7BFA7] tracking-wider">
                  {t('auth.password')}
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#100D0B] border border-[#D4AF37]/25 focus:border-[#D4AF37] text-[#F5F2EB] text-sm rounded-lg pl-3.5 pr-10 py-2.5 outline-none transition-colors placeholder-[#5C554B]"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7268] hover:text-[#D4AF37] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Field 3: 2FA Security Code */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-medium text-[#C7BFA7] tracking-wider">
                {t('auth.securityCode')}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="text-center bg-[#100D0B] border border-[#D4AF37]/25 focus:border-[#D4AF37] text-[#D4AF37] font-semibold text-lg py-2 rounded-lg outline-none transition-colors"
                  />
                ))}
              </div>
            </div>

            {/* Authorize Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] hover:bg-[#C29E2E] active:scale-[0.99] text-[#0E0B09] font-bold py-3 px-4 rounded-lg tracking-wider text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? '...' : t('actions.authorize')}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-5 text-center text-[11px] text-[#5C554B] tracking-wider">
        <span>Eyob Salon Executive Gateway</span>
      </footer>
    </div>
  );
};

export default AdminLoginPage;

