import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

// Calls onChange() whenever a row in `table` changes (optionally only rows matching `filter`,
// for example "customer_id=eq.123"). Used to keep order screens live.
export function useLive(name, table, filter, onChange) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const opts = { event: '*', schema: 'public', table };
    if (filter) opts.filter = filter;
    const channel = supabase
      .channel(`${name}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', opts, () => cb.current && cb.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [name, table, filter]);
}
