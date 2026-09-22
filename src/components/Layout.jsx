import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { languageLabel } from '../lib/format.js';
import { NotificationBell } from './NotificationBell.jsx';

const ADMIN_NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/leads', label: 'Leads' },
  { to: '/import', label: 'Import' },
  { to: '/impact', label: 'Impact' },
  { to: '/team', label: 'Team' },
];

const BD_NAV = [{ to: '/queue', label: 'My Queue', end: true }];

function RoleSwitcher() {
  const { actor, bds, isAdmin, becomeAdmin, becomeBD } = useRole();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function choose(fn, path) {
    fn();
    setOpen(false);
    navigate(path);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium text-ink-2 transition-all hover:bg-panel"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[14px] font-bold text-white">
          {isAdmin ? 'A' : actor.name.charAt(0)}
        </div>
        <span className="text-ink font-semibold">{isAdmin ? 'Admin' : actor.name}</span>
        <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden="true" className="ml-1">
          <path d="M1 2L5 5.5L9 2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-menu-in absolute right-0 z-20 mt-2 w-72 rounded-xl border border-rule bg-white py-2 shadow-[0_12px_28px_-8px_rgba(20,22,26,0.18)] ring-1 ring-ink/5">
            <p className="px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              View as
            </p>
            <button
              type="button"
              onClick={() => choose(becomeAdmin, '/')}
              className={
                'block w-full px-4 py-2.5 text-left transition-colors hover:bg-panel ' +
                (isAdmin ? 'bg-accent-light font-semibold text-accent' : 'text-ink-2')
              }
            >
              <span className="text-[14.5px]">Admin</span>
              <span className="ml-2 text-[13px] text-ink-3">routing ops</span>
            </button>
            <div className="my-1.5 mx-4 border-t border-rule" />
            <div className="max-h-80 overflow-y-auto">
              {bds.map((bd) => (
                <button
                  key={bd._id}
                  type="button"
                  onClick={() => choose(() => becomeBD(bd), '/queue')}
                  className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-panel"
                >
                  <span className={'block text-[14.5px] ' + (actor.bdId === bd._id ? 'font-semibold text-accent' : 'text-ink-2')}>
                    {bd.name}
                  </span>
                  <span className="block text-[13px] text-ink-3">
                    {bd.languages.map((l) => languageLabel(l.code)).join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { isAdmin } = useRole();
  const nav = isAdmin ? ADMIN_NAV : BD_NAV;
  const { notifications, count, markRead } = useNotifications();

  return (
    <div className="min-h-full bg-paper">
      <header className="sticky top-0 z-30 border-b border-rule bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-8 px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 15C9.786 15.37 7.074 16.48 4.88 18" />
              </svg>
            </div>
            <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">Language Matcher</span>
          </div>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  'whitespace-nowrap rounded-lg px-4 py-2 text-[14.5px] font-medium transition-colors duration-150 ' +
                  (isActive ? 'bg-accent text-white' : 'text-ink-2 hover:bg-panel hover:text-ink')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {!isAdmin && (
              <NotificationBell
                notifications={notifications}
                count={count}
                onMarkRead={markRead}
              />
            )}
            <RoleSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-8 pb-24 pt-10">{children}</main>
    </div>
  );
}
