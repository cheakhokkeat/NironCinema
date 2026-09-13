const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function movieMetadata(movie, showtimes = []) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(movie.release || "")
    ? new Date(movie.release + "T12:00:00")
    : null;
  const release =
    date && !isNaN(date)
      ? date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Coming soon";
  const formats = [
    ...new Set([
      ...(movie.formatProfiles || []).map((p) => p.format),
      ...showtimes
        .filter((show) => show.movieId === movie.id)
        .map((show) => show.format || "2D"),
    ]),
  ];
  return `<div class="mt-3 flex flex-wrap items-center gap-2"><span class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300"><i class="fa-regular fa-calendar" aria-hidden="true"></i><span>${esc(release)}</span></span>${movie.classification ? `<span class="classification-tag inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>${esc(movie.classification)}</span>` : ""}<div class="flex w-full flex-wrap gap-2">${formats.map((format) => `<span class="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200"><i class="fa-solid fa-film" aria-hidden="true"></i>${esc(format)}</span>`).join("")}</div></div>`;
}
