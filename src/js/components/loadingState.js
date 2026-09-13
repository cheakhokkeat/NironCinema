export function loadingState(message = "Getting everything ready") {
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  return `<div class="cinema-loading" role="status" aria-live="polite"><div class="cinema-loading-logo" aria-hidden="true">N</div><strong>NIRON<span>CINEMA</span></strong><p>${escape(message)}</p><div class="cinema-loading-track" aria-hidden="true"></div><div class="cinema-loading-skeleton" aria-hidden="true"><span></span><span></span><span></span></div></div>`;
}
