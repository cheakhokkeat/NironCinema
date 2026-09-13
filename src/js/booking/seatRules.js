export const seatRows = "ABCDEFGH".split("");
export const seatIds = seatRows.flatMap((row) =>
  Array.from({ length: 10 }, (_, i) => `${row}${i + 1}`),
);
export function seatPrice(seat, base, layout) {
  return (
    Number(base) + ((layout?.premiumRows || "GH").includes(seat[0]) ? 2 : 0)
  );
}
export function occupiedSeats(data, showId) {
  return new Set(
    data.bookings
      .filter(
        (b) =>
          b.showtimeId === showId &&
          ["Confirmed", "Pending"].includes(b.status),
      )
      .flatMap((b) => b.seats || []),
  );
}
export function hasSeatGap(selected, occupied, layout) {
  const rows = layout?.rows || seatRows,
    columns = layout?.columns || 10;
  const blocked = new Set([...occupied, ...selected]);
  return rows.some((row) => {
    if (![...selected].some((seat) => seat.startsWith(row))) return false;
    return Array.from({ length: columns }, (_, i) => i + 1).some((number) => {
      const seat = `${row}${number}`;
      if (blocked.has(seat)) return false;
      const left = number === 1 || blocked.has(`${row}${number - 1}`);
      const right = number === columns || blocked.has(`${row}${number + 1}`);
      const existed =
        (number === 1 || occupied.has(`${row}${number - 1}`)) &&
        (number === columns || occupied.has(`${row}${number + 1}`));
      return left && right && !existed;
    });
  });
}
