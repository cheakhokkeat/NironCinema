export function matchesBookingStatus(booking, status) {
  if (!status) return true;
  if (status === "cancellation")
    return booking.cancellationRequest?.status === "Pending";
  if (status === "checked")
    return booking.status === "Confirmed" && Boolean(booking.checkedInAt);
  if (status === "awaiting-food")
    return (
      booking.status === "Confirmed" &&
      !booking.foodCollectedAt &&
      (booking.food || []).some((f) => Number(f.quantity) > 0)
    );
  if (status === "collected-food")
    return booking.status === "Confirmed" && Boolean(booking.foodCollectedAt);
  return (
    booking.status === status &&
    (status !== "Confirmed" || !booking.checkedInAt)
  );
}
