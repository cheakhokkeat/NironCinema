export const stepDurations = { 1: 120000, 2: 120000, 3: 300000 };
export function changeBookingStep(draft, from, to, now = Date.now()) {
  if (!stepDurations[to] || now >= draft.deadline) return false;
  if (from === to) return true;
  draft.remaining ||= {};
  draft.remaining[from] = Math.max(0, draft.deadline - now);
  const remaining = draft.remaining[to] ?? stepDurations[to];
  if (remaining <= 0) return false;
  draft.deadline = now + remaining;
  draft.step = to;
  return true;
}
