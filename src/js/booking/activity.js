export function recordActivity(
  booking,
  actor,
  action,
  now = new Date(),
  detail = "",
) {
  booking.activity ||= [];
  booking.activity.push({
    id: crypto.randomUUID(),
    actorId: actor.id,
    actorName: actor.name || actor.username || "Staff",
    action,
    at: now.toISOString(),
    detail,
  });
}
export function bookingActivities(booking, data) {
  const events = [...(booking.activity || [])];
  for (const [action, at, actorId] of [
    ["Booking created", booking.createdAt, booking.bookedBy || booking.userId],
    ["Guests checked in", booking.checkedInAt, booking.checkedInBy],
    ["Food collected", booking.foodCollectedAt, booking.foodCollectedBy],
  ]) {
    if (at && !events.some((e) => e.action === action))
      events.push({
        action,
        at,
        actorId,
        actorName:
          data.users.find((u) => u.id === actorId)?.name || "Former account",
        detail: "",
      });
  }
  return events.sort((a, b) => b.at.localeCompare(a.at));
}
