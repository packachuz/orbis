import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, Clock, Crosshair, MapPin, Search, Sparkles, User } from 'lucide-react';
import { formatCoord, formatUtcOffset, zoneOffsetHours, type NatalChart } from '@/lib/astroEngine';
import { CITIES, PRESETS, cityById, type ChartPreset } from '@/lib/cities';
import type { Phase, Selection } from './OrbisApp';
import OrbitalPreview from './OrbitalPreview';

export interface BirthFormState {
  name: string;
  date: string;
  time: string;
  unknownTime: boolean;
  cityId: string; // city id or 'custom'
  customLat: string;
  customLng: string;
  customOffset: string;
}

interface Props {
  form: BirthFormState;
  onChange: (patch: Partial<BirthFormState>) => void;
  onSubmit: () => void;
  onPreset: (p: ChartPreset) => void;
  activePreset: string | null;
  chart: NatalChart;
  phase: Phase;
  selection: Selection;
  onSelect: (sel: Selection) => void;
  focusOnWheel?: (sel: Selection) => void;
}

export default function BirthCommandCenter({
  form,
  onChange,
  onSubmit,
  onPreset,
  activePreset,
  chart,
  phase,
  selection,
  onSelect,
  focusOnWheel,
}: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const custom = form.cityId === 'custom';
  const city = cityById(form.cityId);

  const liveOffset = useMemo(() => {
    if (custom || !city || !form.date) return null;
    return zoneOffsetHours(city.timezone, form.date, form.unknownTime ? '12:00' : form.time || '12:00', city.utcOffset);
  }, [custom, city, form.date, form.time, form.unknownTime]);

  const validate = () => {
    const e: string[] = [];
    if (!form.date || Number.isNaN(Date.parse(form.date))) e.push('Enter a valid birth date.');
    if (!form.unknownTime && !/^\d{2}:\d{2}$/.test(form.time)) e.push('Enter a birth time or enable Solar Chart mode.');
    if (custom) {
      const lat = Number(form.customLat);
      const lng = Number(form.customLng);
      const off = Number(form.customOffset);
      if (form.customLat === '' || Number.isNaN(lat) || lat < -90 || lat > 90) e.push('Latitude must be between −90 and 90.');
      if (form.customLng === '' || Number.isNaN(lng) || lng < -180 || lng > 180) e.push('Longitude must be between −180 and 180.');
      if (form.customOffset === '' || Number.isNaN(off) || off < -12 || off > 14) e.push('UTC offset must be between −12 and +14.');
    }
    setErrors(e);
    return e.length === 0;
  };

  return (
    <section id="command-center" className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        {/* Left column */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3.5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-gold">Celestial Precision Ephemeris · v2.6</span>
          </div>

          <h1 className="mt-6 font-serif text-5xl font-semibold leading-[0.98] tracking-tight text-silver sm:text-6xl xl:text-7xl">
            Discover What
            <br />
            <span className="gold-text italic">Pulls Your Orbit</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-400">
            Map Your Planetary Radius. Decode Your Orbs of Influence. ORBIS calculates your exact natal sky and the degree radius
            binding every planet — then turns that geometry into guidance.
          </p>

          {/* Birth Data Input Card */}
          <form
            className="glass mt-8 p-5 sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (validate()) onSubmit();
            }}
            noValidate
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">Birth Data Command Center</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPreset(p)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition ${
                      activePreset === p.id
                        ? 'border-gold/60 bg-gold/15 text-gold'
                        : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-silver'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Name / Chart Label" icon={<User size={14} />} className="sm:col-span-2">
                <input
                  id="chart-name"
                  className="field pl-9"
                  placeholder="e.g. Aurora Vale"
                  value={form.name}
                  maxLength={48}
                  onChange={(e) => onChange({ name: e.target.value })}
                />
              </Field>

              <Field label="Birth Date" icon={<Calendar size={14} />}>
                <input
                  type="date"
                  className="field pl-9 font-mono"
                  value={form.date}
                  min="1900-01-01"
                  max="2100-12-31"
                  onChange={(e) => onChange({ date: e.target.value })}
                />
              </Field>

              <Field label="Birth Time" icon={<Clock size={14} />}>
                <input
                  type="time"
                  className={`field pl-9 font-mono ${form.unknownTime ? 'opacity-40' : ''}`}
                  value={form.time}
                  disabled={form.unknownTime}
                  onChange={(e) => onChange({ time: e.target.value })}
                />
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-obsidian/40 px-3.5 py-2.5 sm:col-span-2">
                <span className="text-[13px] text-slate-300">
                  Unknown Birth Time <span className="text-slate-500">(Use Solar Chart)</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.unknownTime}
                  onClick={() => onChange({ unknownTime: !form.unknownTime })}
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                    form.unknownTime ? 'border-gold/60 bg-gold/30' : 'border-white/15 bg-white/5'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-[18px] w-[18px] rounded-full shadow transition-all ${
                      form.unknownTime ? 'left-[22px] bg-gold' : 'left-0.5 bg-slate-400'
                    }`}
                  />
                </button>
              </label>

              <div className="sm:col-span-2">
                <CitySelector
                  value={form.cityId}
                  onChange={(id) =>
                    onChange(
                      id === 'custom' && city
                        ? { cityId: id, customLat: String(city.lat), customLng: String(city.lng), customOffset: String(liveOffset ?? city.utcOffset) }
                        : { cityId: id },
                    )
                  }
                />
                {/* Coordinates readout */}
                {!custom && city && (
                  <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-obsidian/40 p-2.5 font-mono text-[10.5px]">
                    <Readout label="Latitude" value={formatCoord(city.lat, 'N', 'S')} />
                    <Readout label="Longitude" value={formatCoord(city.lng, 'E', 'W')} />
                    <Readout label="Timezone" value={liveOffset !== null ? formatUtcOffset(liveOffset) : formatUtcOffset(city.utcOffset)} sub={city.timezone} />
                  </div>
                )}
                {custom && (
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    <MiniInput label="Latitude (+N/−S)" value={form.customLat} onChange={(v) => onChange({ customLat: v })} placeholder="13.7563" />
                    <MiniInput label="Longitude (+E/−W)" value={form.customLng} onChange={(v) => onChange({ customLng: v })} placeholder="100.5018" />
                    <MiniInput label="UTC Offset (h)" value={form.customOffset} onChange={(v) => onChange({ customOffset: v })} placeholder="7" />
                  </div>
                )}
              </div>
            </div>

            {errors.length > 0 && (
              <ul className="mt-4 space-y-1 rounded-xl border border-crimson-orb/30 bg-crimson-orb/10 px-3.5 py-2.5 text-xs text-rose-200">
                {errors.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={phase === 'calculating'}
              className="orbit-cta mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-obsidian transition disabled:cursor-wait"
            >
              {phase === 'calculating' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-obsidian/30 border-t-obsidian" /> Aligning Orbits…
                </>
              ) : (
                <>
                  <Sparkles size={17} /> Calculate My Orbis Graph
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right column */}
        <OrbitalPreview
          chart={chart}
          phase={phase}
          selection={selection}
          onSelect={onSelect}
          focusOnWheel={focusOnWheel}
        />
      </div>
    </section>
  );
}

function Field({ label, icon, children, className = '' }: { label: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold/70">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function Readout({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-0.5 truncate text-gold">{value}</div>
      {sub && <div className="truncate text-[9px] text-slate-500">{sub}</div>}
    </div>
  );
}

function MiniInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1 block truncate text-[9.5px] uppercase tracking-wider text-slate-500">{label}</span>
      <input
        inputMode="decimal"
        className="field px-2.5 py-2 font-mono text-xs"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CitySelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const city = cityById(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CITIES.filter((c) => `${c.name} ${c.country} ${c.timezone}`.toLowerCase().includes(q)) : CITIES;
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => setHi(0), [query]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">Birth Location</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field flex items-center gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MapPin size={14} className="shrink-0 text-gold/70" />
        <span className="flex-1 truncate">{value === 'custom' ? 'Custom Coordinates' : city ? `${city.name}, ${city.country}` : 'Select a city'}</span>
        <ChevronDown size={15} className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="glass-strong absolute left-0 right-0 z-30 mt-2 overflow-hidden shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <Search size={14} className="text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, results.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                if (e.key === 'Enter') { e.preventDefault(); if (results[hi]) pick(results[hi].id); }
                if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="Search city, country or timezone…"
              className="w-full bg-transparent text-sm text-silver outline-none placeholder:text-slate-500"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {results.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(c.id)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition ${i === hi ? 'bg-white/5' : ''}`}
                >
                  <span className="truncate">
                    <span className="text-silver">{c.name}</span> <span className="text-slate-500">· {c.country}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-slate-500">
                    {c.lat.toFixed(2)}, {c.lng.toFixed(2)}
                    {value === c.id && <Check size={13} className="text-gold" />}
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-3.5 py-3 text-xs text-slate-500">No preset found — use custom coordinates below.</li>}
          </ul>
          <button
            type="button"
            onClick={() => pick('custom')}
            className="flex w-full items-center gap-2 border-t border-white/10 px-3.5 py-2.5 text-left text-sm text-astral transition hover:bg-white/5"
          >
            <Crosshair size={14} /> Enter custom coordinates
          </button>
        </div>
      )}
    </div>
  );
}
