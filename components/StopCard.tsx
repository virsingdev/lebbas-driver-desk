'use client';

import { useState } from 'react';
import { colorOf, nameOf } from '@/lib/emirates';
import type { Stop } from '@/lib/types';
import { digitsOnly, mapsStopUrl } from '@/lib/util';
import Icon from './Icon';

type Props = {
  stop: Stop;
  index: number;
  isNext: boolean;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onPicked: () => void;
  onReject: () => void;
  onSetTime: (time: string) => void;
};

const BTN =
  'flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-40 shadow-2xs';

export default function StopCard({ stop, index, isNext, selected, busy, onSelect, onPicked, onReject, onSetTime }: Props) {
  const [time, setTime] = useState<string>((stop.eta ?? '09:00').slice(0, 5));
  const color = colorOf(stop.emirate);
  const nav = mapsStopUrl(stop);
  const phone = digitsOnly(stop.phone);

  return (
    <li
      id={`stop-${stop.id}`}
      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 shadow-sm ${
        selected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
          : isNext
            ? 'border-emerald-400 shadow-md ring-1 ring-emerald-400/20'
            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Main Touchable Card Header */}
      <button 
        type="button" 
        onClick={onSelect} 
        className="flex w-full items-start gap-3.5 p-3.5 text-left transition-colors hover:bg-slate-50/50"
      >
        {/* Sequence Badge */}
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
          style={{ background: color }}
        >
          {index + 1}
        </span>

        {/* Customer Details */}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-black text-slate-900 leading-tight">
              {stop.name ?? 'Customer'}
            </span>
            {isNext && (
              <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-2xs">
                Next
              </span>
            )}
          </span>

          {stop.area && (
            <span dir="auto" className="mt-1 block truncate text-xs font-medium text-slate-500 [unicode-bidi:plaintext]">
              {stop.area}
            </span>
          )}

          {/* Metadata Pills */}
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            {stop.slot && (
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {stop.slot}
              </span>
            )}
            {stop.emirate && (
              <span 
                className="rounded-lg px-2 py-0.5 text-[10px] font-extrabold" 
                style={{ background: `${color}18`, color }}
              >
                {nameOf(stop.emirate)}
              </span>
            )}
          </span>
        </span>

        {/* ETA & Status */}
        {stop.eta && (
          <span className="shrink-0 text-right pl-1">
            <span className={`block font-mono text-sm font-black ${stop.late ? 'text-rose-600' : 'text-slate-900'}`}>
              {stop.eta}
            </span>
            {stop.late && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-600">
                <Icon name="alert" className="h-3 w-3" /> Late
              </span>
            )}
          </span>
        )}
      </button>

      {/* Expanded Action Drawer */}
      {selected && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/80 p-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="rounded-md bg-slate-200/60 px-2 py-0.5 font-mono font-bold text-slate-700">
              {stop.order_id}
            </span>
            {stop.phone && (
              <span dir="ltr" className="font-mono font-semibold text-slate-600">
                {stop.phone}
              </span>
            )}
          </div>

          {/* Quick Action Buttons: Navigate, Call, Chat */}
          <div className="grid grid-cols-3 gap-2">
            {nav ? (
              <a href={nav} target="_blank" rel="noreferrer" className={`${BTN} bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-500`}>
                <Icon name="navigation" className="h-4 w-4" /> Navigate
              </a>
            ) : (
              <span className={`${BTN} bg-slate-100 text-slate-400 cursor-not-allowed`}>No pin</span>
            )}

            {stop.phone ? (
              <a href={`tel:+${phone}`} className={`${BTN} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}>
                <Icon name="phone" className="h-4 w-4 text-emerald-600" /> Call
              </a>
            ) : (
              <span className={`${BTN} bg-slate-100 text-slate-400 cursor-not-allowed`}>Call</span>
            )}

            {stop.phone ? (
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noreferrer"
                className={`${BTN} border border-slate-200 bg-white text-emerald-700 hover:bg-slate-50`}
              >
                <Icon name="message" className="h-4 w-4 text-emerald-600" /> Chat
              </a>
            ) : (
              <span className={`${BTN} bg-slate-100 text-slate-400 cursor-not-allowed`}>Chat</span>
            )}
          </div>

          {/* Time Rescheduling Row */}
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200/80 p-2 shadow-2xs">
            <Icon name="clock" className="ml-1 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Pickup time"
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-500"
            />
            <button
              type="button"
              disabled={busy || !time}
              onClick={() => onSetTime(time)}
              className="h-9 rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40"
            >
              Save time
            </button>
          </div>

          {/* Primary Action Bar: Picked Up & Reject */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={onPicked}
              className={`${BTN} col-span-3 h-12 bg-emerald-600 text-sm font-black text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500`}
            >
              <Icon name="check" className="h-4 w-4" /> Picked up
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className={`${BTN} col-span-2 h-12 border border-rose-200 bg-rose-50 text-xs font-bold text-rose-600 hover:bg-rose-100`}
            >
              <Icon name="x" className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
