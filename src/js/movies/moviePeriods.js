import { filterMovies } from "./movieFilters.js";

export function initMoviePeriods(data, onChange, query = "") {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const days = new Set();
  const showingIds = new Set(
    filterMovies(data.movies, "now-showing", today, { query }).map(
      (movie) => movie.id,
    ),
  );
  data.showtimes.forEach((show) => {
    if (
      showingIds.has(show.movieId) &&
      /^\d{4}-\d{2}-\d{2}$/.test(show.date) &&
      show.date >= dateKey(today)
    )
      days.add(show.date);
  });
  const months = new Set();
  filterMovies(data.movies, "upcoming", today, { query }).forEach((movie) => {
    const value = String(movie.release).trim();
    const release = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value + "T00:00:00")
      : new Date(value);
    months.add(dateKey(release).slice(0, 7));
  });
  const dayCards = [...days].sort().map((value) => {
    const date = new Date(`${value}T00:00:00`);
    return {
      value,
      top:
        value === dateKey(today)
          ? "Today"
          : date.toLocaleDateString("en-US", { weekday: "short" }),
      main: date.getDate(),
      bottom: date.toLocaleDateString("en-US", { month: "short" }),
      label: date.toLocaleDateString("en-US", { dateStyle: "full" }),
    };
  });
  const monthCards = [...months].sort().map((value) => {
    const date = new Date(`${value}-01T00:00:00`);
    return {
      value,
      top: "",
      main: date.toLocaleDateString("en-US", { month: "short" }),
      bottom: "",
      label: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  });
  for (const [id, cards, allLabel] of [
    ["showingDate", dayCards, "All days"],
    ["upcomingMonth", monthCards, "All months"],
  ]) {
    const input = document.getElementById(id);
    const row = document.getElementById(`${id}Cards`);
    if (!cards.some((card) => card.value === input.value)) input.value = "";
    row.parentElement.classList.toggle("period-empty", cards.length === 0);
    const options = [
      {
        value: "",
        top: id === "showingDate" ? "Browse" : "",
        main: "All",
        bottom: id === "showingDate" ? "days" : "",
        label: allLabel,
      },
      ...cards,
    ];
    row.innerHTML = options
      .map(
        (card) =>
          `<button type="button" class="movie-period-card" data-period="${card.value}" aria-label="${card.label}" aria-controls="movie-container" aria-pressed="${card.value === input.value}">${card.top ? `<span class="period-caption">${card.top}</span>` : ""}<span class="period-value">${card.main}</span>${card.bottom ? `<span class="period-caption">${card.bottom}</span>` : ""}</button>`,
      )
      .join("");
    row.onclick = (event) => {
      const button = event.target.closest("[data-period]");
      if (!button) return;
      input.value = button.dataset.period;
      row
        .querySelectorAll("[data-period]")
        .forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
      const value = button.dataset.period;
      onChange();
      [...row.querySelectorAll("[data-period]")]
        .find((item) => item.dataset.period === value)
        ?.focus({ preventScroll: true });
    };
  }
}
