import { movieMetadata } from "../components/movieMetadata.js";
import "../components/posterFallback.js";
// 1. Import statements must always be at the very top of the file
import { getData } from "../data/storage.js";
import { filterMovies, isAdvanceMovie } from "../movies/movieFilters.js";
import { initMoviePeriods } from "../movies/moviePeriods.js";
import { paginate } from "../utils/pagination.js";
let moviePage = 1;
let lastMovieFilter = "";

function currentMovieCategory() {
  const category = new URLSearchParams(window.location.search).get("category");
  return ["new", "upcoming", "all"].includes(category)
    ? category
    : "now-showing";
}

const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );

function renderManagedContent() {
  const data = getData();
  const adsContainer = document.getElementById("ads-container");
  const locationsContainer = document.getElementById("locations-container");
  const activeAds = data.ads.filter((ad) => ad.active === "Yes");
  const activeLocations = data.locations.filter(
    (location) => location.active === "Yes",
  );

  if (adsContainer) {
    adsContainer.innerHTML = `<div class="relative min-h-72 overflow-hidden rounded-xl border border-nironBlue/30 bg-gray-900 shadow-2xl md:min-h-96">
      ${activeAds.map((ad, index) => `<article data-ad-slide class="absolute inset-0 flex items-center transition-all duration-700 ${index ? "pointer-events-none translate-x-8 opacity-0" : "translate-x-0 opacity-100"}"><img src="${escapeHTML(ad.image)}" alt="" class="absolute inset-0 size-full object-cover"><div class="absolute inset-0 bg-linear-to-r from-nironDark via-nironDark/85 to-nironDark/10"></div><div class="relative z-10 max-w-2xl space-y-3 p-7 md:p-12"><span class="text-xs font-bold uppercase tracking-[.2em] text-nironPink"><i class="fa-solid fa-star mr-2"></i>${escapeHTML(ad.label)}</span><h2 class="font-cyber text-3xl font-extrabold md:text-5xl">${escapeHTML(ad.title)}</h2><p class="max-w-lg text-sm text-gray-200 md:text-base">${escapeHTML(ad.subtitle)}</p><a href="${escapeHTML(ad.link || "#movies")}" class="inline-flex items-center gap-2 rounded-full bg-nironPink px-5 py-2.5 text-sm font-semibold shadow-[0_0_15px_rgba(255,0,127,.4)]"><i class="fa-solid fa-ticket"></i>Explore now</a></div></article>`).join("")}
      ${activeAds.length > 1 ? `<button data-ad-prev aria-label="Previous advertisement" class="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white/50 backdrop-blur-sm transition hover:bg-black/30 hover:border-nironBlue/50 hover:text-nironBlue"><i class="fa-solid fa-chevron-left"></i></button><button data-ad-next aria-label="Next advertisement" class="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white/50 backdrop-blur-sm transition hover:bg-black/30 hover:border-nironBlue/50 hover:text-nironBlue"><i class="fa-solid fa-chevron-right"></i></button><div class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">${activeAds.map((_, index) => `<button data-ad-dot="${index}" aria-label="Show advertisement ${index + 1}" class="h-1.5 rounded-full transition-all ${index ? "w-2 bg-white/40" : "w-7 bg-nironBlue"}"></button>`).join("")}</div>` : ""}
    </div>`;
    if (activeAds.length > 1) {
      const slides = [...adsContainer.querySelectorAll("[data-ad-slide]")],
        dots = [...adsContainer.querySelectorAll("[data-ad-dot]")];
      let current = 0;
      const show = (next) => {
        current = (next + slides.length) % slides.length;
        slides.forEach((slide, index) => {
          const active = index === current;
          slide.classList.toggle("opacity-0", !active);
          slide.classList.toggle("translate-x-8", !active);
          slide.classList.toggle("pointer-events-none", !active);
          slide.classList.toggle("opacity-100", active);
          slide.classList.toggle("translate-x-0", active);
        });
        dots.forEach((dot, index) => {
          dot.classList.toggle("w-7", index === current);
          dot.classList.toggle("bg-nironBlue", index === current);
          dot.classList.toggle("w-2", index !== current);
          dot.classList.toggle("bg-white/40", index !== current);
        });
      };
      let timer = setInterval(() => show(current + 1), 5500);
      const reset = () => {
        clearInterval(timer);
        timer = setInterval(() => show(current + 1), 5500);
      };
      adsContainer
        .querySelector("[data-ad-prev]")
        .addEventListener("click", () => {
          show(current - 1);
          reset();
        });
      adsContainer
        .querySelector("[data-ad-next]")
        .addEventListener("click", () => {
          show(current + 1);
          reset();
        });
      dots.forEach((dot) =>
        dot.addEventListener("click", () => {
          show(Number(dot.dataset.adDot));
          reset();
        }),
      );
    }
  }

  if (locationsContainer) {
    locationsContainer.innerHTML = activeLocations
      .map(
        (location) => `
      <article class="rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-nironBlue/50">
        <div class="mb-4 flex size-10 items-center justify-center rounded-full bg-nironBlue/15 text-nironBlue"><i class="fa-solid fa-location-dot"></i></div>
        <h3 class="font-cyber font-bold">${escapeHTML(location.name)}</h3>
        <p class="mt-2 text-sm text-gray-400"><i class="fa-solid fa-map-pin mr-2 text-nironPink"></i>${escapeHTML(location.address)}</p>
        <p class="mt-2 text-sm text-gray-400"><i class="fa-solid fa-phone mr-2 text-nironPink"></i>${escapeHTML(location.phone)}</p>
        <p class="mt-2 text-sm text-gray-400"><i class="fa-solid fa-clock mr-2 text-nironPink"></i>${escapeHTML(location.hours)}</p>
        <a href="${escapeHTML(location.mapUrl || "#")}" target="_blank" rel="noopener" class="mt-4 inline-block text-sm font-semibold text-nironBlue">Open map <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></a>
      </article>`,
      )
      .join("");
  }
}

// 2. Define the render function (it can sit outside)
function renderMovies() {
  const container = document.getElementById("movie-container");

  // Guard clause: stop if the container doesn't exist on this page
  if (!container) return;

  container.innerHTML = "";

  // Render the latest shared data, including changes made in the admin panel.
  const category = currentMovieCategory();
  const data = getData();
  initMoviePeriods(
    data,
    renderMovies,
    document.getElementById("desktopMovieSearch").value,
  );
  const movies = filterMovies(data.movies, category, new Date(), {
    query: document.getElementById("desktopMovieSearch").value,
    date: document.getElementById("showingDate").value,
    month: document.getElementById("upcomingMonth").value,
    showtimes: data.showtimes,
  });
  document
    .getElementById("showingDateFilter")
    .classList.toggle("hidden", category !== "now-showing");
  document
    .getElementById("upcomingMonthFilter")
    .classList.toggle("hidden", category !== "upcoming");
  document
    .getElementById("movieEmpty")
    .classList.toggle("hidden", movies.length > 0);
  document.getElementById("movieCount").textContent =
    `${movies.length} movie${movies.length === 1 ? "" : "s"}`;
  document.querySelectorAll(".movie-filter").forEach((button) => {
    const active = button.dataset.movieFilter === category;
    button.setAttribute("aria-pressed", String(active));
  });
  const filterKey = JSON.stringify([
    category,
    document.getElementById("desktopMovieSearch").value,
    document.getElementById("showingDate").value,
    document.getElementById("upcomingMonth").value,
  ]);
  if (filterKey !== lastMovieFilter) moviePage = 1;
  lastMovieFilter = filterKey;
  const pagination = paginate(movies, moviePage);
  moviePage = pagination.page;
  const pager = document.getElementById("moviePagination");
  pager.classList.toggle("hidden", pagination.pages <= 1);
  pager.innerHTML = `<button type="button" data-movie-page="${moviePage - 1}" ${moviePage === 1 ? "disabled" : ""} aria-label="Previous movie page">&lsaquo;</button>${Array.from({ length: pagination.pages }, (_, index) => `<button type="button" data-movie-page="${index + 1}" ${moviePage === index + 1 ? 'aria-current="page"' : ""} aria-label="Movie page ${index + 1}">${index + 1}</button>`).join("")}<button type="button" data-movie-page="${moviePage + 1}" ${moviePage === pagination.pages ? "disabled" : ""} aria-label="Next movie page">&rsaquo;</button>`;
  pagination.items.forEach((movie) => {
    const formattedGenre = (movie.genre || "").split(";").join(", ");

    const cardHTML = `
      <a href="./movie.html?id=${encodeURIComponent(movie.id)}"
        data-movie-id="${movie.id}"
        class="movie-card bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden
               hover:border-nironBlue/50 transition duration-300 group cursor-pointer">

        <div class="bg-gray-800 relative overflow-hidden">
          ${isAdvanceMovie(movie) ? '<span class="advance-ticket-ribbon">Advance Ticket</span>' : ""}
          <div class="absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-transparent z-10">
          </div>
          <!-- Movie Poster -->
          <div
            class="aspect-2/3 w-full flex items-center justify-center text-gray-600
                   bg-gray-800 overflow-hidden group-hover:scale-105 transition duration-300">

            <img
              class="w-full h-full object-cover"
              data-movie-poster src="${movie.poster}"
              alt="${movie.title || "N/A"}">
          </div>
          <!-- Classification -->
          <span
            class="absolute top-3 right-3 z-20 bg-nironDark/80 backdrop-blur
                   classification-tag text-xs font-bold px-2 py-1 rounded
                   border border-nironBlue/30">
            ${movie.classification || "N/A"}
          </span>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <h4 class="font-bold text-base group-hover:text-nironBlue transition duration-300">
              ${movie.title || "N/A"}
            </h4>
            <p class="text-xs text-gray-400 px-0.5">
              ${formattedGenre}
            </p>
            <p class="text-xs text-gray-400 px-0.5">
              ${movie.duration || "N/A"}
            </p>
          </div>
          ${movieMetadata(movie, data.showtimes)}
        </div>
      </a>
    `;

    container.innerHTML += cardHTML;
  });
}

// 3. Run everything safely when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Call your render function now that the DOM elements exist
  renderMovies();
  renderManagedContent();
  document
    .getElementById("moviePagination")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-movie-page]");
      if (!button || button.disabled) return;
      moviePage = Number(button.dataset.moviePage);
      renderMovies();
      document.getElementById("movies").scrollIntoView({ behavior: "smooth" });
      document
        .querySelector(`[data-movie-page="${moviePage}"][aria-current]`)
        ?.focus({ preventScroll: true });
    });
  const movieSearches = document.querySelectorAll("[data-movie-search]");
  movieSearches.forEach((input) => {
    input.addEventListener("input", () => {
      movieSearches.forEach((other) => {
        if (other !== input) other.value = input.value;
      });
      renderMovies();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document
          .getElementById("movies")
          .scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  const searchToggle = document.getElementById("mobileSearchToggle");
  const searchPanel = document.getElementById("mobileSearchPanel");
  const searchInput = document.getElementById("mobileSearchInput");
  const closeSearch = () => {
    searchPanel.classList.add("hidden");
    searchToggle.setAttribute("aria-expanded", "false");
    searchToggle.focus();
  };

  searchToggle.addEventListener("click", () => {
    const opening = searchPanel.classList.contains("hidden");
    searchPanel.classList.toggle("hidden", !opening);
    searchToggle.setAttribute("aria-expanded", String(opening));
    document.getElementById("mobileMenu").classList.add("hidden");
    if (opening) searchInput.focus();
    else searchToggle.focus();
  });
  document
    .getElementById("mobileSearchClose")
    .addEventListener("click", closeSearch);
  searchPanel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSearch();
  });

  // Active Link Highlighting Logic
  const nav_color = document.querySelectorAll(".nav-active");
  nav_color.forEach((link) => {
    link.addEventListener("click", (e) => {
      nav_color.forEach((item) => {
        item.classList.remove("text-nironBlue", "bg-nironBlue/15");
      });
      link.classList.add("text-nironBlue", "bg-nironBlue/15");
    });
  });

  document.querySelectorAll("[data-movie-filter]").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.set("category", control.dataset.movieFilter);
      url.hash = "movies";
      window.history.pushState({}, "", url);
      renderMovies();
      document.getElementById("mobileMenu").classList.add("hidden");
      document.getElementById("movies").scrollIntoView({ behavior: "smooth" });
      window.dispatchEvent(new Event("hashchange"));
    });
  });
  window.addEventListener("popstate", renderMovies);

  // Active for Auth modal
  const auth_selected = document.querySelectorAll(".auth-selected");
  auth_selected.forEach((link) => {
    link.addEventListener("click", (e) => {
      // Remove active styles from all
      auth_selected.forEach((item) => {
        item.classList.remove("text-nironBlue");
      });

      // Add active styles to the clicked
      link.classList.add("text-nironBlue");
    });
  });
});
