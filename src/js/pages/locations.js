import "../components/imagePreview.js";
import { getData } from "../data/storage.js";

const escapeHTML = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
const locations = getData().locations.filter(
  (location) => location.active === "Yes",
);

function renderLocations(query = "") {
  const normalized = query.trim().toLowerCase();
  const results = locations.filter((location) =>
    `${location.name} ${location.address}`.toLowerCase().includes(normalized),
  );
  document.getElementById("locationCount").textContent =
    `${results.length} cinema${results.length === 1 ? "" : "s"} available`;
  document.getElementById("locations-container").innerHTML = results
    .map(
      (location) => `
    <article class="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 transition hover:-translate-y-1 hover:border-nironBlue/60 hover:shadow-[0_0_25px_rgba(0,240,255,.1)]">
      <div class="relative flex h-36 items-center justify-center overflow-hidden bg-linear-to-br from-gray-800 to-gray-950"><div class="absolute size-32 rounded-full bg-nironBlue/10 blur-2xl"></div><i class="fa-solid fa-building relative text-5xl text-nironBlue/60 transition group-hover:scale-110"></i>${location.image ? `<img src="${escapeHTML(location.image)}" alt="${escapeHTML(location.name)}" data-location-image data-image-preview="${escapeHTML(location.name)}" role="button" tabindex="0" class="absolute inset-0 h-full w-full object-cover" loading="lazy">` : ""}<span class="pointer-events-none absolute right-3 top-3 rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-semibold text-green-400"><i class="fa-solid fa-circle mr-1 text-[6px]"></i>Open</span></div>
      <div class="p-5"><h3 class="font-cyber font-bold group-hover:text-nironBlue">${escapeHTML(location.name)}</h3><div class="mt-4 space-y-3 text-sm text-gray-400"><p class="flex gap-3"><i class="fa-solid fa-location-dot mt-1 w-4 text-nironPink"></i><span>${escapeHTML(location.address)}</span></p><p class="flex gap-3"><i class="fa-solid fa-phone mt-1 w-4 text-nironPink"></i><span>${escapeHTML(location.phone)}</span></p><p class="flex gap-3"><i class="fa-solid fa-clock mt-1 w-4 text-nironPink"></i><span>${escapeHTML(location.hours)}</span></p></div><a href="${escapeHTML(location.mapUrl || "#")}" target="_blank" rel="noopener" class="mt-5 flex w-full items-center justify-center rounded-full border border-nironBlue py-2.5 text-xs font-semibold text-nironBlue transition hover:bg-nironBlue hover:text-nironDark"><i class="fa-solid fa-diamond-turn-right mr-2"></i>Get directions</a></div>
    </article>`,
    )
    .join("");
  document.querySelectorAll("[data-location-image]").forEach((img) => {
    img.addEventListener("error", () => img.remove(), { once: true });
    if (img.complete && !img.naturalWidth) img.remove();
  });
  document
    .getElementById("locations-container")
    .classList.toggle("hidden", results.length === 0);
  document
    .getElementById("locationEmpty")
    .classList.toggle("hidden", results.length > 0);
}

document
  .querySelectorAll("#locationSearch, #mobileLocationSearch")
  .forEach((input) =>
    input.addEventListener("input", (event) => {
      document
        .querySelectorAll("#locationSearch, #mobileLocationSearch")
        .forEach((other) => {
          if (other !== event.target) other.value = event.target.value;
        });
      renderLocations(event.target.value);
    }),
  );

const searchToggle = document.getElementById("mobileSearchToggle");
const searchPanel = document.getElementById("mobileSearchPanel");
const searchInput = document.getElementById("mobileLocationSearch");

function setSearchOpen(open) {
  searchPanel.classList.toggle("hidden", !open);
  searchToggle.setAttribute("aria-expanded", String(open));
  if (open) searchInput.focus();
  else searchToggle.focus();
}

searchToggle.addEventListener("click", () => {
  setSearchOpen(searchPanel.classList.contains("hidden"));
});
document
  .getElementById("mobileSearchClose")
  .addEventListener("click", () => setSearchOpen(false));
searchPanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setSearchOpen(false);
});

renderLocations();
