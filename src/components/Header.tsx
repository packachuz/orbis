import { useEffect, useState } from 'react';
import { Menu, Plus, X } from 'lucide-react';
import { SIGN_NAMES, signOf, type NatalChart } from '@/lib/astroEngine';
import { OrbisLogo, ZodiacGlyph } from './svg/AstroGlyphs';

const NAV = [
  { id: 'natal-graph', label: 'Natal Graph' },
  { id: 'active-orbs', label: 'Active Orbs' },
  { id: 'horoscope', label: 'Horoscope & Forecasts' },
  { id: 'remedies', label: 'Cosmic Remedies' },
];

export default function Header({ onNewChart, chart }: { onNewChart: () => void; chart: NatalChart }) {
  const [active, setActive] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ['command-center', ...NAV.map((n) => n.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => {
      window.removeEventListener('scroll', onScroll);
      obs.disconnect();
    };
  }, []);

  const sun = chart.planets[0];
  const asc = signOf(chart.asc);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-500 ${
        scrolled ? 'border-white/10 bg-obsidian/75 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <a href="#command-center" className="group flex items-center gap-3" aria-label="ORBIS home">
          <OrbisLogo size={34} className="transition-transform duration-700 group-hover:rotate-[120deg]" />
          <div className="leading-none">
            <span className="font-serif text-2xl font-semibold tracking-[0.32em] text-silver">ORBIS</span>
            <span className="mt-1 hidden font-mono text-[8.5px] uppercase tracking-[0.3em] text-slate-500 sm:block">Orbs of Influence</span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                active === n.id ? 'text-gold' : 'text-slate-400 hover:text-silver'
              }`}
            >
              {n.label}
              <span
                className={`absolute inset-x-4 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-gold to-transparent transition-opacity ${
                  active === n.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10.5px] text-slate-400 md:flex xl:flex">
            <ZodiacGlyph sign={sun.sign} size={13} color="#E5C158" />
            <span className="max-w-[110px] truncate text-silver">{chart.input.name}</span>
            <span className="text-slate-600">·</span>
            <span>{SIGN_NAMES[sun.sign].slice(0, 3)} ☉</span>
            <span>{SIGN_NAMES[asc].slice(0, 3)} ↑</span>
          </div>
          <button
            type="button"
            onClick={onNewChart}
            className="orbit-cta inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-obsidian"
          >
            <Plus size={15} strokeWidth={2.5} /> <span className="hidden sm:inline">New Chart</span>
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-silver lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-fade-up border-t border-white/10 bg-obsidian/95 px-4 py-3 backdrop-blur-xl lg:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-sm ${active === n.id ? 'bg-white/5 text-gold' : 'text-slate-300'}`}
            >
              {n.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
