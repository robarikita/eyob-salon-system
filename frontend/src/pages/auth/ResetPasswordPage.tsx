import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { authApi } from '../../api/authApi';

export const ResetPasswordPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('A valid security reset token is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token.trim(), newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0E0B09] text-[#EDE8E3] min-h-screen flex flex-col justify-between antialiased selection:bg-[#D4AF37]/30 selection:text-[#D4AF37] font-sans">
      {/* Minimal Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-xl tracking-[0.2em] font-semibold text-[#D4AF37] uppercase select-none hover:opacity-90 transition-opacity"
        >
          EYOB
        </Link>
        <LanguageToggle />
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] bg-[#181412] border border-[#D4AF37]/30 rounded-xl p-8 sm:p-10 shadow-2xl relative">
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#D4AF37]">
              {t('auth.resetPassword')}
            </h1>
            <p className="text-xs text-[#8E7E73] mt-2 font-light">
              Choose a strong, secure new password for your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center p-6 bg-[#1D1714] border border-[#D4AF37]/40 rounded-xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h2 className="font-serif text-lg font-semibold text-[#D4AF37]">
                Password Reset Successful!
              </h2>
              <p className="text-xs text-stone-300">
                Your credentials have been securely updated. All previous active sessions have been invalidated.
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-2.5 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs hover:bg-[#C59A3F] transition-colors"
              >
                Proceed to Sign In Now →
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {!tokenFromUrl && (
                <div className="space-y-1.5">
                  <label
                    className="block text-xs uppercase tracking-wider text-[#B8ADA2] font-medium"
                    htmlFor="reset-token"
                  >
                    Reset Security Token
                  </label>
                  <input
                    id="reset-token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter security token"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#0E0B09] border border-[#3A332C] text-[#EDE8E3] placeholder-[#5C534B] text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-mono text-xs"
                  />
                </div>
              )}

              {/* Field 1: New Password */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs uppercase tracking-wider text-[#B8ADA2] font-medium"
                  htmlFor="new-password"
                >
                  {t('actions.newPassword')}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
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

              {/* Field 2: Confirm Password */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs uppercase tracking-wider text-[#B8ADA2] font-medium"
                  htmlFor="confirm-password"
                >
                  Confirm Password / የይለፍ ቃል አረጋግጥ
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-[#0E0B09] border border-[#3A332C] text-[#EDE8E3] placeholder-[#5C534B] text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#C59A3F] disabled:opacity-50 text-black font-semibold rounded-lg text-sm tracking-wide transition-colors duration-200 mt-2 active:scale-[0.99] cursor-pointer"
              >
                {loading ? 'Updating Credentials...' : 'Save New Password / አዲስ የይለፍ ቃል መዝግብ'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center pt-4 border-t border-[#3A332C]/60">
            <Link
              to="/login"
              className="text-xs text-[#A3998F] hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Back to {t('auth.signIn')}</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center">
        <p className="text-[11px] text-[#4E463E] tracking-widest uppercase">
          © 2026 EYOB SALON
        </p>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;

