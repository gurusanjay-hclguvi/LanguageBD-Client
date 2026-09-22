import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetch-on-mount with a manual reload.
 *
 * A refetch keeps the previous data on screen and reports `refreshing`, so the
 * UI can dim rather than collapse into a skeleton and jump the layout around.
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const hasData = useRef(false);

  const run = useCallback(async () => {
    if (hasData.current) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fn();
      if (!alive.current) return;
      setData(result);
      hasData.current = true;
      setError(null);
    } catch (err) {
      if (alive.current) setError(err.message);
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
    };
  }, [run]);

  return { data, error, loading, refreshing, reload: run };
}

export default useAsync;
