import "./imagePreview.js";
import "./posterFallback.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function movieHeading(movie) {
  return `<div class="staff-movie-heading"><div class="staff-poster"><img data-image-preview="${esc(movie?.title || "Poster")}" role="button" tabindex="0" class="cursor-zoom-in" data-movie-poster src="${esc(movie?.poster || "")}" alt="" loading="lazy"></div><h3>${esc(movie?.title || "Movie unavailable")}</h3></div>`;
}
export function statusBadge(status) {
  const styles = {
    Collected: ["is-checked", "fa-utensils"],
    "Awaiting pickup": ["is-pending", "fa-utensils"],
    Confirmed: ["is-open", "fa-circle-check"],
    Active: ["is-open", "fa-circle-check"],
    Approved: ["is-open", "fa-check-double"],
    Pending: ["is-pending", "fa-clock"],
    Cancelled: ["is-closed", "fa-circle-xmark"],
    Inactive: ["is-closed", "fa-ban"],
    Rejected: ["is-closed", "fa-circle-xmark"],
    "Checked in": ["is-checked", "fa-ticket"],
    user: ["is-checked", "fa-user"],
    staff: ["is-pending", "fa-id-badge"],
    admin: ["is-admin", "fa-user-shield"],
  };
  const [tone, icon] = styles[status] || ["is-neutral", "fa-circle-info"];
  return `<span class="screening-availability booking-status ${tone}"><i class="fa-solid ${icon}" aria-hidden="true"></i>${esc(status)}</span>`;
}
