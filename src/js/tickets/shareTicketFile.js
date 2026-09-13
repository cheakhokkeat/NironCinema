import { ticketImage } from "./ticketImage.js";
import { ticketPdf } from "./ticketPdf.js";
import { loadingState } from "../components/loadingState.js";
import { bookingAlert } from "../components/bookingAlert.js";

export async function shareTicketFile(booking, data, { style, color, format }) {
  const dialog = document.createElement("dialog");
  dialog.className = "ticket-complete-dialog";
  dialog.setAttribute("aria-label", "Share ticket");
  dialog.innerHTML =
    '<h2 class="font-cyber text-lg">Share ticket</h2>' +
    loadingState("Preparing your ticket to share") +
    '<div class="booking-actions"><button type="button" data-close>Close</button></div>';
  let url;
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (url) URL.revokeObjectURL(url);
  });
  document.body.append(dialog);
  dialog.showModal();
  try {
    const png = await ticketImage(booking, data, style, color);
    const blob = format === "pdf" ? await ticketPdf(png) : png;
    if (!dialog.isConnected) return;
    const filename = `NironCinema-${booking.id.replace(/[^a-z0-9_-]/gi, "_")}-${style}-${color}.${format}`;
    const file = new File([blob], filename, { type: blob.type });
    url = URL.createObjectURL(png);
    const preview = new Image();
    preview.src = url;
    preview.alt = "Ticket ready to share";
    preview.className = "w-full rounded-xl";
    dialog.querySelector('[role="status"]').replaceWith(preview);
    const action = document.createElement("button");
    action.type = "button";
    action.className = "booking-primary";
    const canShare = Boolean(
      navigator.share && navigator.canShare?.({ files: [file] }),
    );
    action.textContent = canShare ? "Share ticket" : "Download to share";
    if (!canShare) {
      const note = document.createElement("p");
      note.className = "text-sm text-gray-400 mt-3";
      note.textContent =
        "File sharing is not available in this browser. Download the ticket and attach it in your messaging app.";
      preview.after(note);
    }
    action.onclick = async () => {
      action.disabled = true;
      try {
        // A fresh tap preserves the user activation needed by mobile sharing.
        if (canShare) {
          await navigator.share({ files: [file], title: "NironCinema ticket" });
          void bookingAlert(
            "Ticket shared successfully",
            "Your ticket file has been shared.",
            { success: true },
          );
        } else {
          const downloadUrl = URL.createObjectURL(blob),
            link = document.createElement("a");
          link.href = downloadUrl;
          link.download = filename;
          document.body.append(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
          void bookingAlert(
            "Ticket prepared successfully",
            "Your ticket download has started.",
            { success: true },
          );
        }
      } catch (error) {
        if (error.name !== "AbortError")
          await bookingAlert(
            "Could not share ticket",
            "Please try again or use Save ticket to download it.",
            { confirm: "OK", required: true },
          );
      } finally {
        action.disabled = false;
      }
    };
    dialog.querySelector(".booking-actions").prepend(action);
  } catch {
    if (dialog.isConnected)
      dialog.querySelector('[role="status"]').textContent =
        "Could not prepare the ticket. Close and try again.";
  }
}
