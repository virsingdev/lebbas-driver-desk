'use client';

import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import { addDays, fmtDate, todayDubai } from '@/lib/util';

const DAYS = [
  { label: 'Yesterday', off: -1 },
  { label: 'Today', off: 0 },
  { label: 'Tomorrow', off: 1 },
];

interface HeaderProps {
  driverName?: string;
  date: string;
  setDate: (date: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onOpenCalendar: () => void;
}

export default function Header({ driverName, date, setDate, loading, onRefresh, onOpenCalendar }: HeaderProps) {
  const isPresetDate = DAYS.some((x) => addDays(todayDubai(), x.off) === date);

  return (
    <header className="relative z-35 shrink-0 bg-slate-900 text-white shadow-lg border-b border-slate-800 mb-2">
      {/* Top Row: Logo, Driver Name, Calendar & Refresh */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size={38} />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Lebas Logistics</p>
            <h1 className="truncate text-sm font-black text-white leading-tight">{driverName ?? 'Driver Desk'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar Button */}
          <button
            type="button"
            onClick={onOpenCalendar}
            title="Select custom date"
            className={`flex items-center gap-1.5 rounded-xl px-3 h-9 text-xs font-black transition shadow-xs border ${
              !isPresetDate
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon name="calendar" className={`h-4 w-4 shrink-0 ${!isPresetDate ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="text-xs max-w-[80px] truncate">
              {!isPresetDate ? fmtDate(date) : 'Calendar'}
            </span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh route"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-200 transition hover:bg-slate-700 active:scale-95 shadow-xs border border-slate-700"
          >
            <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom Row: Yesterday, Today, Tomorrow Tabs with top spacing */}
      <div className="flex items-center gap-2 px-4 pb-3.5 pt-3 border-t border-slate-800/80 bg-slate-950/40">
        {DAYS.map(({ label, off }) => {
          const iso = addDays(todayDubai(), off);
          const active = iso === date;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setDate(iso)}
              className={`flex-1 rounded-xl py-2.5 text-center text-xs font-black transition-all ${
                active
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

