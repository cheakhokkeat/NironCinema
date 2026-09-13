import { actionFeedback } from "../src/js/components/actionFeedback.js";
import { signedInUser } from "../src/js/auth/access.js";
import { initPasswordVisibility } from "../src/js/components/passwordVisibility.js";
import { bookingAlert } from "../src/js/components/bookingAlert.js";
import { signinUser, signoutUser } from "../src/js/data/storage.js";

if (["admin"].includes(signedInUser()?.role)) location.replace("./index.html");

const form = document.getElementById("adminLogin");
const identifier = document.getElementById("loginId");
const password = document.getElementById("loginPassword");
const errorBox = document.getElementById("loginError");
const toggle = document.getElementById("togglePassword");
const hidePassword = initPasswordVisibility(password, toggle);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  return actionFeedback(form, async () => {
    const result = signinUser(identifier.value.trim(), password.value, {
      allowedRoles: ["admin"],
      rememberMe: document.getElementById("remember").checked,
    });
    if (result.success && result.user.role === "admin") {
      await bookingAlert(
        "Signed in successfully",
        "Welcome to your dashboard.",
        {
          confirm: "Continue",
          required: true,
          success: true,
        },
      );
      location.replace("./index.html");
      return;
    }
    if (result.success) signoutUser();
    errorBox.querySelector("span").textContent = result.success
      ? "This account does not have administrator access."
      : result.message;
    errorBox.classList.remove("hidden");
    password.value = "";
    hidePassword();
    password.focus();
  });
});
