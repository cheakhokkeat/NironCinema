import "../components/imagePreview.js";
import { screeningFormat } from "../components/screeningFormat.js";
import "../components/posterFallback.js";
import { formatTime } from "../utils/formatTime.js";
import { startSeatBooking, resumeSeatBooking } from "../booking/seatBooking.js";
import { enhanceSelect } from "../components/selectMenu.js";
import { getData } from "../data/storage.js";
import { signedInUser, requestAccess } from "../auth/access.js";
import { isAdvanceMovie } from "../movies/movieFilters.js";

const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const id = new URLSearchParams(location.search).get("id");
const target = `./movie.html?id=${encodeURIComponent(id || "")}`;
const main = document.getElementById("pageContent");
if (!signedInUser()) {
  requestAccess(target);
} else {
  const data = getData();
  const movie = data.movies.find((item) => item.id === id);
  if (!movie) {
    main.innerHTML =
      '<h1 class="font-cyber text-2xl">Movie not found</h1><a href="./index.html#movies" class="mt-5 inline-block text-nironBlue">Explore movies</a>';
  } else {
    document.title = `${movie.title} | NironCinema`;
    const cinemas = data.locations.filter((cinema) => cinema.active === "Yes");
    const validLocations = new Set(cinemas.map((cinema) => cinema.id));
    const shows = data.showtimes
      .filter(
        (show) =>
          show.movieId === movie.id &&
          validLocations.has(show.locationId) &&
          new Date(`${show.date}T${show.time}`) >= new Date(),
      )
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
    const details = movie.movie_details || {};
    main.innerHTML = `
      <a href="./index.html#movies" class="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-nironBlue"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Back to movies</a>
      <section class="grid items-center gap-6 sm:grid-cols-[180px_1fr] md:gap-10">
        <div class="relative mx-auto w-40 overflow-hidden rounded-2xl border border-nironBlue/20 sm:w-full"><img data-image-preview="${esc(movie.title)}" role="button" tabindex="0" data-movie-poster src="${esc(movie.poster)}" alt="${esc(movie.title)} poster" class="aspect-2/3 w-full object-cover">${isAdvanceMovie(movie) ? '<span class="advance-ticket-ribbon">Advance Ticket</span>' : ""}</div>
        <div><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-nironPink">The big screen awaits</p><h1 class="font-cyber text-2xl font-bold sm:text-3xl md:text-4xl">${esc(movie.title)}</h1><p class="mt-4 text-sm text-gray-300">${esc((movie.genre || "").replaceAll(";", " · "))}</p><div class="mt-4 flex flex-wrap gap-3 text-xs text-gray-400"><span>${esc(movie.duration)}</span><span class="classification-tag rounded-lg border px-2 py-1">${esc(movie.classification)}</span><span>Release: ${esc(movie.release)}</span></div>${movie.demo ? '<p class="mt-4 text-xs text-nironPink">Demo screening · sample schedule</p>' : ""}</div>
      </section>
      <ol class="booking-steps" aria-label="Booking progress">${["Showtime", "Choose seat", "Order review", "Checkout"].map((label, i) => `<li class="${i === 0 ? "is-active" : ""}" ${i === 0 ? 'aria-current="step"' : ""}><button type="button" ${i === 0 ? "" : "disabled"}><span><i class="fa-solid ${["fa-calendar-days", "fa-couch", "fa-utensils", "fa-credit-card"][i]}" aria-hidden="true"></i></span>${label}</button></li>`).join("")}</ol>
      <div class="movie-detail-tabs" role="tablist" aria-label="Movie information">
        <button id="showtimeTab" class="movie-filter" role="tab" aria-selected="true" aria-pressed="true" aria-controls="showtimePanel"><i class="fa-solid fa-ticket" aria-hidden="true"></i>Showtime</button>
        <button id="detailTab" class="movie-filter" role="tab" aria-selected="false" aria-pressed="false" aria-controls="detailPanel" tabindex="-1"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>Detail</button>
      </div>
      <section id="showtimePanel" role="tabpanel" aria-labelledby="showtimeTab">
        <div class="mb-4"><label class="text-sm text-gray-300" for="cinemaFilter">Cinema<select id="cinemaFilter"><option value="">All locations</option>${cinemas.map((cinema) => `<option value="${esc(cinema.id)}">${esc(cinema.name)}</option>`).join("")}</select></label></div>
        <div class="mb-6"><h2 class="mb-3 text-sm font-semibold text-gray-300">Choose a day</h2><div id="showDayCards" class="flex gap-2 overflow-x-auto pb-2" aria-label="Screening day"></div></div>
        <div id="cinemaShows" class="space-y-4"></div>
        <div id="showSelection" role="status" class="mt-5 rounded-xl border border-nironBlue/20 bg-nironBlue/5 p-4 text-sm text-gray-300">Choose a showtime to see your selection.</div>
      </section>
      <section id="detailPanel" role="tabpanel" aria-labelledby="detailTab" hidden class="rounded-2xl border border-nironBlue/20 bg-nironDark/80 p-6">
        <h2 class="font-cyber text-xl font-bold">Synopsis</h2><p class="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">${esc(details.synopsis || "A synopsis has not been added for this movie yet.")}</p>
        <dl class="mt-6 grid gap-5 text-sm sm:grid-cols-2">${[
          ["Director", details.director],
          [
            "Cast",
            Array.isArray(details.cast)
              ? details.cast.join(", ")
              : details.cast,
          ],
          ["Language", details.language],
          ["Country", details.country],
        ]
          .map(
            ([label, value]) =>
              `<div><dt class="text-gray-500">${label}</dt><dd class="mt-1 text-gray-200">${esc(value || "Not available")}</dd></div>`,
          )
          .join("")}</dl>
      </section>`;
    const tabs = [...main.querySelectorAll('[role="tab"]')];
    function selectTab(tab) {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
        item.setAttribute("aria-pressed", String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute("aria-controls")).hidden =
          !selected;
      });
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const next =
          tabs[event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index];
        selectTab(next);
        next.focus();
      });
    });
    const cinemaFilter = document.getElementById("cinemaFilter");
    let selectedDay = "",
      selectedShow = "";
    function renderShows() {
      const now = new Date();
      const available = shows.filter(
        (show) =>
          (!cinemaFilter.value || show.locationId === cinemaFilter.value) &&
          new Date(show.date + "T" + show.time) > now,
      );
      const dates = [...new Set(available.map((show) => show.date))];
      if (!dates.includes(selectedDay)) selectedDay = dates[0] || "";
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      document.getElementById("showDayCards").innerHTML = dates
        .map((value) => {
          const day = new Date(value + "T12:00:00");
          return `<button type="button" class="movie-period-card shrink-0" data-day="${value}" aria-controls="cinemaShows" aria-label="${esc(day.toLocaleDateString("en-US", { dateStyle: "full" }))}" aria-pressed="${selectedDay === value}"><span class="period-caption">${value === today ? "Today" : day.toLocaleDateString("en-US", { weekday: "short" })}</span><span class="period-value">${day.getDate()}</span><span class="period-caption">${day.toLocaleDateString("en-US", { month: "short" })}</span></button>`;
        })
        .join("");
      const filtered = available.filter((show) => show.date === selectedDay);
      const root = document.getElementById("cinemaShows");
      const closed = new Set(
        [...root.querySelectorAll("details[data-cinema]")]
          .filter((el) => !el.open)
          .map((el) => el.dataset.cinema),
      );
      root.innerHTML =
        cinemas
          .filter((cinema) =>
            filtered.some((show) => show.locationId === cinema.id),
          )
          .map((cinema) => {
            const groups = new Map();
            filtered
              .filter((show) => show.locationId === cinema.id)
              .forEach((show) => {
                const key = JSON.stringify([
                  show.format || "2D",
                  show.audioLanguage || "",
                  show.subtitleLanguage || "",
                  show.sound || "Standard",
                ]);
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(show);
              });
            return `<details data-cinema="${esc(cinema.id)}" ${closed.has(cinema.id) ? "" : "open"} class="rounded-2xl border border-nironBlue/20 bg-gray-900/40 p-4 sm:p-5"><summary class="cursor-pointer font-semibold text-nironBlue">${esc(cinema.name)}</summary><p class="mt-2 text-xs text-gray-400">${esc(cinema.address)}</p>${[...groups.values()].map((group) => `<section class="mt-5 border-t border-white/10 pt-4">${screeningFormat(group[0])}<div class="showtime-grid">${group.map((show) => `<button type="button" data-showtime="${esc(show.id)}" aria-pressed="${show.id === selectedShow}" aria-label="${esc(formatTime(show.time) + " / " + show.hall + " / " + show.format)}" title="${esc(show.hall)}" class="showtime-card"><strong class="showtime-hour">${esc(formatTime(show.time))}</strong></button>`).join("")}</div></section>`).join("")}</details>`;
          })
          .join("") ||
        '<p class="rounded-xl border border-gray-800 p-8 text-center text-gray-400">No upcoming showtimes for this selection.</p>';
    }
    cinemaFilter.addEventListener("change", () => renderShows());
    document.getElementById("showDayCards").onclick = (event) => {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      selectedDay = button.dataset.day;
      renderShows();
      document
        .querySelector('[data-day="' + selectedDay + '"]')
        .focus({ preventScroll: true });
    };
    document
      .getElementById("cinemaShows")
      .addEventListener("click", (event) => {
        const button = event.target.closest("[data-showtime]");
        if (!button) return;
        if (!signedInUser()) {
          requestAccess(target);
          return;
        }
        const show = shows.find((item) => item.id === button.dataset.showtime);
        if (!show || new Date(`${show.date}T${show.time}`) < new Date()) {
          button.disabled = true;
          return;
        }
        void startSeatBooking(show.id);
      });
    renderShows(true);
    enhanceSelect(cinemaFilter, "fa-location-dot");

    const requestedShow = new URLSearchParams(location.search).get("showtime");
    const directShow = shows.find((show) => show.id === requestedShow);
    if (directShow) void startSeatBooking(directShow.id);
    else resumeSeatBooking(movie.id);
  }
}
