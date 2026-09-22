import { useEffect } from 'react';
import { languageLabel, STATUS_LABELS } from '../lib/format.js';

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {sub && <p className="mt-2.5 text-[16px] leading-relaxed text-ink-3">{sub}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

export function Section({ title, sub, actions, children, className = '' }) {
  return (
    <section className={'border-t border-rule pt-10 ' + className}>
      {(title || actions) && (
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            {title && <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>}
            {sub && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-3">{sub}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatRow({ children }) {
  return (
    <div className="grid grid-cols-2 gap-y-8 border-y border-rule py-8 md:grid-cols-4">
      {children}
    </div>
  );
}

export function Stat({ label, value, unit, hint, tone = 'neutral' }) {
  return (
    <div className="px-6 first:pl-0 md:border-l md:border-rule md:first:border-l-0">
      <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-3">{label}</p>
      <p className={'mt-3 text-[40px] font-semibold leading-none tracking-[-0.02em] text-ink'}>
        {value}
        {unit && <span className="ml-1 text-[20px] font-normal text-ink-3">{unit}</span>}
      </p>
      {hint && <p className="mt-3 text-[15px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

export function Languages({ codes = [], className = '' }) {
  if (!codes.length) return <span className="text-[16px] text-ink-3">-</span>;
  return (
    <span className={'text-[16px] ' + className}>
      <span className="font-bold text-ink">{languageLabel(codes[0])}</span>
      {codes.length > 1 && (
        <span className="text-ink-2 font-normal text-[15px]"> · {codes.slice(1).map(languageLabel).join(' · ')}</span>
      )}
    </span>
  );
}

export function Source({ source }) {
  const label =
    { confirmed: 'confirmed', explicit: 'declared', inferred: 'inferred', unknown: 'unknown' }[
      source
    ] ?? source;

  const tone = {
    confirmed: 'font-bold text-accent',
    explicit: 'font-semibold text-ink-2',
  }[source] ?? 'text-ink-3 italic';

  return <span className={'text-[15px] ' + tone}>{label}</span>;
}

export function Status({ status }) {
  const isWarning = status === 'unroutable';
  return (
    <span className={'text-[16px] font-semibold ' + (isWarning ? 'text-ink' : 'text-ink-2')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Score({ score }) {
  if (score == null) return <span className="text-[16px] text-ink-3">-</span>;
  return (
    <span className="flex items-center gap-3">
      <span className="tabular text-[18px] font-bold text-ink">{score}</span>
      <span className="h-[5px] w-20 rounded-full bg-rule">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: Math.max(4, Math.min(100, score)) + '%' }}
        />
      </span>
    </span>
  );
}

export function Note({ tone = 'neutral', title, children, onClose }) {
  const bgClass = tone === 'ok' ? 'bg-green-50' : 'bg-panel';
  const borderClass = tone === 'critical' ? 'border-l-4 border-ink' : tone === 'ok' ? 'border-l-4 border-green-500' : 'border-l-4 border-accent';

  return (
    <div className={'flex items-start justify-between gap-6 py-4 pl-5 pr-4 rounded-r-lg ' + bgClass + ' ' + borderClass}>
      <div className="text-[16px] leading-relaxed">
        {title && (
          <p className={'font-semibold text-ink'}>{title}</p>
        )}
        {children && <div className="text-[15px] text-ink-2 mt-1">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[15px] font-medium text-ink-3 hover:text-ink transition-colors"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Modal({ open, title, sub, onClose, children, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/25 p-4 backdrop-blur-[2px] animate-overlay-in sm:p-10">
      <div
        className={
          'animate-modal-in flex max-h-[calc(100vh-2rem)] w-full min-h-0 flex-col rounded-2xl border border-rule bg-white shadow-[0_20px_50px_-12px_rgba(20,22,26,0.25)] ' +
          width
        }
      >
        <header className="flex shrink-0 items-start justify-between gap-6 border-b border-rule px-7 py-5">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {sub && <p className="mt-1.5 text-[15px] text-ink-3">{sub}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 -mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-panel hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M1 1L14 14M14 1L1 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="border-t border-rule py-20 text-center">
      <p className="text-[20px] font-bold text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-3 max-w-sm text-[17px] leading-relaxed text-ink-3">{children}</p>
      )}
    </div>
  );
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className="py-20 text-center">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      <p className="mt-5 text-[17px] text-ink-3">{label}...</p>
    </div>
  );
}
