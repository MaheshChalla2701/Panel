import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import {
  CalendarRange,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { InterviewerAvailability } from '../../types';

export const AvailabilityManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setTick] = useState(0);

  useEffect(() => {
    return repository.subscribe(() => setTick((t) => t + 1));
  }, []);

  const interviewer = repository.getInterviewerByUserId(currentUser.id) || repository.getInterviewers()[0];
  const initialAvailability = repository.getAvailability(interviewer.id);

  const [schedules, setSchedules] = useState<InterviewerAvailability[]>(initialAvailability);
  const [slotDuration, setSlotDuration] = useState<number>(45);
  const [bufferTime, setBufferTime] = useState<number>(15);
  const [previewDate, setPreviewDate] = useState<string>('2026-11-12');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleToggleDay = (dayIndex: number) => {
    const existing = schedules.find((s) => s.dayOfWeek === dayIndex);
    if (existing) {
      setSchedules(schedules.filter((s) => s.dayOfWeek !== dayIndex));
    } else {
      const newAv: InterviewerAvailability = {
        id: `av-${Date.now()}-${dayIndex}`,
        interviewerId: interviewer.id,
        dayOfWeek: dayIndex,
        startTime: '10:00',
        endTime: '18:00',
        effectiveFrom: '2026-11-01',
        timezone: 'Asia/Kolkata',
        isActive: true,
        slotDurationMinutes: slotDuration,
        bufferMinutes: bufferTime,
      };
      setSchedules([...schedules, newAv]);
    }
  };

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedules(
      schedules.map((s) => {
        if (s.dayOfWeek === dayIndex) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const handleSave = () => {
    // Validate overlapping windows
    for (const s of schedules) {
      if (s.startTime >= s.endTime) {
        toast({
          type: 'error',
          title: 'Validation Error',
          message: `End time must be after start time on ${DAYS[s.dayOfWeek]}.`,
        });
        return;
      }
    }

    const res = repository.updateAvailability({
      interviewerId: interviewer.id,
      schedules,
      actor: currentUser,
    });

    if (res.success) {
      toast({
        type: 'success',
        title: 'Availability Saved',
        message: 'Your weekly working schedule has been updated in the repository.',
      });
    } else {
      toast({
        type: 'error',
        title: 'Save Failed',
        message: res.error || 'Could not update availability.',
      });
    }
  };

  // Preview generated slots for the preview date
  const previewDayIndex = new Date(previewDate).getDay();
  const activeDaySchedule = schedules.find((s) => s.dayOfWeek === previewDayIndex);

  const generatedPreviewSlots: { start: string; end: string }[] = [];
  if (activeDaySchedule) {
    const [startH, startM] = activeDaySchedule.startTime.split(':').map(Number);
    const [endH, endM] = activeDaySchedule.endTime.split(':').map(Number);

    let curMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    while (curMin + slotDuration <= endMin) {
      const sH = String(Math.floor(curMin / 60)).padStart(2, '0');
      const sM = String(curMin % 60).padStart(2, '0');
      const eH = String(Math.floor((curMin + slotDuration) / 60)).padStart(2, '0');
      const eM = String((curMin + slotDuration) % 60).padStart(2, '0');

      generatedPreviewSlots.push({
        start: `${sH}:${sM}`,
        end: `${eH}:${eM}`,
      });

      curMin += slotDuration + bufferTime;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Part 5.3 — Screen 10
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Availability & Working Hours Configuration</h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure recurring weekly working windows, slot intervals, buffer pauses, and preview generated student booking slots.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow"
          >
            <Save className="w-4 h-4" /> Save Schedule Changes
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Weekly Schedule Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Weekly Working Days & Hours</h3>
            <span className="text-xs text-slate-500">Timezone: Asia/Kolkata (IST)</span>
          </div>

          <div className="space-y-3">
            {DAYS.map((dayName, idx) => {
              const active = schedules.find((s) => s.dayOfWeek === idx);

              return (
                <div
                  key={dayName}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`day-${idx}`}
                      checked={!!active}
                      onChange={() => handleToggleDay(idx)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`day-${idx}`} className="text-xs font-bold text-slate-800 cursor-pointer min-w-28">
                      {dayName}
                    </label>
                  </div>

                  {active ? (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">From:</span>
                        <input
                          type="time"
                          value={active.startTime}
                          onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-50"
                        />
                      </div>
                      <span className="text-slate-400">&mdash;</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">To:</span>
                        <input
                          type="time"
                          value={active.endTime}
                          onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Day Off / Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slot Duration & Buffer settings */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Slot Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (Standard GRIT)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Buffer Between Sessions</label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={20}>20 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Slot Generator Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" /> Slot Generation Preview
              </h4>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Test Preview Date</label>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 font-semibold"
              />
            </div>

            <div className="text-xs text-slate-500">
              Day: <strong>{DAYS[previewDayIndex]}</strong> &bull;{' '}
              {activeDaySchedule ? (
                <span className="text-emerald-700 font-bold">Working Day</span>
              ) : (
                <span className="text-rose-600 font-bold">Blocked Day</span>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pt-1">
              {generatedPreviewSlots.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  No slots would be generated for this day.
                </div>
              ) : (
                generatedPreviewSlots.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold text-slate-800">
                      {s.start} &ndash; {s.end}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Slot #{idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Existing Booking Protection
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Modifying working hours will never delete or overwrite existing confirmed bookings. Any booked timeslot remains anchored to prevent student appointment disruption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
