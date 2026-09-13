export function initHeaderBrand(brand) {
  if (!brand || brand.dataset.reloadBrand) return;
  brand.dataset.reloadBrand = "true";
  brand.className = "cinema-brand flex shrink-0 items-center gap-2";
  brand.setAttribute("aria-label", "NironCinema - refresh this page");
  brand.innerHTML =
    '<span class="flex size-8 items-center justify-center rounded bg-linear-to-tr from-nironBlue to-nironPink font-cyber text-xl font-bold text-black shadow-[0_0_15px_rgba(0,240,255,.4)]">N</span><span class="font-cyber text-lg font-extrabold tracking-wider sm:text-xl">NIRON<span class="text-nironBlue">CINEMA</span></span>';
  brand.href = location.href;
  brand.addEventListener("click", (event) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    location.reload();
  });
}

document.querySelectorAll("header .cinema-brand").forEach(initHeaderBrand);
