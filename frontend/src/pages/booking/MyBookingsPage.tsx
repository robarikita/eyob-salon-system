import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const MyBookingsPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === 'am';

  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(true);

  // Cancellation Modal state
  const [cancelTarget, setCancelTarget] = useState<BookingDTO | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review Modal state
  const [reviewTarget, setReviewTarget] = useState<{ id: string; itemId: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const list = await bookingApi.getMyBookings(activeTab);
      setBookings(list || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleExecuteCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason || cancelReason.trim().length < 3) {
      setCancelError(isAm ? 'ምክንያቱ ቢያንስ 3 ፊደላት መሆን አለበት' : 'Reason must be at least 3 characters');
      return;
    }
    try {
      setCancelling(true);
      setCancelError(null);
      await bookingApi.transitionBookingStatus(cancelTarget.id, 'CANCELLED', cancelReason.trim());
      setCancelTarget(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: any) {
      setCancelError(err.message || (isAm ? 'ስረዛ አልተሳካም' : 'Cancellation failed'));
    } finally {
      setCancelling(false);
    }
  };

  const handleExecuteReview = async () => {
    if (!reviewTarget) return;
    try {
      setSubmittingReview(true);
      await bookingApi.createReview(reviewTarget.itemId, {
        rating,
        comment,
      });
      setReviewTarget(null);
      setComment('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || (isAm ? 'አስተያየት አልተሳካም' : 'Review failed'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            {isAm ? 'የጸደቀ' : 'Confirmed'}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-600/60 animate-pulse">
            {isAm ? 'በሂደት' : 'In Service'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-700/60">
            {isAm ? 'የተጠናቀቀ' : 'Completed'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60">
            {isAm ? 'የተሰረዘ' : 'Cancelled'}
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-stone-400 border border-stone-700">
            {isAm ? 'አልመጡም' : 'No Show'}
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-950/80 text-yellow-400 border border-yellow-700/60">
            {isAm ? 'በመጠባበቅ' : 'Pending'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-800 text-stone-400 border border-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0B09] text-[#FAF7F2] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#181412] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-[10px] uppercase tracking-normal font-sans text-stone-400 block -mt-1">{isAm ? 'የውበት ሳሎን' : 'Sanctuary & Spa'}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/account/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0E0B09] text-stone-300 hover:text-[#D4AF37] border border-[#2C2724] text-xs font-semibold transition"
                title={isAm ? 'መገለጫ' : 'Profile'}
              >
                <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">account_circle</span>
                <span className="max-w-[120px] truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || user?.phone || ''}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/30 text-xs font-semibold transition flex items-center gap-1"
                title={isAm ? 'ውጣ' : 'Sign Out'}
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden sm:inline">{isAm ? 'ውጣ' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-stone-300 hover:text-[#D4AF37] text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>{isAm ? 'ግባ' : 'Sign In'}</span>
            </Link>
          )}

          <Link
            to="/book"
            className="px-3.5 py-1.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>{isAm ? 'ቀጠሮ ያዝ' : 'Book'}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2C2724]">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#FAF7F2]">
              {isAm ? 'ቀጠሮዎቼ' : 'My Bookings'}
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {isAm ? 'የቀጠሮ ዝርዝር' : 'Sanctuary Appointments'}
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 bg-[#181412] p-1 rounded-lg border border-[#2C2724]">
            <button
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'UPCOMING'
                  ? 'bg-[#D4AF37] text-[#0E0B09]'
                  : 'text-stone-400 hover:text-[#FAF7F2]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">event</span>
              <span>{isAm ? 'የሚመጡ' : 'Upcoming'}</span>
            </button>
            <button
              onClick={() => setActiveTab('PAST')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PAST'
                  ? 'bg-[#D4AF37] text-[#0E0B09]'
                  : 'text-stone-400 hover:text-[#FAF7F2]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">history</span>
              <span>{isAm ? 'ያለፉ' : 'Past'}</span>
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'CANCELLED'
                  ? 'bg-[#D4AF37] text-[#0E0B09]'
                  : 'text-stone-400 hover:text-[#FAF7F2]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              <span>{isAm ? 'የተሰረዙ' : 'Cancelled'}</span>
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <span>{isAm ? 'በመጫን ላይ...' : 'Loading appointments...'}</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 px-6 bg-[#181412] rounded-xl border border-[#2C2724] text-center max-w-md mx-auto space-y-4">
            <span className="material-symbols-outlined text-4xl text-stone-600 block">spa</span>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
                {isAm ? 'ምንም ቀጠሮ የለም' : 'No Bookings'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {isAm ? 'አዲስ ቀጠሮ በመያዝ ይጀምሩ' : 'Reserve your luxury ritual'}
              </p>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-[#D4AF37] text-[#0E0B09] font-bold text-xs uppercase tracking-wider hover:bg-[#C59A3F] transition"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>{isAm ? 'ቀጠሮ ያዝ' : 'Book Ritual'}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const items = b.items && b.items.length > 0 ? b.items : [];
              const firstItem = items[0];
              const dateObj = firstItem?.startTime ? new Date(firstItem.startTime) : new Date(b.createdAt);
              const dateStr = dateObj.toLocaleDateString(isAm ? 'am-ET' : 'en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isUpcoming = b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT';
              const isCompleted = b.status === 'COMPLETED';

              return (
                <div
                  key={b.id}
                  className="bg-[#181412] rounded-xl p-5 border border-[#2C2724] space-y-4 hover:border-[#D4AF37]/40 transition"
                >
                  {/* Card Header: Booking Number & Status Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#D4AF37] bg-[#0E0B09] px-2.5 py-1 rounded border border-[#D4AF37]/30 tracking-wider">
                        #{b.bookingNumber}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[#FAF7F2] font-semibold block">{dateStr}</span>
                      <span className="text-stone-400 text-[11px]">{timeStr} • {b.branch?.name}</span>
                    </div>
                  </div>

                  {/* Itemized Services Sequence */}
                  <div className="space-y-2.5">
                    {items.map((it, idx) => {
                      const serviceName =
                        it.snapshotServiceName ||
                        (isAm && it.service?.amharicName ? it.service.amharicName : it.service?.name) ||
                        it.serviceTitleSnapshot ||
                        (isAm ? 'አገልግሎት' : 'Service');

                      const specialistName =
                        it.snapshotEmployeeName ||
                        (it.employee ? `${it.employee.firstName} ${it.employee.lastName || ''}`.trim() : null) ||
                        (isAm ? 'ባለሙያ' : 'Specialist');

                      const initials = specialistName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      const price = it.snapshotPrice ?? it.priceSnapshot ?? 0;
                      const duration = it.snapshotDurationMinutes ?? it.durationSnapshot ?? 60;

                      return (
                        <div
                          key={it.id || idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#0E0B09] border border-[#2C2724]/70 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {/* Specialist Avatar Pill */}
                            <div
                              className="w-8 h-8 rounded-full bg-[#181412] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-[11px]"
                              title={specialistName}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="font-serif font-bold text-[#FAF7F2] text-sm">{serviceName}</div>
                              <div className="text-[11px] text-stone-400">
                                {specialistName} • {duration} {isAm ? 'ደቂቃ' : 'Mins'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-[#D4AF37] text-sm">
                              {Number(price).toLocaleString()} ETB
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial Ledger & Actions Bar */}
                  <div className="pt-3 border-t border-[#2C2724] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-stone-400">
                      <div>
                        <span className="text-[10px] uppercase text-stone-500 block font-bold">
                          {isAm ? 'ጠቅላላ' : 'Total'}
                        </span>
                        <span className="font-mono font-bold text-[#FAF7F2]">
                          {Number(b.totalAmount).toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="h-6 w-px bg-[#2C2724]" />
                      <div>
                        <span className="text-[10px] uppercase text-stone-500 block font-bold">
                          {isAm ? 'ተቀማጭ' : 'Deposit'}
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {Number(b.depositPaid || b.depositAmount || 0).toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="h-6 w-px bg-[#2C2724]" />
                      <div>
                        <span className="text-[10px] uppercase text-stone-500 block font-bold">
                          {isAm ? 'ቀሪ ሂሳብ' : 'Balance Due'}
                        </span>
                        <span className="font-mono font-bold text-[#D4AF37]">
                          {Number(b.balanceDue).toLocaleString()} ETB
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUpcoming && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(b);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          className="px-3 py-1.5 rounded border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">cancel</span>
                          <span>{isAm ? 'ሰርዝ' : 'Cancel'}</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="flex items-center gap-2">
                          <Link
                            to="/book"
                            className="px-3 py-1.5 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">replay</span>
                            <span>{isAm ? 'ድጋሚ ያዝ' : 'Book Again'}</span>
                          </Link>

                          {firstItem && !firstItem.review && (
                            <button
                              type="button"
                              onClick={() =>
                                setReviewTarget({
                                  id: b.id,
                                  itemId: firstItem.id,
                                  name: firstItem.snapshotServiceName || firstItem.serviceTitleSnapshot || 'Service',
                                })
                              }
                              className="px-3 py-1.5 rounded border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs font-bold transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">star</span>
                              <span>{isAm ? 'አስተያየት' : 'Review'}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {firstItem?.review && (
                        <span className="text-xs text-[#D4AF37] flex items-center gap-1 font-semibold">
                          ★ {firstItem.review.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181412] rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#2C2724] space-y-4 text-[#FAF7F2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
              <h3 className="font-serif text-lg font-bold text-red-400">
                {isAm ? 'ቀጠሮ ሰርዝ' : 'Cancel Booking'}
              </h3>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="text-stone-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-stone-400">
              {isAm
                ? `ቀጠሮ #${cancelTarget.bookingNumber} መሰረዝ ይፈልጋሉ?`
                : `Cancel reservation #${cancelTarget.bookingNumber}?`}
            </p>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                {isAm ? 'የስረዛ ምክንያት' : 'Cancellation Reason'}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isAm ? 'ምክንያትዎን ያስገቡ...' : 'Enter cancellation reason...'}
                rows={3}
                className="w-full text-xs p-2.5 rounded bg-[#0E0B09] border border-[#2C2724] text-[#FAF7F2] outline-none focus:border-red-400"
              />
              {cancelError && (
                <span className="text-[11px] text-red-400 block mt-1">{cancelError}</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded text-xs font-bold text-stone-400 hover:bg-[#2C2724]"
              >
                {isAm ? 'ተመለስ' : 'Keep'}
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={cancelling}
                className="px-4 py-2 rounded bg-red-900 hover:bg-red-800 text-white text-xs font-bold uppercase transition"
              >
                {cancelling ? (isAm ? 'በመሰረዝ...' : 'Cancelling...') : isAm ? 'አረጋግጥ' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181412] rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#2C2724] space-y-4 text-[#FAF7F2]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2724]">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                {isAm ? 'አስተያየት ስጥ' : 'Service Review'}
              </h3>
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="text-stone-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-stone-400">{reviewTarget.name}</p>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                {isAm ? 'ደረጃ (1-5 ኮከብ)' : 'Rating (1-5 Stars)'}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition ${rating >= star ? 'text-[#D4AF37]' : 'text-stone-600'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-300 block mb-1">
                {isAm ? 'አስተያየት' : 'Comments'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isAm ? 'ተሞክሮዎን ያካፍሉ...' : 'Share your ritual experience...'}
                rows={3}
                className="w-full text-xs p-2.5 rounded bg-[#0E0B09] border border-[#2C2724] text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 rounded text-xs font-bold text-stone-400 hover:bg-[#2C2724]"
              >
                {isAm ? 'ዝጋ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteReview}
                disabled={submittingReview}
                className="px-4 py-2 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase transition"
              >
                {submittingReview ? (isAm ? 'በመላክ...' : 'Submitting...') : isAm ? 'ላክ' : 'Post Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
