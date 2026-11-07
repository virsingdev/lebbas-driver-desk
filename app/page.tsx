'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmSheet from '@/components/ConfirmSheet';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import type { MapCommand } from '@/components/RouteMap';
import RejectSheet from '@/components/RejectSheet';
import StopCard from '@/components/StopCard';
import { EMIRATES } from '@/lib/emirates';
import type { RoadInfo, RouteResponse, Stop } from '@/lib/types';
import { fmtDate, hasPos, mapsRouteUrl, mapsStopUrl, plural, todayDubai } from '@/lib/util';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-950" />,
});

type ActionName = 'picked_up' | 'reject' | 'set_time';

function Desk() {
  const params = useSearchParams();
  const d = params.get('d') ?? '';
  const t = params.get('t') ?? '';

  const [date, setDate] = useState<string>(todayDubai());
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<'invalid' | 'network' | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<Stop | null>(null);
  const [confirming, setConfirming] = useState<Stop | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [road, setRoad] = useState<RoadInfo | null | undefined>(undefined);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [command, setCommand] = useState<MapCommand>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!d || !t) {
        setError('invalid');
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const res = await fetch(
          `/api/route?d=${encodeURIComponent(d)}&t=${encodeURIComponent(t)}&date=${date}`,
          { cache: 'no-store' },
        );
        if (res.status === 401) {
          setError('invalid');
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setRoute((await res.json()) as RouteResponse);
        setError(null);
      } catch {
        if (silent) flash('Connection problem — showing last saved route');
        else setError('network');
      } finally {
        setLoading(false);
      }
    },
    [d, t, date, flash],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => load(true), 60000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const w = navigator.geolocation.watchPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(w);
  }, []);

  useEffect(() => {
    if (selectedId != null) {
      document.getElementById(`stop-${selectedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  const act = useCallback(
    async (stop: Stop, action: ActionName, extra: Record<string, string> = {}) => {
      setBusyId(stop.id);
      try {
        const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ d, t, order: stop.id, action, ...extra }),
        });
        if (!res.ok) throw new Error(String(res.status));

        flash(
          action === 'picked_up'
            ? `${stop.order_id} marked as picked up`
            : action === 'reject'
              ? `${stop.order_id} rejected`
              : `Time saved for ${stop.order_id}`,
        );
        setRejecting(null);
        setConfirming(null);
        if (action !== 'set_time') setSelectedId(null);
        await load(true);
      } catch {
        flash('Could not save. Check your connection and try again.');
      } finally {
        setBusyId(null);
      }
    },
    [d, t, load, flash],
  );

  const stops = useMemo<Stop[]>(() => route?.stops ?? [], [route]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    stops.forEach((s) => {
      if (s.emirate) c[s.emirate] = (c[s.emirate] || 0) + 1;
    });
    return c;
  }, [stops]);

  useEffect(() => {
    setRoad(undefined);
  }, [stops]);

  const pinnedCount = stops.filter(hasPos).length;
  const etas = stops.map((s) => s.eta).filter(Boolean) as string[];
  const lateCount = stops.filter((s) => s.late).length;
  const next = stops[0];
  const nextUrl = next ? mapsStopUrl(next) : null;
  const allUrl = mapsRouteUrl(stops);

  const dateList = Array.from({ length: 25 }, (_, i) => {
    const off = i - 7;
    const iso = addDays(todayDubai(), off);
    return { iso, label: fmtDate(iso) };
  });

  const isSunday = new Date(date).getDay() === 0;

  if (error === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-white">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl">
          <Logo size={64} className="mx-auto mb-5" />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Icon name="lock" className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Link Expired or Invalid</h1>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
            Please open your personalized <b className="text-emerald-400">Driver Desk</b> link sent via official WhatsApp dispatch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-0 sm:p-4 lg:p-6 flex items-center justify-center font-sans text-slate-100 antialiased">
      {/* Boxed Medium/Large App Container */}
      <div className="w-full h-[100vh] sm:h-[92vh] max-w-7xl flex flex-col rounded-none sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <Header
          driverName={route?.driver}
          date={date}
          setDate={setDate}
          loading={loading}
          onRefresh={() => load()}
          onOpenCalendar={() => setIsCalendarOpen(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section
            className={`relative shrink-0 bg-slate-900 transition-all duration-300 lg:order-2 lg:h-auto lg:flex-1 ${
              mapExpanded ? 'h-[70dvh]' : 'h-[45dvh]'
            }`}
          >
            <RouteMap
              stops={stops}
              selectedId={selectedId}
              onSelect={setSelectedId}
              me={me}
              command={command}
              onRoad={setRoad}
            />

            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3">
              {nextUrl && next ? (
                <a
                  href={nextUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto flex max-w-[75%] items-center gap-2.5 rounded-2xl bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-2xl border border-slate-700/80 backdrop-blur-md transition active:scale-95 hover:border-emerald-500/50"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Icon name="navigation" className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">Next Stop: {next.name ?? next.order_id}</span>
                </a>
              ) : (
                <span />
              )}

              <div className="pointer-events-auto flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setCommand({ type: 'fit', n: Date.now() })}
                  aria-label="Fit map"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md transition hover:bg-slate-800 hover:text-emerald-400"
                >
                  <Icon name="route" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!me}
                  onClick={() => setCommand({ type: 'me', n: Date.now() })}
                  aria-label="My location"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/95 text-blue-400 border border-slate-700/80 shadow-2xl backdrop-blur-md transition hover:bg-slate-800 disabled:opacity-40"
                >
                  <Icon name="locate" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMapExpanded((v) => !v)}
                  aria-label="Toggle map size"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md transition hover:bg-slate-800 lg:hidden"
                >
                  <Icon name={mapExpanded ? 'shrink' : 'expand'} className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-900/60 lg:order-1 lg:w-[440px] lg:flex-none lg:border-r lg:border-slate-800">
            {stops.length > 0 && (
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-xl">
                  <div className="text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Stops</p>
                    <p className="text-base font-black text-white mt-0.5">{stops.length}</p>
                  </div>
                  <div className="border-l border-slate-800 text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Distance</p>
                    <p className="text-base font-black text-white mt-0.5">{pinnedCount < 2 ? '—' : road ? `${Math.round(road.km)}km` : '...'}</p>
                  </div>
                  <div className="border-l border-slate-800 text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Delayed</p>
                    <p className={`text-base font-black mt-0.5 ${lateCount ? 'text-rose-400' : 'text-white'}`}>{lateCount}</p>
                  </div>
                  <div className="border-l border-slate-800 text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Timeline</p>
                    <p className="text-xs font-black text-emerald-400 mt-1 truncate">{etas.length ? etas[0] : '—'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.keys(counts).map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 shadow-sm"
                    >
                      <span className="h-2.5 w-2.5 rounded-full shadow-xs" style={{ backgroundColor: EMIRATES[code]?.color || '#10b981' }} />
                      {EMIRATES[code]?.name ?? code} <span className="text-slate-500 font-bold">({counts[code]})</span>
                    </span>
                  ))}
                </div>

                {allUrl && (
                  <a
                    href={allUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-950/50 transition active:scale-[0.99]"
                  >
                    <Icon name="navigation" className="h-4 w-4 text-slate-950" />
                    Open Route in Google Maps (Top {Math.min(10, stops.length)})
                  </a>
                )}
              </div>
            )}

            <div className="flex-1 px-4 pb-28 pt-1">
              {loading && !route && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-900 border border-slate-800" />
                  ))}
                </div>
              )}

              {error === 'network' && !route && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
                  <p className="font-bold text-white text-sm">Connection Interrupted</p>
                  <button
                    type="button"
                    onClick={() => load()}
                    className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-emerald-500 transition"
                  >
                    Retry Loading
                  </button>
                </div>
              )}

              {isSunday && stops.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Icon name="calendar" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-white">Sunday is Week Off</h3>
                  <p className="text-xs text-slate-400 mt-1">No scheduled pickups on Sundays (Monday – Saturday work week).</p>
                </div>
              )}

              {!isSunday && route && stops.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Icon name="party" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-white">All Pickups Complete!</h3>
                  <p className="text-xs text-slate-400 mt-1">No pending tasks for {fmtDate(date)}.</p>
                </div>
              )}

              {stops.length > 0 && (
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {plural(stops.length, 'Pickup')}
                  </h2>
                  <span className="text-[11px] font-medium text-slate-400">Tap card for options</span>
                </div>
              )}

              <ul className="space-y-3">
                {stops.map((s, i) => (
                  <StopCard
                    key={s.id}
                    stop={s}
                    index={i}
                    isNext={i === 0}
                    selected={selectedId === s.id}
                    busy={busyId === s.id}
                    onSelect={() => setSelectedId(selectedId === s.id ? null : s.id)}
                    onPicked={() => setConfirming(s)}
                    onReject={() => setRejecting(s)}
                    onSetTime={(time) => act(s, 'set_time', { time })}
                  />
                ))}
              </ul>
            </div>
          </aside>
        </main>

        <Footer date={date} />
      </div>

      {confirming && (
        <ConfirmSheet
          title={`Confirm Pickup: ${confirming.order_id}`}
          text={`Customer: ${confirming.name ?? 'Unknown'}. Proceeding will complete this stop.`}
          confirmLabel="Mark Complete"
          busy={busyId === confirming.id}
          onCancel={() => setConfirming(null)}
          onConfirm={() => act(confirming, 'picked_up')}
        />
      )}

      {rejecting && (
        <RejectSheet
          stop={rejecting}
          busy={busyId === rejecting.id}
          onCancel={() => setRejecting(null)}
          onConfirm={(reason) => act(rejecting, 'reject', { reason })}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-black text-slate-950 shadow-2xl border border-emerald-400 animate-in fade-in slide-in-from-bottom-4">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-emerald-400">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          {toast}
        </div>
      )}

      {isCalendarOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Select Route Date</h3>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="my-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {dateList.map(({ iso, label }) => {
                const isSelected = iso === date;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setDate(iso);
                      setIsCalendarOpen(false);
                    }}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-xs font-bold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{label}</span>
                    {iso === todayDubai() && (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-lg uppercase font-black ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="w-full rounded-xl bg-slate-800 py-3 text-xs font-extrabold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full border-b border-slate-900 pb-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Logo size={40} />
          <span className="text-xl font-extrabold tracking-wide text-white">Lebas Logistics</span>
        </div>
        <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
          Driver Portal v2.0
        </span>
      </header>

      <section className="max-w-3xl mx-auto text-center my-auto py-12">
        <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-3xl border border-slate-800 mb-6 shadow-2xl">
          <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
          Welcome to <span className="text-emerald-400">Lebas Driver Desk</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
          The official dispatch system for daily route navigation, assigned pickup stops, and real-time fleet schedules.
        </p>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 text-left rtl:text-right max-w-xl mx-auto shadow-2xl">
          <div className="flex items-start space-x-4 rtl:space-x-reverse">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 mt-0.5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-base mb-1">Looking for your daily schedule?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Driver links are unique and secure. Please tap your personalized <span className="text-emerald-400 font-bold">Driver Desk URL</span> received in your official WhatsApp dispatch message to access your daily tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto w-full text-center border-t border-slate-900 pt-6 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Lebas International Group. All rights reserved.</p>
      </footer>
    </main>
  );
}

function DeskRouter() {
  const params = useSearchParams();
  const d = params.get('d');
  const t = params.get('t');

  if (!d || !t) {
    return <WelcomeLanding />;
  }

  return <Desk />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <Logo size={64} />
        </div>
      }
    >
      <DeskRouter />
    </Suspense>
  );
}

