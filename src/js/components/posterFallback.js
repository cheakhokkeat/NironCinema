export const fallbackPoster = new URL(
  "../../assets/poster-fallback.svg",
  import.meta.url,
).href;
if (typeof document !== "undefined") {
  const selector =
    "img[data-movie-poster], .booking-movie img, .ticket-main>img, .staff-poster img, .food-art img";
  function fallback(img) {
    if (img.matches(".food-art img")) {
      const icon = document.createElement("i");
      icon.className = "fa-solid fa-utensils";
      icon.setAttribute("aria-hidden", "true");
      const art = img.closest(".food-art");
      if (!art) return;
      art.setAttribute("role", "img");
      art.setAttribute("aria-label", img.alt || "Food and drinks");
      art.replaceChildren(icon);
      return;
    }
    if (img.src !== fallbackPoster) img.src = fallbackPoster;
  }
  function inspect(img) {
    if (
      img.matches(selector) &&
      (!img.getAttribute("src") ||
        ["undefined", "null"].includes(img.getAttribute("src")) ||
        (img.complete && img.naturalWidth === 0))
    )
      fallback(img);
  }
  document.addEventListener(
    "error",
    (event) => {
      if (event.target.matches?.(selector)) fallback(event.target);
    },
    true,
  );
  new MutationObserver((records) =>
    records.forEach((record) => {
      if (record.type === "attributes") inspect(record.target);
      record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === "IMG") inspect(node);
          node.querySelectorAll?.(selector).forEach(inspect);
        }
      });
    }),
  ).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });
  document.querySelectorAll(selector).forEach(inspect);
}
