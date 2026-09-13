export function bookingRecipient(data, actorId, identifier = "") {
  const actor = data.users.find((user) => user.id === actorId);
  if (!actor) throw new Error("Please sign in again.");
  if (!["staff", "admin"].includes(actor.role)) return { userId: actor.id };
  const query = String(identifier).trim().toLowerCase();
  if (!query) return { userId: null, bookedBy: actor.id, guestBooking: true };
  const matches = data.users.filter((user) =>
    [user.username, user.email].some((value) => value?.toLowerCase() === query),
  );
  if (matches.length !== 1)
    throw new Error(
      matches.length
        ? "More than one account matches. Please use a unique email."
        : "No account found. Check the username or email, or leave it blank for a walk-in guest.",
    );
  return { userId: matches[0].id, bookedBy: actor.id, guestBooking: false };
}
