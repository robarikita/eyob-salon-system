import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { customerApi, CustomerProfileData } from '../../api/customerApi';

export const CustomerProfilePage: React.FC = () => {
  const { user, logout, updateProfile: updateAuthUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredLang, setPreferredLang] = useState<'EN' | 'AM'>('EN');
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getProfile();
        if (isMounted) {
          setProfile(data);
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
          setPreferredLang((data.preferredLang as 'EN' | 'AM') || 'EN');
          setSmsNotifications(data.smsNotifications ?? true);
          setEmailNotifications(data.emailNotifications ?? true);
        }
      } catch (err: any) {
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: err.message || 'Failed to load profile',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const initials = `${(firstName?.[0] || user?.firstName?.[0] || 'E')}${(lastName?.[0] || user?.lastName?.[0] || 'S')}`.toUpperCase();
  const fullName = `${firstName || user?.firstName || ''} ${lastName || user?.lastName || ''}`.trim() || 'Patron';

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    try {
      let cleanPhone = phone.trim().replace(/\s+/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (!cleanPhone.startsWith('+251')) {
        cleanPhone = `+251${cleanPhone}`;
      }

      const updated = await customerApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        email: email.trim() || null,
        preferredLang,
        smsNotifications,
        emailNotifications,
      });

      setProfile(updated);
      setPhone(updated.phone);

      // Update local auth context cache
      updateAuthUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        email: updated.email,
      });

      // Synchronize language context
      const targetLang = preferredLang.toLowerCase() as 'en' | 'am';
      if (language !== targetLang) {
        setLanguage(targetLang);
      }

      setFeedback({
        type: 'success',
        message: targetLang === 'am' ? 'መረጃዎ በተሳካ ሁኔታ ተዘምኗል' : 'Profile updated successfully',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save profile changes',
      });
    } finally {
      setSaving(false);
    }
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

          {/* Actions on Right */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-900/60 hover:bg-red-950/30 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span className="hidden sm:inline">{t('actions.signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-400 gap-3">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs tracking-widest uppercase">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Patron Profile Header Badge */}
            <div className="bg-[#181412] border border-[#D4AF37]/25 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
                <div className="w-20 h-20 rounded-full bg-[#241E1A] border-2 border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-2xl font-serif font-bold shadow-inner">
                  {initials}
                </div>
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl text-stone-100 font-semibold tracking-wide">
                    {fullName}
                  </h1>
                  <p className="text-sm text-stone-400 tracking-wider mt-1">{phone || user?.phone}</p>
                </div>
              </div>

              {/* Global Sanctuary Pass Pill */}
              <div className="z-10 flex flex-col items-center sm:items-end gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] text-xs font-semibold tracking-wide">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>{t('profile.globalPass')}</span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono tracking-wider">
                  Bole · Kazanchis · CMC
                </p>
              </div>

              {/* Decorative Subtle Ambient Glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Notification Feedback */}
            {feedback && (
              <div
                className={`p-4 rounded-xl text-xs sm:text-sm text-center border font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* Two Column Grid: Personal Dossier & Ritual Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Personal Dossier */}
              <div className="bg-[#181412] border border-[#D4AF37]/20 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#D4AF37]/15">
                  <span className="material-symbols-outlined text-[#D4AF37] text-xl">person</span>
                  <h2 className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                    {t('profile.title')}
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-medium">
                      {t('profile.firstName')}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Sara"
                      className="w-full bg-[#0E0B09] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm transition-all"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-medium">
                      {t('profile.lastName')}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Tadesse"
                      className="w-full bg-[#0E0B09] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-medium">
                      {t('auth.phone')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+251911234567"
                      className="w-full bg-[#0E0B09] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm font-mono transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1.5 font-medium">
                      {t('profile.email')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sara@example.com"
                      className="w-full bg-[#0E0B09] border border-stone-800 rounded-lg px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Ritual Preferences */}
              <div className="bg-[#181412] border border-[#D4AF37]/20 rounded-2xl p-6 sm:p-7 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 pb-4 border-b border-[#D4AF37]/15">
                    <span className="material-symbols-outlined text-[#D4AF37] text-xl">tune</span>
                    <h2 className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                      {t('profile.contactPrefs')}
                    </h2>
                  </div>

                  <div className="pt-5 space-y-6">
                    {/* Preferred Language */}
                    <div className="space-y-2.5">
                      <label className="block text-xs uppercase tracking-wider text-stone-400 font-medium">
                        {t('actions.language')}
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-1 bg-black/40 rounded-xl border border-stone-800">
                        <button
                          type="button"
                          onClick={() => setPreferredLang('EN')}
                          className={`py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                            preferredLang === 'EN'
                              ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]'
                              : 'text-stone-400 hover:text-stone-200 border border-transparent'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreferredLang('AM')}
                          className={`py-2.5 px-4 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                            preferredLang === 'AM'
                              ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]'
                              : 'text-stone-400 hover:text-stone-200 border border-transparent'
                          }`}
                        >
                          አማርኛ
                        </button>
                      </div>
                    </div>

                    {/* SMS Notifications Toggle */}
                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-stone-800/80 cursor-pointer hover:border-[#D4AF37]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#D4AF37] text-lg">sms</span>
                        <span className="text-xs font-medium text-stone-200">{t('profile.smsAlerts')}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#0E0B09] border-stone-700 text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                      />
                    </label>

                    {/* Email Notifications Toggle */}
                    <label className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-stone-800/80 cursor-pointer hover:border-[#D4AF37]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#D4AF37] text-lg">mail</span>
                        <span className="text-xs font-medium text-stone-200">{t('profile.emailAlerts')}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#0E0B09] border-stone-700 text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0E0B09] border border-stone-800/60 text-[11px] text-stone-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D4AF37] text-base">info</span>
                  <span>Cross-branch reservation alerts are dispatched via selected preferences.</span>
                </div>
              </div>
            </div>

            {/* Card 3: Sanctuary Visit Statistics */}
            {profile?.stats && (
              <div className="bg-[#181412] border border-[#D4AF37]/20 rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#D4AF37]/15">
                  <span className="material-symbols-outlined text-[#D4AF37] text-xl">history</span>
                  <h2 className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
                    {t('profile.visits')}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-[#0E0B09] border border-stone-800">
                    <p className="text-2xl font-serif font-bold text-[#D4AF37]">
                      {profile.stats.totalBookings}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 mt-1">
                      {t('profile.total')}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0E0B09] border border-stone-800">
                    <p className="text-2xl font-serif font-bold text-emerald-400">
                      {profile.stats.completedVisits}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 mt-1">
                      {t('profile.completed')}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0E0B09] border border-stone-800">
                    <p className="text-2xl font-serif font-bold text-amber-400">
                      {profile.stats.activeBookings}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-stone-400 mt-1">
                      {t('profile.active')}
                    </p>
                  </div>
                </div>

                {/* Branch Breakdown */}
                {profile.stats.branchVisits && profile.stats.branchVisits.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {profile.stats.branchVisits.map((bv) => (
                      <span
                        key={bv.branchId}
                        className="px-3 py-1 rounded-md bg-[#0E0B09] border border-[#D4AF37]/30 text-xs text-stone-300"
                      >
                        {bv.branchName}: <strong className="text-[#D4AF37]">{bv.count}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2.5 rounded-xl border border-red-900/60 text-red-400 hover:text-red-300 hover:border-red-700/80 hover:bg-red-950/20 text-xs font-semibold uppercase tracking-wider transition-all"
              >
                {t('actions.signOut')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c29e2f] text-black font-semibold text-xs uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {saving ? '...' : t('actions.save')}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default CustomerProfilePage;
