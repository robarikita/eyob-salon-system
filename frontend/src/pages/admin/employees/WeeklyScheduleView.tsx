import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee } from '../../../api/employeeApi';
import { useLanguage } from '../../../context/LanguageContext';

interface DayShift {
  dayOfWeek: number;
  dayName: string;
  dayNameAm: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

const DAYS_TEMPLATE: Array<{ dayOfWeek: number; dayName: string; dayNameAm: string }> = [
  { dayOfWeek: 0, dayName: 'Sunday', dayNameAm: 'እሑድ' },
  { dayOfWeek: 1, dayName: 'Monday', dayNameAm: 'ሰኞ' },
  { dayOfWeek: 2, dayName: 'Tuesday', dayNameAm: 'ማክሰኞ' },
  { dayOfWeek: 3, dayName: 'Wednesday', dayNameAm: 'ረቡዕ' },
  { dayOfWeek: 4, dayName: 'Thursday', dayNameAm: 'ሐሙስ' },
  { dayOfWeek: 5, dayName: 'Friday', dayNameAm: 'ዓርብ' },
  { dayOfWeek: 6, dayName: 'Saturday', dayNameAm: 'ቅዳሜ' },
];

export const WeeklyScheduleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === 'am';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<DayShift[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Exception modal state
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionDate, setExceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [exceptionReason, setExceptionReason] = useState('');
  const [isOffDay, setIsOffDay] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [emp, schedData] = await Promise.all([
        employeeApi.getEmployeeById(id),
        employeeApi.getSchedule(id),
      ]);

      setEmployee(emp);
      setExceptions(schedData.exceptions || []);

      const existingSchedules = schedData.schedules || [];
      const initialized = DAYS_TEMPLATE.map((dt) => {
        const found = existingSchedules.find((s: any) => s.dayOfWeek === dt.dayOfWeek);
        return {
          dayOfWeek: dt.dayOfWeek,
          dayName: dt.dayName,
          dayNameAm: dt.dayNameAm,
          isWorking: found ? found.isWorking : dt.dayOfWeek !== 1, // Default Monday rest
          startTime: found?.startTime || '08:30',
          endTime: found?.endTime || '17:30',
          breakStartTime: found?.breakStartTime || '13:00',
          breakEndTime: found?.breakEndTime || '14:00',
        };
      });
      setShifts(initialized);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const updateShift = (dayOfWeek: number, field: keyof DayShift, value: any) => {
    setShifts((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSchedule = async () => {
    if (!id) return;
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg(false);
    try {
      await employeeApi.setEmployeeSchedule(
        id,
        shifts.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStartTime: s.breakStartTime || undefined,
          breakEndTime: s.breakEndTime || undefined,
          isWorking: s.isWorking,
        }))
      );
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Schedule save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !exceptionDate) return;
    try {
      await employeeApi.createException(id, {
        startDate: exceptionDate,
        date: exceptionDate,
        reason: exceptionReason.trim() || undefined,
        isOffDay,
        isOff: isOffDay,
      });
      setShowExceptionModal(false);
      setExceptionReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add exception');
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    if (!id) return;
    if (!confirm(isAm ? 'ልዩ ሁኔታውን ይሰርዙ?' : 'Delete exception?')) return;
    try {
      await employeeApi.deleteException(id, exceptionId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete exception');
    }
  };

  return (
    <AdminLayout selectedBranch="all">
      <div className="max-w-4xl mx-auto w-full text-[#FAF7F2] space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2724]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                {isAm ? 'የፈረቃ መርሃግብር' : 'Working Shifts'}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#FAF7F2] mt-1">
              {employee ? `${employee.firstName} ${employee.lastName}` : isAm ? 'ባለሙያ' : 'Specialist'}
            </h1>
            <span className="text-xs text-stone-400">
              {employee?.branch?.name || 'Sanctuary'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="px-3 py-1.5 rounded-lg border border-[#2C2724] text-xs text-stone-300 hover:text-[#D4AF37] transition"
            >
              {isAm ? 'ተመለስ' : 'Back'}
            </button>

            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{isSaving ? (isAm ? 'በመመዝገብ ላይ...' : 'Saving...') : isAm ? 'መርሃግብር መዝግብ' : 'Save Shifts'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{isAm ? 'መርሃግብር ተመዝግቧል' : 'Shifts saved'}</span>
          </div>
        )}

        {/* 7-Day Weekly Grid */}
        <div className="bg-[#181412] rounded-xl border border-[#2C2724] overflow-hidden">
          <div className="p-4 border-b border-[#2C2724] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
              {isAm ? 'ሳምንታዊ ፈረቃ' : 'Weekly Shifts'}
            </h2>
            <span className="text-xs text-stone-400">
              {shifts.filter((s) => s.isWorking).length} {isAm ? 'የስራ ቀናት' : 'Working Days'}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-stone-400">
              {isAm ? 'በመጫን ላይ...' : 'Loading shifts...'}
            </div>
          ) : (
            <div className="divide-y divide-[#2C2724]">
              {shifts.map((shift) => (
                <div
                  key={shift.dayOfWeek}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    shift.isWorking ? 'bg-transparent' : 'bg-[#0E0B09]/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      checked={shift.isWorking}
                      onChange={(e) => updateShift(shift.dayOfWeek, 'isWorking', e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#FAF7F2]">
                      {isAm ? shift.dayNameAm : shift.dayName}
                    </span>
                  </div>

                  {shift.isWorking ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">{isAm ? 'ጀምር' : 'Start'}:</span>
                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => updateShift(shift.dayOfWeek, 'startTime', e.target.value)}
                          className="bg-[#0E0B09] border border-[#2C2724] rounded px-2 py-1 text-xs text-[#FAF7F2] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">{isAm ? 'ጨርስ' : 'End'}:</span>
                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => updateShift(shift.dayOfWeek, 'endTime', e.target.value)}
                          className="bg-[#0E0B09] border border-[#2C2724] rounded px-2 py-1 text-xs text-[#FAF7F2] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">{isAm ? 'እረፍት' : 'Break'}:</span>
                        <input
                          type="time"
                          value={shift.breakStartTime}
                          onChange={(e) => updateShift(shift.dayOfWeek, 'breakStartTime', e.target.value)}
                          className="bg-[#0E0B09] border border-[#2C2724] rounded px-2 py-1 text-xs text-[#FAF7F2] outline-none"
                        />
                        <span className="text-stone-500">-</span>
                        <input
                          type="time"
                          value={shift.breakEndTime}
                          onChange={(e) => updateShift(shift.dayOfWeek, 'breakEndTime', e.target.value)}
                          className="bg-[#0E0B09] border border-[#2C2724] rounded px-2 py-1 text-xs text-[#FAF7F2] outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-500 italic">
                      {isAm ? 'ዕረፍት ቀን' : 'Rest Day'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Exceptions Section */}
        <div className="bg-[#181412] rounded-xl border border-[#2C2724] overflow-hidden">
          <div className="p-4 border-b border-[#2C2724] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
                {isAm ? 'የዕረፍት / ልዩ ቀናት' : 'Exceptions & Leave'}
              </h2>
              <span className="text-xs text-stone-400">
                {exceptions.length} {isAm ? 'ልዩ ቀናት' : 'Exceptions'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowExceptionModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold hover:bg-[#D4AF37]/30 transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>{isAm ? 'ልዩ ቀን ጨምር' : 'Add Exception'}</span>
            </button>
          </div>

          {exceptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              {isAm ? 'ምንም ልዩ ቀን አልተመዘገበም' : 'No schedule exceptions recorded'}
            </div>
          ) : (
            <div className="divide-y divide-[#2C2724]">
              {exceptions.map((exc) => {
                const dateDisplay = new Date(exc.date).toISOString().split('T')[0];
                return (
                  <div
                    key={exc.id}
                    className="p-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#FAF7F2] font-mono">
                        {dateDisplay}
                      </div>
                      <div className="text-stone-400 text-[11px]">
                        {exc.reason || (isAm ? 'የግል ዕረፍት' : 'Personal Leave')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          exc.isOff
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {exc.isOff
                          ? isAm
                            ? 'ዕረፍት'
                            : 'Off Day'
                          : isAm
                          ? 'ልዩ ፈረቃ'
                          : 'Custom Shift'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteException(exc.id)}
                        className="p-1 rounded text-stone-500 hover:text-red-400 transition"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Exception Modal */}
        {showExceptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#181412] border border-[#2C2724] rounded-xl p-6 max-w-sm w-full space-y-4 text-[#FAF7F2]">
              <div className="flex items-center justify-between pb-2 border-b border-[#2C2724]">
                <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                  {isAm ? 'ልዩ ቀን መዝግብ' : 'Add Exception'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="text-stone-400 hover:text-[#FAF7F2]"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateException} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    {isAm ? 'ቀን *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    {isAm ? 'ምክንያት' : 'Reason'}
                  </label>
                  <input
                    type="text"
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    placeholder="e.g. Medical / Annual Leave"
                    className="w-full bg-[#0E0B09] border border-[#2C2724] rounded px-3 py-2 text-xs text-[#FAF7F2] outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isOffDayCheckbox"
                    checked={isOffDay}
                    onChange={(e) => setIsOffDay(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                  />
                  <label htmlFor="isOffDayCheckbox" className="text-xs text-stone-300 cursor-pointer">
                    {isAm ? 'ሙሉ ቀን ዕረፍት' : 'Full Day Off'}
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExceptionModal(false)}
                    className="px-3 py-1.5 rounded border border-[#2C2724] text-xs text-stone-300 hover:text-[#FAF7F2]"
                  >
                    {isAm ? 'ይቅር' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#D4AF37] hover:bg-[#b89528] text-[#0E0B09] text-xs font-bold uppercase tracking-wider"
                  >
                    {isAm ? 'መዝግብ' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default WeeklyScheduleView;
