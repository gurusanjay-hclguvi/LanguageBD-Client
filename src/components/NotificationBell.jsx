import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { languageLabel } from '../lib/format.js';

export function NotificationBell({ notifications, count, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  function handleClick() {
    setOpen(!open);
    if (!open && count > 0) {
      onMarkRead();
    }
  }

  function goToQueue() {
    setOpen(false);
    navigate('/queue');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleClick}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white hover:bg-panel transition-colors"
        aria-label={`${count} new leads assigned`}
      >
        <svg className="h-5 w-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-menu-in absolute right-0 z-50 mt-2 w-80 rounded-xl border border-rule bg-white py-2 shadow-lg">
          <div className="px-4 py-2 border-b border-rule">
            <p className="text-[13px] font-semibold text-ink">New Leads Assigned</p>
            <p className="text-[12px] text-ink-3">
              {notifications.length} lead{notifications.length !== 1 ? 's' : ''} ready to call
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 5).map((lead) => (
              <div key={lead._id} className="px-4 py-3 hover:bg-panel transition-colors border-b border-rule/50 last:border-0">
                <p className="text-[15px] font-semibold text-ink">{lead.name}</p>
                <p className="mt-0.5 text-[13px] text-ink-3">{lead.location}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-accent-light px-2 py-0.5 text-[12px] font-semibold text-accent">
                    {languageLabel(lead.speakIn)}
                  </span>
                  {lead.languageSource !== 'explicit' && lead.languageSource !== 'confirmed' && (
                    <span className="text-[11px] text-ink-3">Inferred</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-rule">
            <button
              type="button"
              onClick={goToQueue}
              className="w-full rounded-lg bg-accent px-4 py-2 text-[14px] font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              View My Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
