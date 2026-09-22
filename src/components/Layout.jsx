import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext.jsx';
import { languageLabel } from '../lib/format.js';

const ADMIN_NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/leads', label: 'Leads' },
  { to: '/import', label: 'Import' },
  { to: '/impact', label: 'Impact' },
  { to: '/team', label: 'Team' },
];

const BD_NAV = [{ to: '/queue', label: 'My queue', end: true }];

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('language-matcher.theme') || 'system');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('language-matcher.theme', theme);
    } catch {
      /* private browsing - the app still works, it just forgets the choice */
    }
  }, [theme]);

  return [theme, setTheme];
}

/** Admin / BD switcher. Not authentication - a way to see both sides quickly. */
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
        className="flex items-center gap-1.5 text-[13px] text-ink-2 transition-colors hover:text-ink"
      >
        <span className="font-medium text-ink">{isAdmin ? 'Admin' : actor.name}</span>
        <span className="text-ink-3">{isAdmin ? 'ops' : 'BD'}</span>
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
          <path d="M1 1.5L4.5 5L8 1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-3 w-72 rounded-lg border border-rule bg-paper py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <p className="px-3.5 pb-1.5 pt-1 text-[11px] uppercase tracking-[0.07em] text-ink-3">
              View as
            </p>
            <button
              type="button"
              onClick={() => choose(becomeAdmin, '/')}
              className={
                'block w-full px-3.5 py-1.5 text-left text-[13px] hover:bg-panel ' +
                (isAdmin ? 'font-medium text-ink' : 'text-ink-2')
              }
            >
              Admin
              <span className="ml-1.5 text-ink-3">routing ops</span>
            </button>
            <div className="my-1.5 border-t border-rule" />
            <div className="max-h-80 overflow-y-auto">
              {bds.map((bd) => (
                <button
                  key={bd._id}
                  type="button"
                  onClick={() => choose(() => becomeBD(bd), '/queue')}
                  className="block w-full px-3.5 py-1.5 text-left hover:bg-panel"
                >
                  <span
                    className={
                      'block text-[13px] ' +
                      (actor.bdId === bd._id ? 'font-medium text-ink' : 'text-ink-2')
                    }
                  >
                    {bd.name}
                  </span>
                  <span className="block text-[11px] text-ink-3">
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
  const [theme, setTheme] = useTheme();
  const nav = isAdmin ? ADMIN_NAV : BD_NAV;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1140px] items-center gap-8 px-6">
          <span className="text-[13px] font-semibold tracking-tight text-ink">Language Matcher</span>

          <nav className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                /* The active marker is a border INSIDE the link box - an
                   absolutely positioned rule would overflow the header and
                   summon a scrollbar. */
                className={({ isActive }) =>
                  'whitespace-nowrap border-b-[1.5px] py-[17px] text-[13px] transition-colors ' +
                  (isActive
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-ink-2 hover:text-ink')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-[13px] text-ink-2 transition-colors hover:text-ink"
            title={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme'}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <RoleSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-6 pb-24 pt-10">{children}</main>
    </div>
  );
}
