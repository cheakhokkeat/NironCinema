import { actionFeedback } from "./actionFeedback.js";
export function bookingAlert(
  title,
  message,
  {
    confirm = "Continue",
    cancel = "Cancel",
    required = false,
    success = false,
  } = {},
) {
  if (success) return successToast(title, message);
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "booking-alert";
    dialog.setAttribute("aria-labelledby", "bookingAlertTitle");
    dialog.innerHTML =
      '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><h2 id="bookingAlertTitle"></h2><p></p><div class="booking-actions"></div>';
    const titleId = `alertTitle_${crypto.randomUUID()}`;
    dialog.querySelector("h2").id = titleId;
    dialog.setAttribute("aria-labelledby", titleId);
    if (success) {
      dialog.classList.add("is-success");
      dialog.querySelector("i").className = "fa-solid fa-circle-check";
    }
    dialog.querySelector("h2").textContent = title;
    dialog.querySelector("p").textContent = message;
    const finish = (value) => {
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    if (!required) {
      const button = document.createElement("button");
      button.textContent = cancel;
      button.addEventListener("click", () => finish(false));
      dialog.querySelector("div").append(button);
    }
    const button = document.createElement("button");
    button.className = "booking-primary";
    button.textContent = confirm;
    button.addEventListener("click", () =>
      actionFeedback(button, () => finish(true)),
    );
    dialog.querySelector("div").append(button);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (!required) finish(false);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}

function successToast(title, message) {
  return new Promise((resolve) => {
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML =
      '<i class="fa-solid fa-circle-check" aria-hidden="true"></i><div><strong></strong><p></p></div>';
    toast.querySelector("strong").textContent = title;
    toast.querySelector("p").textContent = message;
    document.body.append(toast);
    if (typeof toast.showPopover === "function") {
      toast.setAttribute("popover", "manual");
      toast.showPopover();
    }
    setTimeout(() => {
      toast.remove();
      resolve(true);
    }, 2400);
  });
}
