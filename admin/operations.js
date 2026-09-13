import { validateFormatProfiles } from "../src/js/movies/formatProfiles.js";
import { recordActivity } from "../src/js/booking/activity.js";
import { createAccountId } from "../src/js/utils/accountId.js";
import { seatLayouts } from "../src/js/booking/seatLayouts.js";
export function requireAdmin(data, id) {
  const actor = data.users.find((u) => u.id === id);
  if (actor?.role !== "admin")
    throw new Error("Administrator access is required.");
  return actor;
}
const clean = (v) => String(v ?? "").trim();
function required(v, label) {
  v = clean(v);
  if (!v) throw new Error(`${label} is required.`);
  return v;
}
function amount(v) {
  const n = Number(v);
  if (clean(v) === "" || !Number.isFinite(n) || n < 0)
    throw new Error("Enter a valid non-negative price.");
  return Math.round(n * 100) / 100;
}
function url(v, image = false) {
  v = clean(v);
  if (!v) return "";
  if (image && /^data:image\/(png|jpeg|webp);base64,/.test(v)) return v;
  try {
    const u = new URL(v);
    if (["http:", "https:"].includes(u.protocol)) return v;
  } catch {}
  throw new Error("Use an http or https URL.");
}
function date(v) {
  v = required(v, "Date");
  const d = new Date(v + "T12:00:00");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    Number.isNaN(+d) ||
    d.getDate() !== Number(v.slice(8))
  )
    throw new Error("Enter a valid date.");
  return v;
}
export function logAdmin(data, actor, action, entity, recordId) {
  data.adminActivity ||= [];
  data.adminActivity.push({
    id: crypto.randomUUID(),
    actorId: actor.id,
    actorName: actor.name,
    action,
    entity,
    recordId,
    at: new Date().toISOString(),
  });
}
export function saveRecord(data, actorId, entity, id, values) {
  const actor = requireAdmin(data, actorId);
  if (
    !["movies", "showtimes", "locations", "foods", "ads", "users"].includes(
      entity,
    )
  )
    throw new Error("Unsupported record.");
  const existing = id ? data[entity].find((r) => r.id === id) : null;
  if (id && !existing) throw new Error("This record no longer exists.");
  let next = {
    ...existing,
    id:
      existing?.id ||
      (entity === "users" ? createAccountId() : crypto.randomUUID()),
  };
  if (entity === "movies")
    next = {
      ...next,
      title: required(values.title, "Title"),
      formatProfiles: validateFormatProfiles(
        values.formatProfiles ?? existing?.formatProfiles ?? [],
      ),
      genre: required(values.genre, "Genre"),
      duration: required(values.duration, "Duration"),
      release: date(values.release),
      classification: required(values.classification, "Classification"),
      type: values.type === "Advance" ? "Advance" : "Standard",
      poster: url(values.poster, true),
      movie_details: {
        ...existing?.movie_details,
        synopsis: clean(values.synopsis),
        director: clean(values.director),
        cast: clean(values.cast)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        language: clean(values.language),
        country: clean(values.country),
      },
    };
  if (entity === "showtimes") {
    if (
      !data.movies.some((m) => m.id === values.movieId) ||
      !data.locations.some((l) => l.id === values.locationId)
    )
      throw new Error("Choose an existing movie and cinema.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))
      throw new Error("Enter a valid screening time.");
    if (!["2D", "3D", "IMAX", "4DX"].includes(values.format))
      throw new Error("Choose a valid screening format.");
    next = {
      ...next,
      movieId: values.movieId,
      locationId: values.locationId,
      hall: required(values.hall, "Hall"),
      date: date(values.date),
      time: values.time,
      format: required(values.format, "Format"),
      price: amount(values.price),
      audioLanguage: clean(
        values.audioLanguage || existing?.audioLanguage || "KH",
      ),
      subtitleLanguage: clean(
        values.subtitleLanguage || existing?.subtitleLanguage || "None",
      ),
      sound: clean(values.sound || existing?.sound || "Standard"),
      seatLayout:
        existing && data.bookings.some((b) => b.showtimeId === id)
          ? existing.seatLayout || "Standard"
          : seatLayouts[values.format]
            ? values.format
            : "Standard",
    };
    if (!["KH", "EN", "KR", "JP", "ZH", "HI"].includes(next.audioLanguage))
      throw new Error("Choose a valid audio language.");
    if (!["None", "KH", "EN", "KR", "JP", "ZH"].includes(next.subtitleLanguage))
      throw new Error("Choose a valid subtitle language.");
    if (
      ![
        "Standard",
        "Dolby 5.1",
        "Dolby 7.1",
        "Dolby Atmos",
        "IMAX Sound",
      ].includes(next.sound)
    )
      throw new Error("Choose a valid sound system.");
    if (
      data.showtimes.some(
        (s) =>
          s.id !== id &&
          s.locationId === next.locationId &&
          s.hall.toLowerCase() === next.hall.toLowerCase() &&
          s.date === next.date &&
          s.time === next.time,
      )
    )
      throw new Error("This hall already has a screening at that time.");
    if (
      existing &&
      data.bookings.some((b) => b.showtimeId === id) &&
      ["movieId", "locationId", "hall", "date", "time", "format", "price"].some(
        (k) => String(next[k]) !== String(existing[k] ?? ""),
      )
    )
      throw new Error(
        "This screening has bookings. Create a new screening instead of changing their ticket details.",
      );
  }
  if (entity === "locations")
    next = {
      ...next,
      name: required(values.name, "Name"),
      address: required(values.address, "Address"),
      image: url(values.image, true),
      phone: clean(values.phone),
      hours: clean(values.hours),
      mapUrl: url(values.mapUrl),
      active: values.active === "Yes" ? "Yes" : "No",
    };
  if (entity === "foods")
    next = {
      ...next,
      name: required(values.name, "Name"),
      description: clean(values.description),
      price: amount(values.price),
      image: url(values.image, true),
      icon: "fa-utensils",
    };
  if (entity === "ads") {
    const link = clean(values.link);
    if (link && !/^#[\w-]+$/.test(link)) url(link);
    next = {
      ...next,
      title: required(values.title, "Title"),
      subtitle: clean(values.subtitle),
      label: clean(values.label),
      image: url(values.image, true),
      link: link || "#movies",
      active: values.active === "Yes" ? "Yes" : "No",
    };
  }
  if (entity === "users") {
    const email = required(values.email, "Email").toLowerCase(),
      username = required(values.username, "Username").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Enter a valid email.");
    if (!/^[a-z0-9_.-]{2,40}$/.test(username))
      throw new Error(
        "Username must be 2–40 letters, numbers, dots, underscores or hyphens.",
      );
    if (
      data.users.some(
        (u) =>
          u.id !== id &&
          [u.email?.toLowerCase(), u.username?.toLowerCase()].some(
            (v) => v === email || v === username,
          ),
      )
    )
      throw new Error("That email or username is already in use.");
    if (!["user", "staff", "admin"].includes(values.role))
      throw new Error("Choose a valid role.");
    if (id === actorId && values.role !== "admin")
      throw new Error("You cannot remove your own administrator access.");
    const password = String(values.password || "");
    if ((!existing || password) && password.length < 8)
      throw new Error("New passwords must contain at least 8 characters.");
    next = {
      ...next,
      name: required(values.name, "Name"),
      email,
      username,
      role: values.role,
      password: password || existing.password,
    };
    if (password) delete next.rememberToken;
  }
  if (existing) data[entity][data[entity].findIndex((r) => r.id === id)] = next;
  else data[entity].push(next);
  logAdmin(
    data,
    actor,
    existing ? "Record updated" : "Record created",
    entity,
    next.id,
  );
  return next;
}
export function deleteRecord(data, actorId, entity, id) {
  const actor = requireAdmin(data, actorId);
  if (
    !["movies", "showtimes", "locations", "foods", "ads", "users"].includes(
      entity,
    )
  )
    throw new Error("Unsupported record.");
  if (!data[entity].some((r) => r.id === id))
    throw new Error("Record not found.");
  if (entity === "users" && id === actorId)
    throw new Error("You cannot delete your active account.");
  if (
    entity === "users" &&
    data.bookings.some((b) =>
      [
        b.userId,
        b.bookedBy,
        b.checkedInBy,
        b.foodCollectedBy,
        b.cancellationRequest?.requestedBy,
      ].includes(id),
    )
  )
    throw new Error(
      "This account is referenced by bookings or activity and cannot be deleted.",
    );
  if (entity === "movies" && data.showtimes.some((s) => s.movieId === id))
    throw new Error(
      "Remove unbooked screenings first. Movies with booking history must be kept.",
    );
  if (entity === "locations" && data.showtimes.some((s) => s.locationId === id))
    throw new Error("This cinema has screenings. Set it inactive instead.");
  if (entity === "showtimes" && data.bookings.some((b) => b.showtimeId === id))
    throw new Error("Screenings with booking history cannot be deleted.");
  data[entity] = data[entity].filter((r) => r.id !== id);
  logAdmin(data, actor, "Record deleted", entity, id);
}
export function decideCancellation(data, actorId, id, approve, note) {
  const actor = requireAdmin(data, actorId),
    booking = data.bookings.find((b) => b.id === id);
  if (!booking || booking.cancellationRequest?.status !== "Pending")
    throw new Error("This request has already been handled or is unavailable.");
  note = required(note, "Decision note");
  if (note.length > 500)
    throw new Error("Keep the note within 500 characters.");
  const now = new Date();
  booking.cancellationRequest = {
    ...booking.cancellationRequest,
    status: approve ? "Approved" : "Rejected",
    reviewedBy: actor.id,
    reviewedByName: actor.name,
    reviewedAt: now.toISOString(),
    reviewNote: note,
  };
  if (approve) {
    booking.status = "Cancelled";
    booking.refundStatus = booking.demo
      ? "Demo cancellation - no charge"
      : "Review required - no automatic refund";
  }
  recordActivity(
    booking,
    actor,
    approve ? "Cancellation approved" : "Cancellation rejected",
    now,
    note,
  );
  logAdmin(
    data,
    actor,
    approve ? "Cancellation approved" : "Cancellation rejected",
    "bookings",
    id,
  );
}
