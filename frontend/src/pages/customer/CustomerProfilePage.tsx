import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const CustomerProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const initials = `${user?.firstName?.[0] || 'S'}${user?.lastName?.[0] || 'T'}`.toUpperCase();
  const displayName = `${user?.firstName || 'Sara'} ${user?.lastName || 'Tadesse'}`;
  const displayPhone = user?.phone || '+251 91 123 4567';

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword) {
      if (newPassword.length < 6) {
        setFeedback({ type: 'error', message: 'Password must be at least 6 characters' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({ type: 'error', message: 'Passwords do not match' });
        return;
      }
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setFeedback({ type: 'success', message: 'Preferences saved successfully / ምርጫዎችዎ ተቀምጠዋል' });
      setNewPassword('');
      setConfirmPassword('');
    }, 400);
  };

  return (
    <div className="bg-[#0E0B09] text-stone-200 font-sans min-h-screen flex flex-col antialiased selection:bg-[#D4AF37] selection:text-black">
      {/* Top Navigation Bar */}
      <header className="w-full bg-[#140F0D]/95 border-b border-[#D4AF37]/15 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand on Left */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="font-serif text-2xl tracking-[0.25em] text-[#D4AF37] uppercase font-semibold">
              EYOB
            </span>
            <span className="text-xs uppercase tracking-widest text-stone-500 font-light border-l border-stone-800 pl-3 hidden sm:inline-block">
              Salon
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-lg bg-black/30 border border-stone-800/60">
            <Link
              to="/book"
              className="px-4 py-2 rounded-md text-sm text-stone-400 hover:text-stone-200 transition-colors"
            >
              {t('nav.book')}
            </Link>
            <Link
              to="/my-bookings"
              className="px-4 py-2 rounded-md text-sm text-stone-400 hover:text-stone-200 transition-colors"
            >
              {t('nav.myBookings')}
            </Link>
            <Link
              to="/account/profile"
              aria-current="page"
              className="px-4 py-2 rounded-md text-sm font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 transition-all"
            >
              {t('nav.profile')}
            </Link>
          </nav>

          {/* Language Toggle on Right */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Content: Single Focused Settings Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl mx-auto my-12 bg-[#181412] border border-[#D4AF37]/25 rounded-xl p-8 shadow-2xl">
          {/* Card Header: Avatar, Name, Phone */}
          <div className="flex items-center gap-5 pb-6 border-b border-[#D4AF37]/15">
            <div className="relative w-16 h-16 rounded-full bg-[#241E1A] border-2 border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-xl font-serif font-semibold shadow-inner">
              {initials}
            </div>
            <div>
              <h1 className="font-serif text-2xl text-stone-100 font-semibold tracking-wide">
                {displayName}
              </h1>
              <p className="text-sm text-stone-400 tracking-wider mt-0.5">{displayPhone}</p>
            </div>
          </div>

          {feedback && (
            <div
              className={`mt-6 p-3 rounded-lg text-xs text-center border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Settings Sections */}
          <form className="pt-6 space-y-7" onSubmit={handleSave}>
            {/* Section 1: Language / ቋንቋ */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                {t('actions.language')}
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/40 rounded-lg border border-stone-800">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md transition-all text-sm font-medium ${
                    language === 'en'
                      ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]'
                      : 'hover:bg-stone-800/40 text-stone-400 border border-transparent'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('am')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md transition-all text-sm font-medium ${
                    language === 'am'
                      ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]'
                      : 'hover:bg-stone-800/40 text-stone-400 border border-transparent'
                  }`}
                >
                  አማርኛ
                </button>
              </div>
            </div>

            {/* Section 2: Security / ደህንነት */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                {t('actions.security')}
              </label>
              <div className="space-y-3">
                <div>
                  <label
                    className="block text-xs text-stone-400 mb-1.5 font-medium"
                    htmlFor="new_password"
                  >
                    {t('actions.newPassword')}
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0E0B09] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm transition-all"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs text-stone-400 mb-1.5 font-medium"
                    htmlFor="confirm_password"
                  >
                    {t('actions.confirm')}
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0E0B09] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div className="pt-6 border-t border-[#D4AF37]/15 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2.5 rounded-lg border border-red-900/60 text-red-400 hover:text-red-300 hover:border-red-700/80 hover:bg-red-950/20 text-sm font-medium transition-all"
              >
                {t('actions.signOut')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-7 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29e2f] text-black font-semibold text-sm tracking-wide shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? '...' : t('actions.save')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomerProfilePage;
