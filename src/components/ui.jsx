import { useEffect } from 'react';
import { languageLabel, STATUS_LABELS } from '../lib/format.js';

/** Page title, one line of context, and the page's actions on the same baseline. */
export function PageHeader({ title, sub, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
        {sub && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/** A block of content, separated from its neighbours by a rule and space. */
export function Section({ title, sub, actions, children, className = '' }) {
  return (
    <section className={'border-t border-rule pt-6 ' + className}>
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between gap-6">
          <div>
            {title && <h2 className="text-[13px] font-semibold text-ink">{title}</h2>}
            {sub && <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-ink-3">{sub}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Headline figures, separated by hairlines rather than sitting in boxes.
 * `tone="critical"` is the only colour available here, and it is for the one
 * number that represents a problem.
 */
export function StatRow({ children }) {
  return (
    <div className="grid grid-cols-2 gap-y-6 border-y border-rule py-6 md:grid-cols-4">
      {children}
    </div>
  );
}

export function Stat({ label, value, unit, hint, tone = 'neutral' }) {
  return (
    <div className="px-5 first:pl-0 md:border-l md:border-rule md:first:border-l-0">
      <p className="text-[11px] uppercase tracking-[0.07em] text-ink-3">{label}</p>
      <p
        className={
          'mt-2 text-[30px] font-medium leading-none ' +
          (tone === 'critical' ? 'text-critical' : 'text-ink')
        }
      >
        {value}
        {unit && <span className="ml-0.5 text-[15px] text-ink-3">{unit}</span>}
      </p>
      {hint && <p className="mt-2 text-[12px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

/**
 * Languages as plain text, primary one emphasised. No chips: a wall of coloured
 * pills tells you less than weight and order do.
 */
export function Languages({ codes = [], className = '' }) {
  if (!codes.length) return <span className="text-ink-3">-</span>;
  return (
    <span className={'text-[13px] ' + className}>
      <span className="font-medium text-ink">{languageLabel(codes[0])}</span>
      {codes.length > 1 && (
        <span className="text-ink-3"> · {codes.slice(1).map(languageLabel).join(' · ')}</span>
      )}
    </span>
  );
}

/**
 * Where a lead's language came from. Words, not colour - a guess must never be
 * able to pass for something the learner actually told us.
 */
export function Source({ source }) {
  const label = { explicit: 'declared', inferred: 'inferred', unknown: 'unknown' }[source] ?? source;
  return (
    <span
      className={
        'text-[12px] ' + (source === 'explicit' ? 'text-ink-2' : 'text-ink-3 italic')
      }
    >
      {label}
    </span>
  );
}

export function Status({ status }) {
  const critical = status === 'unroutable';
  return (
    <span className={'text-[13px] ' + (critical ? 'font-medium text-critical' : 'text-ink-2')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** A score out of 100 with a hairline meter. The number is always readable. */
export function Score({ score }) {
  if (score == null) return <span className="text-ink-3">-</span>;
  return (
    <span className="flex items-center gap-2.5">
      <span className="tabular text-[13px] font-medium text-ink">{score}</span>
      <span className="h-[3px] w-12 rounded-full bg-rule">
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: Math.max(4, Math.min(100, score)) + '%' }}
        />
      </span>
    </span>
  );
}

/**
 * An inline message. A left rule carries the weight; colour is used only when
 * the message is about an unservable learner.
 */
export function Note({ tone = 'neutral', title, children, onClose }) {
  const accentRule = {
    neutral: 'border-ink',
    critical: 'border-critical',
  }[tone];

  return (
    <div className={'flex items-start justify-between gap-6 border-l-2 py-1 pl-4 ' + accentRule}>
      <div className="text-[13px] leading-relaxed">
        {title && (
          <p className={'font-medium ' + (tone === 'critical' ? 'text-critical' : 'text-ink')}>
            {title}
          </p>
        )}
        {children && <div className="text-ink-2">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[12px] text-ink-3 hover:text-ink"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Modal({ open, title, sub, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:p-10">
      <div
        className={
          'w-full rounded-lg border border-rule bg-paper shadow-[0_16px_50px_rgba(0,0,0,0.18)] ' +
          width
        }
      >
        <header className="flex items-start justify-between gap-6 border-b border-rule px-6 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
            {sub && <p className="mt-0.5 text-[12px] text-ink-3">{sub}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-ink-3 hover:text-ink"
            aria-label="Close"
          >
            Close
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="border-t border-rule py-16 text-center">
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-ink-3">{children}</p>
      )}
    </div>
  );
}

export function Loading({ label = 'Loading' }) {
  return <p className="py-20 text-center text-[13px] text-ink-3">{label}...</p>;
}
