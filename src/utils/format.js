/**
 * Number formatting helpers for display. All inputs are in SI internally.
 */

export function fmtDV(ms, decimals = 2) {
  if (ms == null || !isFinite(ms)) return '—';
  return `${(ms / 1000).toFixed(decimals)} km/s`;
}

export function fmtDVRaw(ms) {
  if (ms == null || !isFinite(ms)) return '—';
  return ms.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function fmtC3(c3, decimals = 2) {
  if (c3 == null || !isFinite(c3)) return '—';
  return `${c3.toFixed(decimals)} km²/s²`;
}

export function fmtDays(seconds) {
  if (seconds == null || !isFinite(seconds)) return '—';
  return `${Math.round(seconds / 86400)} days`;
}

export function fmtDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
}

export function fmtMass(kg) {
  if (kg == null || !isFinite(kg)) return '—';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg)} kg`;
}
