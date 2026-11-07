'use client';

import { useState } from 'react';
import type { Stop } from '@/lib/types';
import Icon from './Icon';

const REASONS = [
  'Clothes not suitable / poor quality',
  'Customer not available',
  'Wrong address / location',
  'Too few items',
  'Other reason',
];

type Props = {
  stop: Stop;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export default function RejectSheet({ stop, busy, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState<string>('');

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-slate-900 border border-slate-800 p-5 pb-7 shadow-2xl sm:rounded-3xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" />
        
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Icon name="x" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold leading-tight text-white">Reject {stop.order_id}</h2>
            <p className="truncate text-xs text-slate-400 mt-0.5">{stop.name ?? 'Customer'} — choose a reason</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left text-xs font-bold transition ${
                reason === r 
                  ? 'border-rose-500/60 bg-rose-500/15 text-white shadow-sm' 
                  : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  reason === r ? 'border-rose-400 bg-rose-500' : 'border-slate-600 bg-slate-900'
                }`}
              >
                {reason === r && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span>{r}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            className="h-12 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Keep order
          </button>
          <button
            type="button"
            disabled={!reason || busy}
            onClick={() => onConfirm(reason)}
            className="h-12 rounded-xl bg-rose-600 text-xs font-black text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 transition active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

