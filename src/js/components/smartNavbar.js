import { initNotifications } from "./notifications.js";
import { initTicketActions } from "../tickets/ticketActions.js";
initNotifications();
initTicketActions();
const header = document.querySelector("[data-smart-header]");

// Match navigation to the current page/section, including browser back and forward.
const bottomLinks = [...document.querySelectorAll("[data-bottom-nav] a")];
const menuLinks = [...document.querySelectorAll("#mobileMenu a[href]")];
const searchToggle = document.getElementById("mobileSearchToggle");
function updateNavigation() {
  const page = window.location.pathname.replace(/\/$/, "/index.html");
  const hash = window.location.hash;
  const searching = searchToggle?.getAttribute("aria-expanded") === "true";
  for (const links of [bottomLinks, menuLinks]) {
    let selected = false;
    links.forEach((link) => {
      const target = new URL(link.getAttribute("href"), window.location.href);
      const category =
        new URLSearchParams(window.location.search).get("category") ||
        "now-showing";
      const matchesCategory =
        !link.dataset.movieFilter || link.dataset.movieFilter === category;
      const active =
        !searching &&
        !selected &&
        matchesCategory &&
        target.pathname === page &&
        target.hash === hash;
      if (active) selected = true;
      link.classList.remove("bg-nironBlue/10", "bg-nironBlue/20", "text-white");
      link.classList.toggle("bg-nironBlue/15", active);
      link.classList.toggle("text-nironBlue", active);
      link.classList.toggle("text-gray-400", !active);
      if (active) link.setAttribute("aria-current", hash ? "location" : "page");
      else link.removeAttribute("aria-current");
    });
  }
}
window.addEventListener("hashchange", updateNavigation);
window.addEventListener("popstate", updateNavigation);
if (searchToggle) {
  new MutationObserver(updateNavigation).observe(searchToggle, {
    attributes: true,
    attributeFilter: ["aria-expanded"],
  });
}
updateNavigation();

if (header) {
  let previousY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const currentY = Math.max(window.scrollY, 0);
    const scrollingDown = currentY > previousY;
    const movedEnough = Math.abs(currentY - previousY) > 4;

    if (currentY < 60) {
      header.classList.remove("-translate-y-full");
    } else if (movedEnough && scrollingDown) {
      header.classList.add("-translate-y-full");
    } else if (movedEnough) {
      header.classList.remove("-translate-y-full");
    }

    previousY = currentY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true },
  );
}
