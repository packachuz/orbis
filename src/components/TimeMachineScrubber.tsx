import { ChevronLeft, ChevronRight, Clock, RotateCcw, Sparkles } from 'lucide-react';
import { ordinal } from '@/lib/astroEngine';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032] as const;

interface TimeMachineScrubberProps {
  targetYear: number;
  targetMonth: number;
  onDateChange: (year: number, month: number) => void;
  onResetDate: () => void;
  age: number;
  annualTimeLord: string;
  annualHouse: number;
  monthlyTimeLord: string;
  monthlyHouse: number;
  progressedMoonSignName: string;
  progressedMoonDeg: number;
  progressedMoonPhaseName: string;
  convergenceCount: number;
}

export default function TimeMachineScrubber({
  targetYear,
  targetMonth,
  onDateChange,
  onResetDate,
  age,
  annualTimeLord,
  annualHouse,
  monthlyTimeLord,
  monthlyHouse,
  progressedMoonSignName,
  progressedMoonDeg,
  progressedMoonPhaseName,
  convergenceCount,
}: TimeMachineScrubberProps) {
  const isDefaultDate = targetYear === 2026 && targetMonth === 9;

  const canGoPrev = !(targetYear === 2024 && targetMonth === 0);
  const canGoNext = !(targetYear === 2032 && targetMonth === 11);

  const handlePrev = () => {
    if (!canGoPrev) return;
    if (targetMonth === 0) {
      onDateChange(targetYear - 1, 11);
    } else {
      onDateChange(targetYear, targetMonth - 1);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (targetMonth === 11) {
      onDateChange(targetYear + 1, 0);
    } else {
      onDateChange(targetYear, targetMonth + 1);
    }
  };

  return (
    <div className="glass-strong rounded-3xl border border-gold/40 bg-gradient-to-br from-[#0F1628]/95 via-[#0B0F19]/95 to-[#161208]/95 p-6 sm:p-8 shadow-[0_0_35px_rgba(229,193,88,0.18)] backdrop-blur-2xl">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/40 bg-gold/15 shadow-[0_0_15px_rgba(229,193,88,0.2)]">
            <Clock size={19} className="text-gold animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                Interactive Time-Machine Scrubber
              </span>
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.2 font-mono text-[9px] text-gold/90">
                2024–2032 Horizon
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-silver">
              {MONTH_NAMES[targetMonth]} {targetYear} Chapter
            </h3>
          </div>
        </div>

        {/* Reset Reference Date Button */}
        <button
          type="button"
          onClick={onResetDate}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-semibold transition-all duration-300 ${
            !isDefaultDate
              ? 'border border-gold/60 bg-gold/20 text-gold shadow-[0_0_20px_rgba(229,193,88,0.25)] hover:bg-gold/30'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-silver'
          }`}
          title="Reset to default reference date: October 2026"
        >
          <RotateCcw size={14} className={!isDefaultDate ? 'animate-spin-once text-gold' : ''} />
          <span>Reset Oct 2026</span>
        </button>
      </div>

      {/* Control Surface: Years & Months */}
      <div className="mt-6 space-y-4">
        {/* Year Selector Buttons */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-400">
              Target Year
            </span>
            <span className="font-mono text-[10.5px] text-gold">
              Selected: {targetYear}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
            {YEARS.map((yr) => {
              const isActive = yr === targetYear;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onDateChange(yr, targetMonth)}
                  className={`rounded-xl py-2 font-mono text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border border-gold bg-gold/20 text-gold shadow-[0_0_15px_rgba(229,193,88,0.3)] ring-1 ring-gold/50'
                      : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:bg-white/10 hover:text-silver'
                  }`}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month Stepper & Pills */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-400">
              Target Month
            </span>
            <span className="font-mono text-[10.5px] text-gold">
              Selected: {MONTH_NAMES[targetMonth]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev Month Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                canGoPrev
                  ? 'border-white/15 bg-white/5 text-slate-200 hover:border-gold/50 hover:bg-gold/15 hover:text-gold active:scale-95'
                  : 'border-white/5 bg-transparent text-slate-600 cursor-not-allowed'
              }`}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            {/* 12 Month Pills */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 flex-1">
              {MONTH_SHORT.map((mShort, idx) => {
                const isActive = idx === targetMonth;
                return (
                  <button
                    key={mShort}
                    type="button"
                    onClick={() => onDateChange(targetYear, idx)}
                    className={`rounded-xl py-2 font-mono text-xs transition-all duration-200 ${
                      isActive
                        ? 'border border-gold bg-gold text-obsidian font-bold shadow-[0_0_18px_rgba(229,193,88,0.4)]'
                        : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:bg-white/10 hover:text-silver'
                    }`}
                  >
                    {mShort}
                  </button>
                );
              })}
            </div>

            {/* Next Month Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                canGoNext
                  ? 'border-white/15 bg-white/5 text-slate-200 hover:border-gold/50 hover:bg-gold/15 hover:text-gold active:scale-95'
                  : 'border-white/5 bg-transparent text-slate-600 cursor-not-allowed'
              }`}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Chapter Telemetry Strip */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-obsidian/60 p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles size={13} className="text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            Live Synchronized Chapter Telemetry
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-[11px]">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <span className="text-slate-400 block text-[9.5px] uppercase">Target Date</span>
            <span className="text-silver font-bold">{MONTH_SHORT[targetMonth].toUpperCase()} {targetYear}</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <span className="text-slate-400 block text-[9.5px] uppercase">Native Age</span>
            <span className="text-gold font-bold">{age} Years</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <span className="text-slate-400 block text-[9.5px] uppercase">Annual Time-Lord</span>
            <span className="text-silver font-bold truncate block">{annualTimeLord} ({ordinal(annualHouse)}H)</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <span className="text-slate-400 block text-[9.5px] uppercase">Monthly Time-Lord</span>
            <span className="text-silver font-bold truncate block">{monthlyTimeLord} ({ordinal(monthlyHouse)}H)</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
            <span className="text-slate-400 block text-[9.5px] uppercase">Progressed Moon</span>
            <span className="text-silver font-bold truncate block">{progressedMoonDeg.toFixed(1)}° {progressedMoonSignName} · {progressedMoonPhaseName}</span>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-2.5">
            <span className="text-gold/80 block text-[9.5px] uppercase">Convergences</span>
            <span className="text-gold font-bold">{convergenceCount} Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
