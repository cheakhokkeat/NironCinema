import { getData } from "../data/storage.js";
import { signedInUser, requestAccess } from "../auth/access.js";
import { bookingAlert } from "./bookingAlert.js";

export function initNotifications() {
  const header = document.querySelector("[data-smart-header]");
  if (!header) return;
  let bell = header.querySelector('[aria-label="Notifications"]');
  if (!bell) {
    bell = document.createElement("button");
    bell.type = "button";
    bell.setAttribute("aria-label", "Notifications");
    bell.className = "notification-bell";
    const back = header.querySelector('[title="Back to home"]');
    if (back?.parentElement.hasAttribute("data-header-actions")) {
      back.parentElement.prepend(bell);
    } else if (back) {
      const group = document.createElement("div");
      group.className = "ml-auto flex items-center gap-3";
      back.before(group);
      group.append(bell, back);
    } else header.firstElementChild.append(bell);
  }
  bell.classList.add("notification-bell");
  bell.innerHTML =
    '<i class="fa-solid fa-bell" aria-hidden="true"></i><span class="notification-count" hidden></span>';
  bell.setAttribute("aria-controls", "notificationPanel");
  bell.setAttribute("aria-expanded", "false");
  const panel = document.createElement("section");
  panel.id = "notificationPanel";
  panel.className = "notification-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Notifications");
  document.body.append(panel);
  function positionPanel() {
    if (panel.hidden) return;
    const rect = bell.getBoundingClientRect();
    const width =
      window.innerWidth < 640
        ? Math.min(300, window.innerWidth - 48)
        : Math.min(360, window.innerWidth - 24);
    const left = Math.max(
      12,
      Math.min(rect.right - width, window.innerWidth - width - 12),
    );
    const top = rect.bottom + 10;
    panel.style.width = `${width}px`;
    panel.style.left = `${left}px`;
    panel.style.right = "auto";
    panel.style.top = `${top}px`;
    panel.style.maxHeight = `${Math.max(80, window.innerHeight - top - 12)}px`;
    panel.style.setProperty(
      "--notification-arrow",
      `${Math.max(18, Math.min(width - 18, rect.left + rect.width / 2 - left))}px`,
    );
  }
  function clearedIds(userId) {
    try {
      const ids = JSON.parse(
        localStorage.getItem(`nironNotificationsCleared_${userId}`) || "[]",
      );
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }
  function records() {
    const user = signedInUser();
    const cleared = clearedIds(user?.id);
    return user
      ? [...getData().bookings, ...(getData().foodOrders || [])]
          .filter(
            (b) =>
              b.userId === user.id &&
              b.status === "Confirmed" &&
              !cleared.includes(b.id),
          )
          .slice()
          .reverse()
      : [];
  }
  function readIds() {
    try {
      return JSON.parse(
        localStorage.getItem(`nironNotifications_${signedInUser()?.id}`) ||
          "[]",
      );
    } catch {
      return [];
    }
  }
  function refresh() {
    const unread = records().filter((b) => !readIds().includes(b.id)).length;
    const badge = bell.querySelector(".notification-count");
    badge.hidden = !unread;
    badge.textContent = unread > 9 ? "9+" : String(unread);
    bell.setAttribute(
      "aria-label",
      `Notifications${unread ? `, ${unread} unread` : ""}`,
    );
  }
  bell.addEventListener("click", () => {
    const user = signedInUser();
    if (!user) {
      requestAccess("./tickets.html");
      return;
    }
    panel.hidden = !panel.hidden;
    bell.setAttribute("aria-expanded", String(!panel.hidden));
    if (panel.hidden) return;
    document.getElementById("mobileMenu")?.classList.add("hidden");
    document.getElementById("userDropdown")?.classList.add("hidden");
    panel.innerHTML =
      '<div class="notification-heading"><h2>Your notifications</h2><button type="button" class="notification-close" aria-label="Close notifications"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>';
    panel.querySelector(".notification-close").addEventListener("click", () => {
      close();
      bell.focus();
    });
    const bookings = records(),
      data = getData();
    if (bookings.length) {
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "notification-clear";
      clearButton.innerHTML =
        '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Clear all';
      clearButton.addEventListener("click", () => {
        if (signedInUser()?.id !== user.id) {
          close();
          return;
        }
        try {
          localStorage.setItem(
            `nironNotificationsCleared_${user.id}`,
            JSON.stringify([
              ...new Set([
                ...clearedIds(user.id),
                ...bookings.map((b) => b.id),
              ]),
            ]),
          );
          panel.querySelectorAll("a").forEach((link) => link.remove());
          clearButton.remove();
          const empty = document.createElement("p");
          empty.textContent = "No notifications yet.";
          panel.append(empty);
          refresh();
          positionPanel();
          panel.querySelector(".notification-close").focus();
          void bookingAlert(
            "Notifications cleared",
            "Your notification list has been cleared.",
            { success: true },
          );
        } catch {
          void bookingAlert(
            "Could not clear notifications",
            "Please try again.",
            { confirm: "OK", required: true },
          );
        }
      });
      panel.append(clearButton);
    }
    if (!bookings.length) {
      const empty = document.createElement("p");
      empty.textContent = "No notifications yet.";
      panel.append(empty);
    }
    bookings.forEach((booking) => {
      const show = data.showtimes.find((s) => s.id === booking.showtimeId),
        movie = data.movies.find((m) => m.id === show?.movieId);
      const link = document.createElement("a");
      link.href = booking.type === "food" ? "./food.html" : "./tickets.html";
      const title = document.createElement("strong");
      title.textContent =
        booking.type === "food" ? "Food order complete" : "Booking complete";
      const text = document.createElement("span");
      text.textContent =
        booking.type === "food"
          ? `Food & drinks / ${booking.foodCollectedAt ? "Collected" : "Awaiting pickup"}. View your order.`
          : `${movie?.title || "Your movie"} · Seats ${(booking.seats || []).join(", ")}. Your digital ticket is ready.`;
      link.append(title, text);
      panel.append(link);
    });
    const clearAction = panel.querySelector(".notification-clear");
    if (clearAction) panel.append(clearAction);
    positionPanel();
    localStorage.setItem(
      `nironNotifications_${user.id}`,
      JSON.stringify(bookings.map((b) => b.id)),
    );
    refresh();
  });
  const close = () => {
    panel.hidden = true;
    bell.setAttribute("aria-expanded", "false");
  };
  window.addEventListener("resize", positionPanel);
  window.addEventListener("scroll", close, { passive: true });
  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && !bell.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      close();
      bell.focus();
    }
  });
  window.addEventListener("booking-complete", refresh);
  window.addEventListener("auth-changed", () => {
    close();
    refresh();
  });
  window.addEventListener("storage", () => {
    close();
    refresh();
  });
  refresh();
}
