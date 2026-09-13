// Existing screenings without seatLayout retain the original 80 seats.
export const seatLayouts = {
  Standard: {
    rows: "ABCDEFGH",
    columns: 10,
    premiumRows: "GH",
    label: "Standard",
  },
  "3D": {
    rows: "ABCDEFG",
    columns: 10,
    premiumRows: "FG",
    label: "3D comfort",
  },
  IMAX: {
    rows: "ABCDEFGHIJ",
    columns: 12,
    premiumRows: "IJ",
    label: "IMAX auditorium",
  },
  "4DX": {
    rows: "ABCDEF",
    columns: 8,
    premiumRows: "EF",
    label: "4DX motion seats",
  },
};
export function layoutFor(show) {
  const preset = seatLayouts[show?.seatLayout] || seatLayouts.Standard;
  const rows = preset.rows.split("");
  return {
    ...preset,
    rows,
    ids: rows.flatMap((row) =>
      Array.from({ length: preset.columns }, (_, i) => `${row}${i + 1}`),
    ),
  };
}
export function ensureSeatLayouts(data) {
  let changed = false;
  const booked = new Set((data.bookings || []).map((b) => b.showtimeId));
  for (const show of data.showtimes || []) {
    if (!show.id || show.seatLayout) continue;
    show.seatLayout = booked.has(show.id)
      ? "Standard"
      : seatLayouts[show.format]
        ? show.format
        : "Standard";
    changed = true;
  }
  return changed;
}
