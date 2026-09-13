import { recordActivity } from "../src/js/booking/activity.js";
import { isStaff, localDate } from "./operations.js";

export function collectFood(data, actor, id, now = new Date()) {
  if (!isStaff(actor)) throw new Error("Staff access is required.");
  const booking = data.bookings.find((b) => b.id === id);
  if (!booking || booking.status !== "Confirmed")
    throw new Error("Only confirmed orders can be collected.");
  if (!(booking.food || []).some((item) => Number(item.quantity) > 0))
    throw new Error("This booking has no food or drinks.");
  if (booking.foodCollectedAt)
    throw new Error("This order has already been collected.");
  const show = data.showtimes.find((s) => s.id === booking.showtimeId);
  if (show?.date !== localDate(now))
    throw new Error("Food collection is available on the screening date.");
  booking.foodCollectedAt = now.toISOString();
  booking.foodCollectedBy = actor.id;
  recordActivity(booking, actor, "Food collected", now);
  return booking;
}

export function shiftSummary(data, actorId, date, cinemaId = "") {
  const rows = data.bookings.filter(
    (b) =>
      !cinemaId ||
      data.showtimes.find((s) => s.id === b.showtimeId)?.locationId ===
        cinemaId,
  );
  const onDay = (value) => value && localDate(new Date(value)) === date;
  const sales = rows.filter(
    (b) =>
      b.bookedBy === actorId &&
      b.status === "Confirmed" &&
      (b.createdAt ? onDay(b.createdAt) : b.date === date),
  );
  const checkins = rows.filter(
    (b) => b.checkedInBy === actorId && onDay(b.checkedInAt),
  );
  const collections = rows.filter(
    (b) => b.foodCollectedBy === actorId && onDay(b.foodCollectedAt),
  );
  return {
    bookings: sales.length,
    sales:
      sales.reduce((n, b) => n + Math.round(Number(b.total) * 100), 0) / 100,
    checkins: checkins.length,
    guests: checkins.reduce((n, b) => n + (b.seats || []).length, 0),
    collections: collections.length,
    items: collections.reduce(
      (n, b) =>
        n + (b.food || []).reduce((sum, f) => sum + Number(f.quantity || 0), 0),
      0,
    ),
  };
}
