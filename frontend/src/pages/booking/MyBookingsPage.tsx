import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingApi, BookingDTO } from '../../api/bookingApi';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../../components/common/LanguageToggle';

export const MyBookingsPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState<BookingDTO | null>(null);
  const [newDate, setNewDate] = useState('2026-11-20');
  const [newSlot, setNewSlot] = useState('11:00');
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelBookingTarget, setCancelBookingTarget] = useState<BookingDTO | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [reviewBookingTarget, setReviewBookingTarget] = useState<{ id: string; itemId: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const list = await bookingApi.getMyBookings(activeTab);
      setBookings(list);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleExecuteReschedule = async () => {
    if (!rescheduleBookingTarget) return;
    try {
      setRescheduling(true);
      const [h, m] = newSlot.split(':').map(Number);
      const [y, mo, d] = newDate.split('-').map(Number);
      const iso = new Date(Date.UTC(y, mo - 1, d, h, m, 0)).toISOString();

      await bookingApi.rescheduleBooking(rescheduleBookingTarget.id, {
        newStartTime: iso,
      });
      setRescheduleBookingTarget(null);
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Reschedule failed');
    } finally {
      setRescheduling(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (!cancelBookingTarget) return;
    try {
      setCancelling(true);
      await bookingApi.cancelBooking(cancelBookingTarget.id, cancelReason);
      setCancelBookingTarget(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleExecuteReview = async () => {
    if (!reviewBookingTarget) return;
    try {
      setSubmittingReview(true);
      await bookingApi.createReview(reviewBookingTarget.itemId, {
        rating,
        comment,
      });
      setReviewBookingTarget(null);
      setComment('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Sanctuary & Spa</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/account/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181412] text-stone-300 hover:text-[#D4AF37] border border-[#D4AF37]/20 text-xs font-semibold transition"
                title="Profile & Settings"
              >
                <span className="material-symbols-outlined text-[17px] text-[#D4AF37]">account_circle</span>
                <span className="max-w-[140px] truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || user?.phone || ''}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-red-900/60 text-red-400 hover:text-red-300 hover:border-red-700 hover:bg-red-950/30 text-xs font-semibold transition flex items-center gap-1"
                title="Sign Out / ውጣ"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden sm:inline">Sign Out / ውጣ</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-stone-300 hover:text-[#D4AF37] text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Sign In / ግባ</span>
            </Link>
          )}

          <Link
            to="/book"
            className="px-4 py-2 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="hidden sm:inline">Reserve New Ritual</span>
            <span className="sm:hidden">Reserve</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E5E2DD]">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">Private Patron Portal</span>
            <h1 className="text-3xl font-serif font-bold text-[#1C1C19]">My Sanctuary Bookings</h1>
            <p className="text-xs text-stone-500 mt-1">Manage your upcoming beauty rituals, past visits, and ritual reviews.</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#E5E2DD] pb-2">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'UPCOMING'
                ? 'bg-[#31302D] text-[#D4AF37] shadow'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">event</span>
            Upcoming Appointments
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'PAST'
                ? 'bg-[#31302D] text-[#D4AF37] shadow'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">history</span>
            Past Appointments
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'CANCELLED'
                ? 'bg-[#31302D] text-[#D4AF37] shadow'
                : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
            Archived / Cancelled
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-16 text-center text-sm text-stone-500">Loading your sanctuary appointments...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 px-6 bg-white rounded-xl border border-[#E5E2DD] text-center max-w-lg mx-auto">
            <span className="material-symbols-outlined text-4xl text-stone-400 block mb-2">spa</span>
            <h3 className="font-serif text-lg font-bold text-[#1C1C19]">No {activeTab.toLowerCase()} appointments found</h3>
            <p className="text-xs text-stone-500 mt-1 mb-6">Explore our curated rituals and reserve your next visit.</p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#D4AF37] text-[#0E0B09] font-bold text-xs uppercase tracking-wider hover:bg-[#C59A3F] transition"
            >
              Reserve a Ritual
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const item = b.items[0];
              const dateObj = item ? new Date(item.startTime) : new Date(b.createdAt);
              const dateStr = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm hover:border-[#D4AF37]/50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#F0EDE9]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#775A00] bg-[#FAF7F2] px-2.5 py-1 rounded border border-[#E5E2DD]">
                        #{b.bookingNumber}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : b.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-300'
                          : b.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-stone-100 text-stone-600 border border-stone-300'
                      }`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 font-medium">
                      Deposit: {Number(b.depositPaid).toLocaleString()} ETB Paid
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                    <div>
                      <span className="text-stone-400 block uppercase text-[10px] font-bold">Ritual & Tariff</span>
                      <h4 className="font-serif text-base font-bold text-[#1C1C19]">
                        {item?.serviceTitleSnapshot || 'Service Ritual'}
                      </h4>
                      <p className="text-stone-600 mt-0.5 font-medium">
                        {Number(b.totalAmount).toLocaleString()} ETB • {item?.durationSnapshot || 60} Mins
                      </p>
                    </div>

                    <div>
                      <span className="text-stone-400 block uppercase text-[10px] font-bold">Specialist & Station</span>
                      <p className="font-bold text-[#1C1C19]">
                        {item?.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Assigned Specialist'}
                      </p>
                      <p className="text-stone-500">{item?.employee?.ritualTitle || 'Senior Stylist'}</p>
                    </div>

                    <div>
                      <span className="text-stone-400 block uppercase text-[10px] font-bold">Date & Horizon</span>
                      <p className="font-bold text-[#1C1C19]">{dateStr}</p>
                      <p className="text-[#775A00] font-medium">{timeStr} (EAT) • {b.branch?.name}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#F0EDE9] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-stone-500">
                      Balance Due upon arrival: <strong>{Number(b.balanceDue).toLocaleString()} ETB</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {b.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => setRescheduleBookingTarget(b)}
                            className="px-3 py-1.5 rounded bg-white hover:bg-stone-100 text-stone-800 border border-[#E5E2DD] text-xs font-bold transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">edit_calendar</span>
                            Reschedule
                          </button>
                          <button
                            onClick={() => setCancelBookingTarget(b)}
                            className="px-3 py-1.5 rounded bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">cancel</span>
                            Cancel
                          </button>
                        </>
                      )}

                      {b.status === 'COMPLETED' && item && !item.review && (
                        <button
                          onClick={() => setReviewBookingTarget({ id: b.id, itemId: item.id, name: item.serviceTitleSnapshot })}
                          className="px-3 py-1.5 rounded bg-[#FAF7F2] hover:bg-[#F3E5AB] text-[#775A00] border border-[#D4AF37] text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">star</span>
                          Leave Review
                        </button>
                      )}

                      {item?.review && (
                        <span className="text-xs text-[#D4AF37] flex items-center gap-1 font-semibold">
                          ★ Rated {item.review.rating}/5
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

      {/* Reschedule Modal */}
      {rescheduleBookingTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E2DD]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <h3 className="font-serif text-lg font-bold text-[#1C1C19]">Reschedule Appointment</h3>
              <button onClick={() => setRescheduleBookingTarget(null)} className="text-stone-400 hover:text-stone-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-stone-600 mb-4">
              Select an alternative horizon date and slot for <strong>{rescheduleBookingTarget.bookingNumber}</strong>.
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-[#E5E2DD] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">New Time Slot (HH:mm)</label>
                <input
                  type="text"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  placeholder="e.g. 11:30"
                  className="w-full text-xs p-2.5 rounded border border-[#E5E2DD] outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRescheduleBookingTarget(null)}
                className="px-4 py-2 rounded text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Dismiss
              </button>
              <button
                onClick={handleExecuteReschedule}
                disabled={rescheduling}
                className="px-4 py-2 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase transition"
              >
                {rescheduling ? 'Saving...' : 'Confirm New Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelBookingTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E2DD]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <h3 className="font-serif text-lg font-bold text-red-800">Cancel Appointment</h3>
              <button onClick={() => setCancelBookingTarget(null)} className="text-stone-400 hover:text-stone-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Are you sure you wish to cancel reservation <strong>#{cancelBookingTarget.bookingNumber}</strong>?
            </p>
            <div className="mb-6">
              <label className="text-xs font-bold text-stone-600 block mb-1">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g. Travel schedule change, personal emergency..."
                rows={3}
                className="w-full text-xs p-2.5 rounded border border-[#E5E2DD] outline-none focus:border-red-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelBookingTarget(null)}
                className="px-4 py-2 rounded text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Keep Booking
              </button>
              <button
                onClick={handleExecuteCancel}
                disabled={cancelling}
                className="px-4 py-2 rounded bg-red-800 hover:bg-red-900 text-white text-xs font-bold uppercase transition"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBookingTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E2DD]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E2DD]">
              <h3 className="font-serif text-lg font-bold text-[#1C1C19]">Rate Your Ritual Experience</h3>
              <button onClick={() => setReviewBookingTarget(null)} className="text-stone-400 hover:text-stone-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-stone-600 mb-4">{reviewBookingTarget.name}</p>
            <div className="mb-4">
              <label className="text-xs font-bold text-stone-600 block mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition ${rating >= star ? 'text-[#D4AF37]' : 'text-stone-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs font-bold text-stone-600 block mb-1">Your Review & Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the specialist and salon atmosphere..."
                rows={3}
                className="w-full text-xs p-2.5 rounded border border-[#E5E2DD] outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReviewBookingTarget(null)}
                className="px-4 py-2 rounded text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReview}
                disabled={submittingReview}
                className="px-4 py-2 rounded bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase transition"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;

