import { isStaff } from "./operations.js";
import { recordActivity } from "../src/js/booking/activity.js";
export function requestCancellation(data, actor, id, reason, now = new Date()) {
  if (!isStaff(actor)) throw new Error("Staff access is required.");
  const booking = data.bookings.find((b) => b.id === id);
  if (!booking || !["Confirmed", "Pending"].includes(booking.status))
    throw new Error("This booking cannot be requested for cancellation.");
  if (booking.cancellationRequest?.status === "Pending")
    throw new Error("A cancellation request is already awaiting approval.");
  reason = String(reason || "").trim();
  if (reason.length < 5 || reason.length > 500)
    throw new Error("Enter a reason between 5 and 500 characters.");
  booking.cancellationRequest = {
    status: "Pending",
    reason,
    requestedAt: now.toISOString(),
    requestedBy: actor.id,
    requestedByName: actor.name || actor.username,
  };
  recordActivity(booking, actor, "Cancellation requested", now, reason);
  return booking;
}
