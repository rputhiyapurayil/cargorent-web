import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

/** Loads data on mount / when deps change. Returns { data, error, loading, reload, setData }. */
export function useApi(path, options, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const load = useCallback(() => {
    if (!path) { setState({ data: null, error: null, loading: false }); return Promise.resolve(); }
    setState((s) => ({ ...s, loading: true, error: null }));
    return api(path, options)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(options), ...deps]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}
