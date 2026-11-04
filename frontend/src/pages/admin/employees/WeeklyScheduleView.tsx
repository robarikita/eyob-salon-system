import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee, MOCK_EMPLOYEES } from '../../../api/employeeApi';

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  shortName: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
  station: string;
  occupancyPercent: number;
}

const DEFAULT_DAYS: DaySchedule[] = [
  { dayOfWeek: 1, dayName: 'Monday', shortName: 'Mon', isWorking: false, startTime: '08:30', endTime: '17:30', breakStartTime: '13:00', breakEndTime: '14:00', station: 'Sanctuary Rest Day', occupancyPercent: 0 },
  { dayOfWeek: 2, dayName: 'Tuesday', shortName: 'Tue', isWorking: true, startTime: '08:30', endTime: '18:00', breakStartTime: '13:00', breakEndTime: '14:00', station: 'VIP Chair 04', occupancyPercent: 85 },
  { dayOfWeek: 3, dayName: 'Wednesday', shortName: 'Wed', isWorking: true, startTime: '08:30', endTime: '18:00', breakStartTime: '13:00', breakEndTime: '14:00', station: 'VIP Chair 04', occupancyPercent: 92 },
  { dayOfWeek: 4, dayName: 'Thursday', shortName: 'Thu', isWorking: true, startTime: '08:30', endTime: '18:00', breakStartTime: '13:00', breakEndTime: '14:00', station: 'VIP Chair 04', occupancyPercent: 78 },
  { dayOfWeek: 5, dayName: 'Friday', shortName: 'Fri', isWorking: true, startTime: '08:30', endTime: '19:30', breakStartTime: '13:00', breakEndTime: '14:00', station: 'VIP Chair 04', occupancyPercent: 96 },
  { dayOfWeek: 6, dayName: 'Saturday', shortName: 'Sat', isWorking: true, startTime: '08:00', endTime: '20:00', breakStartTime: '13:00', breakEndTime: '14:00', station: 'VIP Chair 04', occupancyPercent: 100 },
  { dayOfWeek: 0, dayName: 'Sunday', shortName: 'Sun', isWorking: true, startTime: '09:00', endTime: '17:00', breakStartTime: '13:00', breakEndTime: '14:00', station: 'VIP Chair 04', occupancyPercent: 65 },
];

