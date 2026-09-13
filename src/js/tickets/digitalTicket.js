import "../components/imagePreview.js";
import "../components/posterFallback.js";
import { formatTime } from "../utils/formatTime.js";
const esc = (v = "") =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function digitalTicket(booking, data) {
  const show = data.showtimes.find((s) => s.id === booking.showtimeId);
  const movie = data.movies.find((m) => m.id === show?.movieId);
  const cinema = data.locations.find((c) => c.id === show?.locationId);
  return `<div class="ticket-cut-guide">
  <article class="digital-ticket">
    <div class="ticket-brand">
      <strong class="ticket-header-brand">
        <b class="ticket-logo-icon">N</b>
        NIRON<span>CINEMA</span>
      </strong>

      <span>
        ${booking.demo ? "DEMO TICKET" : "DIGITAL TICKET"}
      </span>
    </div>

    <div class="ticket-main">
      <img data-image-preview="${esc(movie?.title || "Movie poster")}" role="button" tabindex="0" src="${esc(movie?.poster || "")}" alt="">

      <div>
        <p class="ticket-eyebrow">
          ${esc(booking.status)}
        </p>

        <h2>
          ${esc(movie?.title || "Movie unavailable")}
        </h2>

        <p>
          ${esc(cinema?.name || "Cinema unavailable")}
        </p>

        <div class="ticket-facts">
          <div>
            <small>DATE</small>
            <strong>${esc(show?.date)}</strong>
          </div>

          <div>
            <small>TIME</small>
            <strong>${esc(formatTime(show?.time))}</strong>
          </div>

          <div>
            <small>HALL</small>
            <strong>${esc(show?.hall)}</strong>
          </div>

          <div>
            <small>FORMAT</small>
            <strong>${esc(show?.format || "2D")}</strong>
          </div>

          <div class="col-span-2">
            <small>SEATS</small>
            <strong>${esc(booking.seats.join(", "))}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="ticket-stub">
      <div>
        <p>
          ${
            (booking.food || [])
              .map((item) => `${esc(item.name)} × ${item.quantity}`)
              .join(" · ") || "No food & drinks"
          }
        </p>

        <strong>
          Total $${Number(booking.total).toFixed(2)}
        </strong>

        <small>
          ${
            booking.demo
              ? "Demo payment · not valid for admission"
              : esc(booking.status)
          }
        </small>
      </div>

      <code>
        ${esc(booking.id)}
      </code>

      <button
        type="button"
        data-print-ticket="${esc(booking.id)}"
        class="ticket-print-button"
      >
        <i class="fa-solid fa-print" aria-hidden="true"></i>
        Print ticket
      </button>

      <button
        type="button"
        data-share-ticket="${esc(booking.id)}"
        class="ticket-print-button"
      >
        <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
        Share
      </button>

      <button
        type="button"
        data-save-ticket="${esc(booking.id)}"
        class="ticket-print-button"
      >
        <i class="fa-solid fa-download" aria-hidden="true"></i>
        Save ticket
      </button>
    </div>
  </article>
</div>
`;
}
