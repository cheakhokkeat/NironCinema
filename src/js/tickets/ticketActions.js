import { shareTicketFile } from "./shareTicketFile.js";
import { loadingState } from "../components/loadingState.js";
import { getData } from "../data/storage.js";
import { signedInUser } from "../auth/access.js";
import { bookingAlert } from "../components/bookingAlert.js";
import { ticketImage } from "./ticketImage.js";
import { chooseTicketExport } from "./ticketExportOptions.js";
import { ticketPdf } from "./ticketPdf.js";

export function canPrintTicket(user, booking) {
  return Boolean(
    user &&
    booking &&
    (booking.userId === user.id || ["staff", "admin"].includes(user.role)),
  );
}
export async function showTicketPreview(booking, data) {
  if (!canPrintTicket(signedInUser(), booking)) return;
  const dialog = document.createElement("dialog");
  dialog.className = "ticket-complete-dialog";
  dialog.setAttribute("aria-label", "Full-color poster ticket preview");
  dialog.innerHTML =
    '<h2 class="mb-4 text-center font-cyber text-lg font-bold">Poster ticket preview</h2>' +
    loadingState("Preparing your full-color ticket") +
    '<div class="booking-actions mt-4"><button type="button">Close</button></div>';
  let url;
  const close = () => {
    dialog.close();
    dialog.remove();
    if (url) URL.revokeObjectURL(url);
  };
  dialog.querySelector("button").onclick = close;
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  document.body.append(dialog);
  dialog.showModal();
  try {
    const blob = await ticketImage(booking, data, "poster", "full");
    if (!dialog.isConnected) return;
    url = URL.createObjectURL(blob);
    const image = new Image();
    image.src = url;
    image.alt =
      "Full-color NironCinema poster ticket with screening and seat details";
    image.className = "w-full rounded-xl";
    await image.decode();
    if (!dialog.isConnected) return;
    dialog.querySelector('[role="status"]').replaceWith(image);
    const save = document.createElement("button");
    save.type = "button";
    save.className = "booking-primary";
    save.textContent = "Save ticket";
    save.dataset.saveTicket = booking.id;
    dialog.querySelector(".booking-actions").prepend(save);
  } catch {
    const status = dialog.querySelector('[role="status"]');
    if (status)
      status.textContent =
        "Could not prepare the preview. Please close and try again.";
  }
}
export function initTicketActions() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest(
      "[data-print-ticket], [data-share-ticket], [data-save-ticket]",
    );
    if (!button) return;
    const data = getData(),
      booking = data.bookings.find(
        (b) =>
          b.id ===
          (button.dataset.printTicket ||
            button.dataset.shareTicket ||
            button.dataset.saveTicket),
      );
    if (!canPrintTicket(signedInUser(), booking)) return;
    if (button.hasAttribute("data-save-ticket")) {
      const options = await chooseTicketExport();
      if (!options) return;
      const { style, format, color } = options;
      button.disabled = true;
      try {
        const png = await ticketImage(booking, data, style, color);
        const blob = format === "pdf" ? await ticketPdf(png) : png;
        const url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = `NironCinema-${booking.id.replace(/[^a-z0-9_-]/gi, "_")}-${style}-${color}.${format}`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        await bookingAlert(
          "Ticket prepared successfully",
          "Your ticket download has started.",
          { confirm: "Done", required: true, success: true },
        );
      } catch {
        await bookingAlert(
          "Could not save ticket",
          "Please try again or use Print ticket.",
          { confirm: "OK", required: true },
        );
      } finally {
        button.disabled = false;
      }
      return;
    }
    if (button.hasAttribute("data-share-ticket")) {
      const options = await chooseTicketExport("share");
      if (options) await shareTicketFile(booking, data, options);
      return;
    }
    const root = document.createElement("div");
    root.id = "ticketPrintRoot";
    let printUrl;
    try {
      printUrl = URL.createObjectURL(
        await ticketImage(booking, data, "poster"),
      );
      const image = new Image();
      image.src = printUrl;
      image.alt = "NironCinema printable ticket";
      image.className = "print-ticket-image";
      await image.decode();
      root.append(image);
    } catch {
      if (printUrl) URL.revokeObjectURL(printUrl);
      await bookingAlert("Could not prepare ticket", "Please try again.", {
        confirm: "OK",
        required: true,
      });
      return;
    }
    document.getElementById("ticketPrintRoot")?.remove();
    document.body.append(root);
    await Promise.all(
      [...root.querySelectorAll("img")].map((img) =>
        Promise.race([
          img.decode().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]),
      ),
    );
    // Hide the top-layer dialog while printing the standalone ticket.
    const dialogs = [...document.querySelectorAll("dialog[open]")];
    dialogs.forEach((dialog) => dialog.close());
    const restore = () => {
      root.remove();
      URL.revokeObjectURL(printUrl);
      dialogs.forEach((dialog) => {
        if (dialog.isConnected) dialog.showModal();
      });
    };
    window.addEventListener("afterprint", restore, { once: true });
    window.print();
  });
}
export function showBookingComplete(booking) {
  void bookingAlert(
    "Booking completed successfully",
    booking?.bookedBy
      ? booking.guestBooking
        ? "Guest ticket is ready to print or share."
        : "The ticket is ready in the customer account."
      : "Your digital ticket is ready in My Tickets.",
    { success: true },
  );
}
