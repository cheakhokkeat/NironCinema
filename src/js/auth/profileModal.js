import { actionFeedback } from "../components/actionFeedback.js";
import { bookingAlert } from "../components/bookingAlert.js";
import { enhancePasswordInputs } from "../components/passwordVisibility.js";
import { getData, updateCurrentUser } from "../data/storage.js";

export function initProfile(
  onSave,
  trigger = document.getElementById("profileOption"),
) {
  if (!trigger) return;
  const dialog = document.createElement("dialog");
  dialog.className =
    "m-auto w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl border border-nironBlue bg-nironDark/80 p-6 text-white shadow-2xl backdrop:bg-black/50";
  dialog.setAttribute("aria-labelledby", "profileTitle");
  const field = (id, label, type, autocomplete, extra = "") => `
    <label class="block text-sm font-medium text-white" for="${id}">${label}
      <input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" ${extra}
        class="mt-2 block w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-base text-white outline-none focus:ring-2 focus:ring-nironBlue/80">
    </label>`;
  dialog.innerHTML = `
    <div class="mb-5 flex items-center justify-between gap-4">
      <h2 id="profileTitle" class="font-cyber text-xl font-bold">My profile</h2>
      <button type="button" data-close aria-label="Close profile" class="p-2 text-nironPink/90 hover:text-nironBlue transition"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    </div>
    <form class="space-y-4">
      ${field("profileName", "Full name", "text", "name", "required maxlength=100")}
      ${field("profileEmail", "Email", "email", "email", "required")}
      <p class="text-xs text-gray-300">Enter your current password to save any profile changes.</p>
      ${field("profileCurrentPassword", "Current password", "password", "current-password", "required")}
      ${field("profileNewPassword", "New password (optional)", "password", "new-password", "minlength=8")}
      ${field("profileConfirmPassword", "Confirm new password", "password", "new-password")}
      <p class="text-xs text-gray-300">Leave the new password fields empty to keep your password.</p>
      <p data-status role="status" aria-live="polite" class="text-sm"></p>
      <div class="flex justify-end gap-3">
        <button type="button" data-close class="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-nironBlue/10 transition">Cancel</button>
        <button type="submit" class="rounded-lg bg-nironBlue/50 bg-linear-to-r from-nironBlue to-blue-600 px-5 py-2 text-sm font-medium text-nironDark hover:opacity-90 hover:text-white transition">Save changes</button>
      </div>
    </form>`;
  document.body.append(dialog);
  const form = dialog.querySelector("form");
  enhancePasswordInputs(form);
  const status = dialog.querySelector("[data-status]");
  const input = (name) => form.elements.namedItem(name);
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    const session = JSON.parse(
      sessionStorage.getItem("nironCinema_current_user") || "null",
    );
    const user = getData().users.find((entry) => entry.id === session?.id);
    if (!user) return;
    form.reset();
    status.textContent = "";
    input("profileName").value = user.name || "";
    input("profileEmail").value = user.email || "";
    document.getElementById("userDropdown")?.classList.add("hidden");
    dialog.showModal();
  });
  dialog
    .querySelectorAll("[data-close]")
    .forEach((button) =>
      button.addEventListener("click", () => dialog.close()),
    );
  dialog.addEventListener("close", () => {
    form.reset();
    document.getElementById("joinAuthBtn").focus();
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    return actionFeedback(form, async () => {
      try {
        const result = updateCurrentUser({
          name: input("profileName").value,
          email: input("profileEmail").value,
          currentPassword: input("profileCurrentPassword").value,
          newPassword: input("profileNewPassword").value,
          confirmPassword: input("profileConfirmPassword").value,
        });
        status.classList.toggle("text-red-400", !result.success);
        status.classList.toggle("text-nironBlue", result.success);
        status.textContent = result.success
          ? "Profile updated successfully."
          : result.message;
        if (result.success) {
          input("profileName").value = result.user.name;
          input("profileEmail").value = result.user.email;
          [
            "profileCurrentPassword",
            "profileNewPassword",
            "profileConfirmPassword",
          ].forEach((name) => {
            input(name).value = "";
          });
          onSave();
          void bookingAlert(
            "Profile updated successfully",
            "Your account changes have been saved.",
            { confirm: "Done", required: true, success: true },
          );
        }
      } catch {
        status.textContent = "Unable to save your profile. Please try again.";
        status.classList.add("text-red-400");
      }
    });
  });
}
