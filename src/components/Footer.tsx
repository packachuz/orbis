import { OrbisLogo } from './svg/AstroGlyphs';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-obsidian/90 pb-12 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand Col */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <OrbisLogo size={36} />
              <div className="leading-none">
                <span className="font-serif text-2xl font-semibold tracking-[0.32em] text-silver">
                  ORBIS
                </span>
                <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.28em] text-gold">
                  Celestial Precision
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-sm font-serif text-base italic text-slate-400">
              “Map Your Planetary Radius. Decode Your Orbs of Influence.”
            </p>

            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
              ORBIS synthesizes Keplerian orbital mechanics with psychological astrology.
              Every reading, degree readout, and aspect line is deterministically calculated from
              first astronomical principles of time and geographic coordinates.
            </p>
          </div>

          {/* Quick Nav Col */}
          <div className="md:col-span-3 md:col-start-7">
            <h5 className="font-mono text-xs uppercase tracking-widest text-gold">
              Navigation
            </h5>
            <ul className="mt-4 space-y-2 text-xs text-slate-400">
              <li>
                <a href="#command-center" className="transition hover:text-silver">
                  Birth Command Center
                </a>
              </li>
              <li>
                <a href="#natal-graph" className="transition hover:text-silver">
                  360° Natal Wheel
                </a>
              </li>
              <li>
                <a href="#active-orbs" className="transition hover:text-silver">
                  Active Orbs Aspect Web
                </a>
              </li>
              <li>
                <a href="#horoscope" className="transition hover:text-silver">
                  Horoscope & 2026 Forecasts
                </a>
              </li>
              <li>
                <a href="#remedies" className="transition hover:text-silver">
                  Orbis Alignment Remedies
                </a>
              </li>
            </ul>
          </div>

          {/* Ephemeris Specs Col */}
          <div className="md:col-span-3">
            <h5 className="font-mono text-xs uppercase tracking-widest text-gold">
              Ephemeris Engine
            </h5>
            <ul className="mt-4 space-y-2 font-mono text-[11px] text-slate-500">
              <li>• Epoch: J2000.0 Ephemeris Days</li>
              <li>• Sidereal: True LST & Obliquity</li>
              <li>• System: Porphyry & Solar Houses</li>
              <li>• Precision: Arc-minute orbs</li>
              <li>• Modern & Classical Rulerships</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="font-mono text-[10.5px] text-slate-500">
            © {new Date().getFullYear()} ORBIS Astrological Laboratory. All rights reserved.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-[10.5px] text-slate-400 transition hover:border-gold/40 hover:text-gold"
          >
            <span>Back to zenith</span>
            <ArrowUp size={12} />
          </button>
        </div>
      </div>
    </footer>
  );
}
