import { digitalTicket } from "../tickets/digitalTicket.js";
import { getData } from "../data/storage.js";
import { signedInUser, requestAccess } from "../auth/access.js";
import { showTicketPreview } from "../tickets/ticketActions.js";
const user = signedInUser();
if (!user) requestAccess("./tickets.html");
else {
  const data = getData();
  const main = document.getElementById("pageContent");
  main.innerHTML =
    '<h1 class="mb-6 font-cyber text-2xl font-bold">My tickets</h1><div class="grid gap-4 sm:grid-cols-2" id="ticketList"></div>';
  const bookings = data.bookings.filter(
    (booking) => booking.userId === user.id,
  );
  const list = document.getElementById("ticketList");
  if (!bookings.length) list.textContent = "You have no tickets yet.";
  list.innerHTML =
    bookings.map((booking) => digitalTicket(booking, data)).join("") ||
    "You have no tickets yet.";
  list.querySelectorAll(".ticket-cut-guide").forEach((card, index) => {
    const booking = bookings[index];
    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "ticket-preview-open";
    preview.setAttribute(
      "aria-label",
      `Preview full-color poster ticket, seats ${booking.seats.join(", ")}`,
    );
    preview.addEventListener("click", () =>
      showTicketPreview(booking, getData()),
    );
    card.append(preview);
  });
}
