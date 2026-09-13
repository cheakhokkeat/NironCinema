import { layoutFor } from "../src/js/booking/seatLayouts.js";
import { recordActivity } from "../src/js/booking/activity.js";
export const isStaff = (user) => ["staff", "admin"].includes(user?.role);
export function screeningAvailability(data, show, now = new Date()) {
  const movie = data.movies.find((m) => m.id === show.movieId);
  const cinema = data.locations.find((c) => c.id === show.locationId);
  if (!movie || cinema?.active !== "Yes")
    return {
      available: false,
      label: "Booking unavailable",
      reason: "Movie or cinema is unavailable.",
    };
  if (!(new Date(`${show.date}T${show.time}`) > now))
    return {
      available: false,
      label: "Booking closed",
      reason: "This screening has already started.",
    };
  const occupied = new Set(
    data.bookings
      .filter(
        (b) =>
          b.showtimeId === show.id &&
          ["Confirmed", "Pending"].includes(b.status),
      )
      .flatMap((b) => b.seats || []),
  );
  const free = layoutFor(show).ids.filter((id) => !occupied.has(id)).length;
  return free
    ? {
        available: true,
        label: "Booking available",
        reason: `${free} seats available`,
      }
    : {
        available: false,
        label: "Fully booked",
        reason: "No seats available for this screening.",
      };
}
export const localDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export function checkIn(data, user, id, now = new Date()) {
  if (!isStaff(user)) throw new Error("Staff access is required.");
  const booking = data.bookings.find((item) => item.id === id);
  if (!booking || booking.status !== "Confirmed")
    throw new Error("Only confirmed bookings can be checked in.");
  if (booking.checkedInAt)
    throw new Error("This ticket has already been checked in.");
  const show = data.showtimes.find((item) => item.id === booking.showtimeId);
  if (!show || show.date !== localDate(now))
    throw new Error("Check-in is only available on the screening date.");
  booking.checkedInAt = now.toISOString();
  booking.checkedInBy = user.id;
  recordActivity(booking, user, "Guests checked in", now);
  return booking;
}

export function monthlyReport(data, month, locationId = "") {
  const bookings = [...data.bookings, ...(data.foodOrders || [])].filter(
    (b) =>
      b.status === "Confirmed" &&
      b.date?.slice(0, 7) === month &&
      (!locationId ||
        (b.locationId ||
          data.showtimes.find((s) => s.id === b.showtimeId)?.locationId) ===
          locationId),
  );
  const cents = (value) => Math.round((Number(value) || 0) * 100);
  const total = bookings.reduce((sum, b) => sum + cents(b.total), 0);
  const food = bookings.reduce(
    (sum, b) =>
      sum +
      (b.foodTotal != null
        ? cents(b.foodTotal)
        : (b.food || []).reduce(
            (n, f) => n + cents(f.price) * (Number(f.quantity) || 0),
            0,
          )),
    0,
  );
  return {
    bookings,
    count: bookings.length,
    seats: bookings.reduce((sum, b) => sum + (b.seats || []).length, 0),
    total: total / 100,
    food: food / 100,
    tickets: (total - food) / 100,
  };
}

export function reportCsv(report) {
  const cell = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^[=+@\-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [
    [
      "Booking",
      "Booking date",
      "Seats",
      "Total USD",
      "Demo",
      "Checked in",
      "Order type",
      "Food and drinks",
      "Food sales USD",
      "Food collected",
    ],
    ...report.bookings.map((b) => [
      b.id,
      b.date,
      (b.seats || []).join(" "),
      b.total,
      b.demo ? "Yes" : "No",
      b.checkedInAt || "",
      b.type === "food" ? "Food only" : "Movie booking",
      (b.food || [])
        .map((f) => `${f.quantity} x ${f.name || "Food"}`)
        .join("; "),
      b.foodTotal ??
        (b.food || []).reduce(
          (sum, f) =>
            sum + Math.round(Number(f.price) * 100) * Number(f.quantity),
          0,
        ) / 100,
      b.foodCollectedAt || "",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
