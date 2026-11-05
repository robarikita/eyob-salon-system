import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { authApi } from '../../api/authApi';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setGeneratedToken(null);
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(identifier.trim());
      setSuccessMessage(res.message);
      if (res.resetToken) {
        setGeneratedToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to process reset request. Please try again.');
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
              {t('auth.forgotPassword')}
            </h1>
            <p className="text-xs text-[#8E7E73] mt-2 font-light leading-relaxed">
              Enter your registered email address or mobile phone number (+251). We will generate a secure reset link for your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-[#1D1714] border border-[#D4AF37]/40 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-xl">mark_email_read</span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed font-light">
                {successMessage}
              </p>
              {generatedToken && (
                <div className="pt-2 border-t border-[#3A332C]">
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold mb-2">
                    Security Reset Link Ready
                  </p>
                  <Link
                    to={`/reset-password?token=${generatedToken}`}
                    className="inline-block py-2 px-4 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs hover:bg-[#C59A3F] transition-colors"
                  >
                    Proceed to Reset Password →
                  </Link>
                </div>
              )}
            </div>
          )}

          {!successMessage && (
            <form className="space-y-5" onSubmit={handleSubmit}>
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
                  placeholder="name@eyobsalon.com or +251 9..."
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#0E0B09] border border-[#3A332C] text-[#EDE8E3] placeholder-[#5C534B] text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#C59A3F] disabled:opacity-50 text-black font-semibold rounded-lg text-sm tracking-wide transition-colors duration-200 mt-2 active:scale-[0.99] cursor-pointer"
              >
                {loading ? 'Generating...' : 'Send Reset Link / የማስተካከያ አገናኝ ላክ'}
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

export default ForgotPasswordPage;
