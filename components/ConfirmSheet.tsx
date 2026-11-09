'use client';

import Icon from './Icon';

type Props = {
  title: string;
  text: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmSheet({ title, text, confirmLabel, busy, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-slate-900 border border-slate-800 p-5 pb-7 shadow-2xl sm:rounded-3xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" />
        
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Icon name="check" className="h-7 w-7" />
        </div>
        
        <h2 className="text-center text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-center text-xs leading-relaxed text-slate-400">{text}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            className="h-12 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 rounded-xl bg-emerald-600 text-xs font-black text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