export const WeeklyScheduleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentBranch, setCurrentBranch] = useState('bole-bulbula');
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(id || 'emp-101');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [scheduleDays, setScheduleDays] = useState<DaySchedule[]>(DEFAULT_DAYS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionData, setExceptionData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    reason: 'Personal Leave / Medical',
    isOffDay: true,
  });

  useEffect(() => {
    employeeApi.getAllEmployees({ branchId: currentBranch }).then((list) => {
      setEmployees(list);
      if (id) {
        setSelectedEmpId(id);
      } else if (list.length > 0) {
        setSelectedEmpId(list[0].id);
      }
    });
  }, [currentBranch, id]);

  useEffect(() => {
    if (selectedEmpId) {
      employeeApi.getEmployeeById(selectedEmpId).then((emp) => {
        setEmployee(emp);
        if (emp.schedules && emp.schedules.length > 0) {
          const merged = DEFAULT_DAYS.map((defaultDay) => {
            const found = emp.schedules?.find((s) => s.dayOfWeek === defaultDay.dayOfWeek);
            if (found) {
              return {
                ...defaultDay,
                isWorking: found.isWorking,
                startTime: found.startTime || '08:30',
                endTime: found.endTime || '17:30',
                breakStartTime: found.breakStartTime || '13:00',
                breakEndTime: found.breakEndTime || '14:00',
                station: emp.workstation || 'Styling Station',
              };
            }
            return defaultDay;
          });
          setScheduleDays(merged);
        }
      });
    }
  }, [selectedEmpId]);

  const handleDayToggle = (dayOfWeek: number) => {
    setScheduleDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isWorking: !d.isWorking } : d))
    );
    setHasChanges(true);
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime' | 'station',
    value: string
  ) => {
    setScheduleDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
    setHasChanges(true);
  };

  const copyWeekdayHoursToAll = () => {
    const tuesday = scheduleDays.find((d) => d.dayOfWeek === 2) || scheduleDays[1];
    setScheduleDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === 1) return d; // Keep sanctuary day off
        return {
          ...d,
          isWorking: true,
          startTime: tuesday.startTime,
          endTime: tuesday.endTime,
          breakStartTime: tuesday.breakStartTime,
          breakEndTime: tuesday.breakEndTime,
        };
      })
    );
    setHasChanges(true);
  };

  const handleSaveSchedule = async () => {
    if (!employee) return;
    setIsSaving(true);
    try {
      const payload = scheduleDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        breakStartTime: d.breakStartTime,
        breakEndTime: d.breakEndTime,
        isWorking: d.isWorking,
      }));

      await employeeApi.setEmployeeSchedule(employee.id, payload);
      setIsSaving(false);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      setIsSaving(false);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    await employeeApi.createException(employee.id, exceptionData);
    setShowExceptionModal(false);
    alert('Temporary schedule exception registered successfully!');
  };

  // Calculations
  const totalWorkingDays = scheduleDays.filter((d) => d.isWorking).length;
  const calculateTotalWeeklyHours = () => {
    let totalMinutes = 0;
    scheduleDays.forEach((d) => {
      if (!d.isWorking) return;
      const [sH, sM] = d.startTime.split(':').map(Number);
      const [eH, eM] = d.endTime.split(':').map(Number);
      let dayMin = eH * 60 + eM - (sH * 60 + sM);
      if (d.breakStartTime && d.breakEndTime) {
        const [bSH, bSM] = d.breakStartTime.split(':').map(Number);
        const [bEH, bEM] = d.breakEndTime.split(':').map(Number);
        const breakMin = bEH * 60 + bEM - (bSH * 60 + bSM);
        if (breakMin > 0) dayMin -= breakMin;
      }
      if (dayMin > 0) totalMinutes += dayMin;
    });
    return (totalMinutes / 60).toFixed(1);
  };

  const avgOccupancy = Math.round(
    scheduleDays.reduce((acc, d) => acc + (d.isWorking ? d.occupancyPercent : 0), 0) /
      (totalWorkingDays || 1)
  );

  return (
    <AdminLayout activePath="/admin/employees/schedule" onBranchChange={(b) => setCurrentBranch(b)}>
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto pb-32">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#a89280]">
            <Link to="/admin/employees" className="hover:text-[#e5c158] transition-colors">
              Specialists Roster
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            {employee && (
              <Link to={`/admin/employees/${employee.id}`} className="hover:text-[#e5c158] transition-colors">
                {employee.firstName} {employee.lastName}
              </Link>
            )}
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#e5c158] font-bold">Weekly Schedule Matrix</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExceptionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#241f1a] border border-[#483f35] text-xs font-semibold text-[#f5ebd9] hover:bg-[#2d2620] hover:border-[#e5c158]/50 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#e5c158]">event_busy</span>
              Schedule Exception / Time-Off
            </button>
            <button
              onClick={copyWeekdayHoursToAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#241f1a] border border-[#483f35] text-xs font-semibold text-[#f5ebd9] hover:bg-[#2d2620] hover:border-[#e5c158]/50 transition-all"
              title="Apply Tuesday hours to all working days"
            >
              <span className="material-symbols-outlined text-[16px] text-[#e5c158]">content_copy</span>
              Auto-Fill Weekdays
            </button>
          </div>
        </div>

        {/* Specialist Selector & Overview Card */}
        <div className="bg-[#1a1613] border border-[#2d2620] rounded-2xl p-6 lg:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#e5c158]/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-[#e5c158]/40 p-0.5 bg-gradient-to-br from-[#e5c158]/20 to-transparent flex items-center justify-center text-xl font-serif text-[#e5c158] font-bold shadow-lg">
                  {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : 'SA'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#1a1613] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[12px] text-black font-bold">check</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-serif text-[#fcf9f2] font-semibold tracking-wide">
                    {employee ? `${employee.firstName} ${employee.lastName}` : 'Sara Ahmed'}
                  </h1>
                  {employee?.amharicName && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2d2620] border border-[#483f35] text-xs text-[#d3bb9b]">
                      {employee.amharicName}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#231a0e] border border-[#e5c158]/30 text-[#e5c158] text-xs font-semibold tracking-wide uppercase">
                    {employee?.ritualTitle || 'Senior Hair Stylist'}
                  </span>
                </div>
                <p className="text-sm text-[#a89280] mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#e5c158]">storefront</span>
                    {employee?.branch?.name || 'Bole Bulbula Sanctuary'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#e5c158]">chair</span>
                    {employee?.workstation || 'Chair 04 — VIP Styling Suite A'}
                  </span>
                </p>
              </div>
            </div>

            {/* Switch Specialist Dropdown */}
            <div className="flex items-center gap-3">
              <label htmlFor="specialist-select" className="text-xs uppercase tracking-wider text-[#a89280] font-semibold">
                Switch Specialist:
              </label>
              <select
                id="specialist-select"
                aria-label="Switch Specialist"
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  navigate(`/admin/employees/${e.target.value}/schedule`);
                }}
                className="bg-[#241f1a] border border-[#483f35] text-[#fcf9f2] text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#e5c158] transition-colors cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-[#1a1613]">
                    {emp.firstName} {emp.lastName} — {emp.ritualTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operational Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#2d2620]">
            <div className="bg-[#120f0d] p-4 rounded-xl border border-[#2d2620]/60">
              <span className="text-[11px] uppercase tracking-wider text-[#a89280]">Committed Hours</span>
              <div className="text-2xl font-serif font-bold text-[#fcf9f2] mt-1">
                {calculateTotalWeeklyHours()} <span className="text-xs font-sans font-normal text-[#a89280]">hrs/wk</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-0.5 inline-block">Adheres to 40h standard</span>
            </div>

            <div className="bg-[#120f0d] p-4 rounded-xl border border-[#2d2620]/60">
              <span className="text-[11px] uppercase tracking-wider text-[#a89280]">Duty Days</span>
              <div className="text-2xl font-serif font-bold text-[#fcf9f2] mt-1">
                {totalWorkingDays} <span className="text-xs font-sans font-normal text-[#a89280]">of 7 Days</span>
              </div>
              <span className="text-[11px] text-[#e5c158] mt-0.5 inline-block">1 Sanctuary Rest Day</span>
            </div>

            <div className="bg-[#120f0d] p-4 rounded-xl border border-[#2d2620]/60">
              <span className="text-[11px] uppercase tracking-wider text-[#a89280]">Avg Station Occupancy</span>
              <div className="text-2xl font-serif font-bold text-[#fcf9f2] mt-1">{avgOccupancy}%</div>
              <div className="w-full bg-[#2d2620] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#e5c158] to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${avgOccupancy}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[#120f0d] p-4 rounded-xl border border-[#2d2620]/60">
              <span className="text-[11px] uppercase tracking-wider text-[#a89280]">Branch Sanctuary Window</span>
              <div className="text-lg font-serif font-bold text-[#fcf9f2] mt-1">08:00 — 20:30</div>
              <span className="text-[11px] text-[#a89280] mt-0.5 inline-block">Bole Bulbula Operating Hours</span>
            </div>
          </div>
        </div>

        {/* 7-Day Schedule Matrix Column Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-10">
          {scheduleDays.map((day) => {
            return (
              <div
                key={day.dayOfWeek}
                className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  day.isWorking
                    ? 'bg-[#1a1613] border-[#362e26] hover:border-[#e5c158]/50 shadow-lg'
                    : 'bg-[#151210]/60 border-[#2d2620]/40 opacity-75'
                }`}
              >
                {/* Day Header */}
                <div className="p-4 border-b border-[#2d2620]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-serif font-semibold text-[#fcf9f2]">{day.dayName}</span>
                    <button
                      onClick={() => handleDayToggle(day.dayOfWeek)}
                      type="button"
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        day.isWorking ? 'bg-[#e5c158]' : 'bg-[#3b322a]'
                      }`}
                      title={day.isWorking ? 'Mark as Rest Day' : 'Mark as Working Day'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#120f0d] shadow ring-0 transition duration-200 ease-in-out ${
                          day.isWorking ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                        day.isWorking
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : 'bg-[#261f18] text-[#a89280] border border-[#3d3227]'
                      }`}
                    >
                      {day.isWorking ? 'On Duty' : 'Rest Day'}
                    </span>
                    {day.isWorking && (
                      <span className="text-[11px] text-[#a89280] ml-auto font-mono">
                        {day.occupancyPercent}% load
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Body Content */}
                <div className="p-4 space-y-4 flex-1">
                  {day.isWorking ? (
                    <>
                      {/* Operational Shift Window */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#a89280] mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#e5c158]">schedule</span>
                          Shift Window
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-[#786b5e]">Start</span>
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                              className="w-full bg-[#120f0d] border border-[#3b322a] rounded px-2 py-1 text-xs text-[#fcf9f2] font-mono focus:outline-none focus:border-[#e5c158]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#786b5e]">End</span>
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                              className="w-full bg-[#120f0d] border border-[#3b322a] rounded px-2 py-1 text-xs text-[#fcf9f2] font-mono focus:outline-none focus:border-[#e5c158]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Break Slot */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#a89280] mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#e5c158]">restaurant</span>
                          Lunch Break Slot
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-[#786b5e]">Start</span>
                            <input
                              type="time"
                              value={day.breakStartTime}
                              onChange={(e) => handleTimeChange(day.dayOfWeek, 'breakStartTime', e.target.value)}
                              className="w-full bg-[#120f0d] border border-[#3b322a] rounded px-2 py-1 text-xs text-[#fcf9f2] font-mono focus:outline-none focus:border-[#e5c158]"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#786b5e]">End</span>
                            <input
                              type="time"
                              value={day.breakEndTime}
                              onChange={(e) => handleTimeChange(day.dayOfWeek, 'breakEndTime', e.target.value)}
                              className="w-full bg-[#120f0d] border border-[#3b322a] rounded px-2 py-1 text-xs text-[#fcf9f2] font-mono focus:outline-none focus:border-[#e5c158]"
                            />
                          </div>
                        </div>
                        <div className="mt-1 text-[10px] text-[#a89280] flex items-center justify-between">
                          <span>Break Duration:</span>
                          <span className="text-[#e5c158] font-mono">60 min</span>
                        </div>
                      </div>

                      {/* Station Allocation */}
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#a89280] mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#e5c158]">chair</span>
                          Station Allocation
                        </label>
                        <input
                          type="text"
                          value={day.station}
                          onChange={(e) => handleTimeChange(day.dayOfWeek, 'station', e.target.value)}
                          className="w-full bg-[#120f0d] border border-[#3b322a] rounded px-2.5 py-1.5 text-xs text-[#fcf9f2] focus:outline-none focus:border-[#e5c158]"
                          placeholder="e.g. VIP Chair 04"
                        />
                      </div>

                      {/* Occupancy Meter */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-[#a89280]">Capacity booked</span>
                          <span className="text-[#e5c158] font-bold">{day.occupancyPercent}%</span>
                        </div>
                        <div className="w-full bg-[#120f0d] h-2 rounded-full overflow-hidden border border-[#2d2620]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              day.occupancyPercent >= 90
                                ? 'bg-gradient-to-r from-[#e5c158] to-red-400'
                                : 'bg-gradient-to-r from-[#e5c158] to-emerald-400'
                            }`}
                            style={{ width: `${day.occupancyPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                      <span className="material-symbols-outlined text-3xl text-[#483f35] mb-2">hotel</span>
                      <p className="text-xs text-[#a89280] font-medium">Sanctuary Rest Day</p>
                      <p className="text-[10px] text-[#6b5c4d] mt-1">No appointments can be scheduled</p>
                      <button
                        onClick={() => handleDayToggle(day.dayOfWeek)}
                        className="mt-4 text-[11px] text-[#e5c158] hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">add_circle</span>
                        Open Schedule
                      </button>
                    </div>
                  )}
                </div>

                {/* Day Card Footer */}
                <div className="p-3 bg-[#13100e] border-t border-[#2d2620] rounded-b-2xl flex items-center justify-between text-[11px]">
                  <span className="text-[#786b5e]">Branch Synchronized</span>
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">cloud_done</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Bottom Action Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#120f0d]/95 backdrop-blur-md border-t border-[#362e26] px-6 py-4 shadow-2xl">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-[#a89280]">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${hasChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="font-medium text-[#fcf9f2]">
                  {hasChanges ? 'Unpublished Schedule Modifications' : 'All Changes Published to Sanctuary Dispatch'}
                </span>
              </div>
              <span className="hidden md:inline text-[#483f35]">|</span>
              <span className="hidden md:inline">
                Weekly Total: <strong className="text-[#e5c158]">{calculateTotalWeeklyHours()} hrs</strong> across {totalWorkingDays} duty days
              </span>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg animate-fade-in">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Schedule Successfully Published!
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setScheduleDays(DEFAULT_DAYS);
                  setHasChanges(false);
                }}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 rounded-lg bg-[#241f1a] border border-[#483f35] text-xs font-semibold text-[#f5ebd9] hover:bg-[#2d2620] transition-colors disabled:opacity-40"
              >
                Discard Changes
              </button>

              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#e5c158] via-[#d4af37] to-[#8e6b23] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-[#e5c158]/30 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Syncing Schedule...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    Publish & Sync Weekly Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Exception Modal */}
        {showExceptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1613] border border-[#362e26] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#2d2620]">
                <h3 className="text-lg font-serif font-semibold text-[#fcf9f2] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e5c158]">event_busy</span>
                  Register Schedule Exception
                </h3>
                <button
                  onClick={() => setShowExceptionModal(false)}
                  className="text-[#a89280] hover:text-[#fcf9f2] transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleAddException} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a89280] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={exceptionData.startDate}
                    onChange={(e) => setExceptionData({ ...exceptionData, startDate: e.target.value })}
                    className="w-full bg-[#120f0d] border border-[#3b322a] rounded-lg px-3 py-2 text-sm text-[#fcf9f2] focus:outline-none focus:border-[#e5c158]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a89280] mb-1">
                    End Date (Optional for single day)
                  </label>
                  <input
                    type="date"
                    value={exceptionData.endDate}
                    onChange={(e) => setExceptionData({ ...exceptionData, endDate: e.target.value })}
                    className="w-full bg-[#120f0d] border border-[#3b322a] rounded-lg px-3 py-2 text-sm text-[#fcf9f2] focus:outline-none focus:border-[#e5c158]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a89280] mb-1">
                    Reason / Annotation
                  </label>
                  <input
                    type="text"
                    required
                    value={exceptionData.reason}
                    onChange={(e) => setExceptionData({ ...exceptionData, reason: e.target.value })}
                    className="w-full bg-[#120f0d] border border-[#3b322a] rounded-lg px-3 py-2 text-sm text-[#fcf9f2] focus:outline-none focus:border-[#e5c158]"
                    placeholder="e.g. Masterclass Training / Medical Leave"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isOffDay"
                    checked={exceptionData.isOffDay}
                    onChange={(e) => setExceptionData({ ...exceptionData, isOffDay: e.target.checked })}
                    className="w-4 h-4 rounded text-[#e5c158] bg-[#120f0d] border-[#3b322a] focus:ring-0"
                  />
                  <label htmlFor="isOffDay" className="text-xs text-[#d3bb9b]">
                    Mark specialist as completely unavailable (Off-Duty)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2d2620]">
                  <button
                    type="button"
                    onClick={() => setShowExceptionModal(false)}
                    className="px-4 py-2 rounded-lg bg-[#241f1a] text-xs font-semibold text-[#a89280] hover:text-[#fcf9f2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#e5c158] to-[#8e6b23] text-black text-xs font-bold uppercase tracking-wider shadow hover:brightness-110 transition-all"
                  >
                    Confirm Exception
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

