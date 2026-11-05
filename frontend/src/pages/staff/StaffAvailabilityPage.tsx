import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';

export const StaffAvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick exception form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('Personal off-day request');
  const [submitting, setSubmitting] = useState(false);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getStaffAvailability();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching staff availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await bookingApi.toggleStaffException({
        date,
        isWorking,
        startTime: isWorking ? startTime : undefined,
        endTime: isWorking ? endTime : undefined,
        reason,
      });
      alert('Availability exception registered successfully!');
      await loadAvailability();
    } catch (err: any) {
      alert(err.message || 'Failed to save exception');
    } finally {
      setSubmitting(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C19] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0E0B09] text-[#FAF7F2] border-b border-[#2C2724] px-4 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="text-xl font-serif tracking-widest text-[#D4AF37] font-bold">
          EYOB <span className="text-xs uppercase tracking-normal font-sans text-stone-400 block -mt-1">Staff Portal</span>
        </Link>
        <Link
          to="/staff/dashboard"
          className="text-stone-300 hover:text-[#D4AF37] text-xs font-semibold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Daily Agenda
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="mb-6 pb-4 border-b border-[#E5E2DD]">
          <span className="text-[10px] uppercase tracking-widest text-[#775A00] font-bold block mb-1">Schedule & Shifts</span>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1C1C19]">Staff Working Availability</h1>
          <p className="text-xs text-stone-500">View active weekly working shifts, break windows, and register duty exceptions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Weekly Schedule & Exceptions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#1C1C19] mb-4 pb-2 border-b border-[#F0EDE9]">
                Standard Weekly Working Hours
              </h2>

              {loading ? (
                <div className="py-8 text-center text-xs text-stone-500">Loading weekly shifts...</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {dayNames.map((dName, dayIdx) => {
                    const sched = availability?.schedules?.find((s: any) => s.dayOfWeek === dayIdx);
                    const isWorkingDay = sched ? sched.isWorking : true;

                    return (
                      <div
                        key={dName}
                        className="flex items-center justify-between py-2 border-b border-[#F0EDE9] last:border-0"
                      >
                        <span className="font-bold text-stone-700 w-24">{dName}</span>
                        {isWorkingDay ? (
                          <div className="flex items-center gap-4 text-stone-600">
                            <span>{sched?.startTime || '09:00'} – {sched?.endTime || '18:00'}</span>
                            <span className="text-[11px] text-stone-400">
                              Break: {sched?.breakStartTime || '13:00'} - {sched?.breakEndTime || '14:00'}
                            </span>
                            <span className="text-xs text-emerald-700 font-bold">On Duty</span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 font-medium">Off Duty</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Exceptions */}
            <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#1C1C19] mb-4 pb-2 border-b border-[#F0EDE9]">
                Registered Schedule Exceptions
              </h2>
              {availability?.scheduleExceptions?.length === 0 ? (
                <p className="text-xs text-stone-500">No upcoming leave or shift exceptions logged.</p>
              ) : (
                <div className="space-y-3">
                  {availability?.scheduleExceptions?.map((exc: any) => (
                    <div key={exc.id} className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E5E2DD] text-xs">
                      <div className="flex items-center justify-between font-bold text-[#1C1C19] mb-1">
                        <span>{new Date(exc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${exc.isWorking ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {exc.isWorking ? 'Altered Hours' : 'Day Off'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">{exc.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Register Exception Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl p-6 border border-[#E5E2DD] shadow-sm sticky top-24">
              <span className="text-[10px] uppercase tracking-wider text-[#775A00] font-bold block mb-1">Schedule Override</span>
              <h2 className="font-serif text-xl font-bold text-[#1C1C19] mb-4 pb-2 border-b border-[#F0EDE9]">
                Log Duty Exception
              </h2>

              <form onSubmit={handleCreateException} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded border border-[#E5E2DD] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Duty Status</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isWorking}
                        onChange={() => setIsWorking(false)}
                        name="dutyStatus"
                      />
                      <span>Off-Duty / Leave</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={isWorking}
                        onChange={() => setIsWorking(true)}
                        name="dutyStatus"
                      />
                      <span>Altered Shift Hours</span>
                    </label>
                  </div>
                </div>

                {isWorking && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Start Time</label>
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="09:00"
                        className="w-full p-2.5 rounded border border-[#E5E2DD] outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">End Time</label>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="18:00"
                        className="w-full p-2.5 rounded border border-[#E5E2DD] outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Reason / Notes</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="E.g. Certified bridal training, health check, personal leave..."
                    className="w-full p-2.5 rounded border border-[#E5E2DD] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded bg-[#31302D] hover:bg-[#1C1C19] text-[#FAF7F2] font-bold text-xs uppercase tracking-wider transition"
                >
                  {submitting ? 'Registering...' : 'Save Schedule Exception'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffAvailabilityPage;
