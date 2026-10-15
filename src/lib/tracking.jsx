import { useEffect, useRef, useState } from 'react';

const LIVE_WINDOW_MS = 20000; // the GPS simulator reports every 5 s

/**
 * Tracks, per vehicle, when a NEW GPS fix was last seen by this browser. Comparing fix times with
 * the browser clock would be wrong when the server runs in another time zone, so "live" means
 * "a new fix arrived in the last 20 seconds while we were watching".
 * items: [{ id, recordedAt }] -> returns isLive(id)
 */
export function useGpsFreshness(items) {
  const seen = useRef(new Map()); // id -> { recordedAt, changedAt }
  const [, tick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    for (const { id, recordedAt } of items) {
      const prev = seen.current.get(id);
      if (!prev || prev.recordedAt !== recordedAt) seen.current.set(id, { recordedAt, changedAt: now });
    }
  }, [items]);

  // Re-render every few seconds so a vehicle that stops reporting turns stale.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return (id) => {
    const s = seen.current.get(id);
    return !!s && Date.now() - s.changedAt < LIVE_WINDOW_MS;
  };
}

/** "POS status" cell: live tick for vehicles on rent, warning when they stop reporting, grey when parked. */
export function GpsStatus({ onRent, live }) {
  if (!onRent) return <span className="gps gps-parked">● Parked</span>;
  return live ? <span className="gps gps-live">✓ Live</span> : <span className="gps gps-stale">⚠ No signal</span>;
}

export function EngineBadge({ on }) {
  return <span className={`engine ${on ? 'engine-on' : 'engine-off'}`}>{on ? 'ON' : 'OFF'}</span>;
}
