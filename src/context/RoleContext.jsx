import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, readRole, writeRole } from '../api.js';

const RoleContext = createContext(null);

/**
 * Who the app is currently pretending to be: the admin, or one of the BDs.
 *
 * This deliberately has no passwords. It is a demo affordance so one browser
 * can show both sides of the product - the ops view that routes leads and the
 * BD view that works a queue. A real deployment swaps this for a session.
 */
export function RoleProvider({ children }) {
  const [actor, setActor] = useState(readRole);
  const [bds, setBds] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshBDs = useCallback(async () => {
    try {
      setBds(await api.bds());
    } catch {
      setBds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBDs();
  }, [refreshBDs]);

  // A BD who is deleted or renamed should not leave the app stuck as a ghost.
  useEffect(() => {
    if (actor.role !== 'bd' || !bds.length) return;
    const found = bds.find((b) => b._id === actor.bdId);
    if (!found) switchTo({ role: 'admin', bdId: null, name: 'Admin' });
    else if (found.name !== actor.name) switchTo({ ...actor, name: found.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bds]);

  function switchTo(next) {
    setActor(next);
    writeRole(next);
  }

  const value = useMemo(
    () => ({
      actor,
      isAdmin: actor.role === 'admin',
      bds,
      loading,
      refreshBDs,
      switchTo,
      becomeAdmin: () => switchTo({ role: 'admin', bdId: null, name: 'Admin' }),
      becomeBD: (bd) => switchTo({ role: 'bd', bdId: bd._id, name: bd.name }),
    }),
    [actor, bds, loading, refreshBDs],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside a RoleProvider');
  return ctx;
}
