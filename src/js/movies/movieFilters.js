export function isAdvanceMovie(movie) {
  return ["advance", "advance ticket"].includes(
    String(movie.type || "")
      .trim()
      .toLowerCase(),
  );
}

export function filterMovies(
  movies,
  category,
  today = new Date(),
  { query = "", date: selectedDay = "", month = "", showtimes = [] } = {},
) {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const recent = new Date(day);
  recent.setDate(recent.getDate() - 30);
  return movies
    .map((movie) => {
      // Parse ISO dates locally so releases do not shift across time zones.
      const value = String(movie.release || "").trim();
      const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
      date.setHours(0, 0, 0, 0);
      return { movie, date };
    })
    .filter(({ movie, date }) => {
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const searchable =
        `${movie.title || ""} ${movie.genre || ""}`.toLowerCase();
      if (!terms.every((term) => searchable.includes(term))) return false;
      if (
        category === "now-showing" &&
        selectedDay &&
        !showtimes.some(
          (show) => show.movieId === movie.id && show.date === selectedDay,
        )
      )
        return false;
      const releaseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (category === "upcoming" && month && releaseMonth !== month)
        return false;
      if (category === "all") return true;
      if (Number.isNaN(date.getTime())) return false;
      if (category === "upcoming") return date > day;
      if (category === "new") return date <= day && date >= recent;
      return date <= day;
    })
    .sort((a, b) =>
      category === "upcoming" ? a.date - b.date : b.date - a.date,
    )
    .map(({ movie }) => movie);
}
