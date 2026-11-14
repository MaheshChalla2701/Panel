import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { repository } from '../../services/api/repository';
import { useToast } from '../../app/providers/ToastContext';
import {
  Save,
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
        message: 'Your working schedule has been updated.',
      });
    } else {
      toast({
        type: 'error',
        title: 'Save Failed',
        message: res.error || 'Could not update availability.',
      });
    }
  };

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
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Availability & Working Hours
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Set recurring weekly working windows, slot intervals, and inter-session buffers.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Weekly Schedule Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Weekly Schedule</h3>
            <span className="text-xs text-zinc-400">Asia/Kolkata (IST)</span>
          </div>

          <div className="space-y-2">
            {DAYS.map((dayName, idx) => {
              const active = schedules.find((s) => s.dayOfWeek === idx);

              return (
                <div
                  key={dayName}
                  className={`p-3 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    active ? 'bg-white border-zinc-200/80 shadow-xs' : 'bg-zinc-50/50 border-zinc-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`day-${idx}`}
                      checked={!!active}
                      onChange={() => handleToggleDay(idx)}
                      className="w-3.5 h-3.5 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                    />
                    <label htmlFor={`day-${idx}`} className="text-xs font-medium text-zinc-800 cursor-pointer min-w-24">
                      {dayName}
                    </label>
                  </div>

                  {active ? (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-400 text-[11px]">Start:</span>
                        <input
                          type="time"
                          value={active.startTime}
                          onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                          className="border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono bg-white"
                        />
                      </div>
                      <span className="text-zinc-300">–</span>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-400 text-[11px]">End:</span>
                        <input
                          type="time"
                          value={active.endTime}
                          onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                          className="border border-zinc-200 rounded px-2 py-0.5 text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slot Duration & Buffer settings */}
          <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Slot Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full text-xs font-medium border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-800"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes (Standard Panel)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">Session Buffer</label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className="w-full text-xs font-medium border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-800"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Slot Generator Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-zinc-500" /> Slot Preview
            </h4>

            <div>
              <label className="block text-[10px] uppercase font-medium text-zinc-400 mb-1">Test Date</label>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
              />
            </div>

            <div className="text-xs text-zinc-500">
              {DAYS[previewDayIndex]} • {activeDaySchedule ? (
                <span className="text-emerald-700 font-medium">Working Day</span>
              ) : (
                <span className="text-zinc-400">Blocked</span>
              )}
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pt-1">
              {generatedPreviewSlots.length === 0 ? (
                <div className="p-4 bg-zinc-50 rounded-lg text-center text-xs text-zinc-400">
                  No slots generated for this date.
                </div>
              ) : (
                generatedPreviewSlots.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded border border-zinc-200/60 bg-zinc-50/50 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-zinc-800">
                      {s.start} – {s.end}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-sans">
                      Slot #{idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 text-xs text-zinc-500 space-y-1 shadow-xs">
            <div className="font-medium text-zinc-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              Slot Protection
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Updating hours will not affect already confirmed bookings. Active slots remain intact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
