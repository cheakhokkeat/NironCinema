import { initFoodNavigation } from "../components/foodNavigation.js";
import { actionFeedback } from "../components/actionFeedback.js";
import { initUserControlMenu } from "../components/userControlMenu.js";
import { bookingAlert } from "../components/bookingAlert.js";
import { styleAuthForm } from "./authAppearance.js";
import { ensureAuthShell } from "./authShell.js";
import {
  initStorage,
  signupUser,
  signinUser,
  signoutUser,
} from "../data/storage.js";
import { initProfile } from "./profileModal.js";
import { requestAccess, resumeAccess } from "./access.js";

// Initialize storage on load
ensureAuthShell();
styleAuthForm();
initStorage();

const joinAuthBtn = document.getElementById("joinAuthBtn");
const modal = document.getElementById("authModal");
const closeBtn = document.getElementById("closeBtn");
const signupForm = document.getElementById("signupForm");
const signinForm = document.getElementById("signinForm");
const signupTab = document.getElementById("signupTab");
const signinTab = document.getElementById("signinTab");

// Drop down
const dropdownMenu = document.getElementById("userDropdown");
const signoutBtn = document.getElementById("signoutBtn");
const signoutModal = document.getElementById("signoutModal");
const adminDashboardOption = document.getElementById("adminDashboardOption"); // Ensure this is referenced if used
const staffDashboardOption = document.createElement("a");
staffDashboardOption.href = "./staff/index.html";
staffDashboardOption.className =
  "hidden block px-4 py-2 text-gray-300 hover:bg-nironBlue/10";
staffDashboardOption.innerHTML =
  '<i class="fa-solid fa-id-badge mr-2 text-nironBlue" aria-hidden="true"></i>Staff workspace';
dropdownMenu?.insertBefore(staffDashboardOption, signoutBtn);

// Signup fields
const fullNameInput = document.getElementById("fullName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const repeatPassword = document.getElementById("repeatPassword");

// Signin fields
const signinEmail = document.getElementById("signinEmail");
const signinPassword = document.getElementById("signinPassword");

// Sign out modal buttons
const confirmSignoutBtn = document.getElementById("confirmSignout");
const cancelSignoutBtn = document.getElementById("cancelSignout");

// Switch Tabs
signupTab.addEventListener("click", () => {
  signupForm.classList.remove("hidden");
  signinForm.classList.add("hidden");
});
signinTab.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  signinForm.classList.remove("hidden");
});

// Mobile Menu Toggles
const mobileMenuBtn = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobileMenu");
const myTickets = document.querySelectorAll(".myTickets");

mobileMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const ticketsUser = JSON.parse(
    sessionStorage.getItem("nironCinema_current_user"),
  );

  // 1. Close profile dropdown if it's currently open (prevents overlap)
  if (dropdownMenu) {
    dropdownMenu.classList.add("hidden");
  }

  // 2. Toggle Mobile Menu
  mobileMenu.classList.toggle("hidden");

  // 3. Show/Hide My Tickets based on login state
  if (ticketsUser) {
    myTickets.forEach((ticket) => ticket.classList.remove("hidden"));
  } else {
    myTickets.forEach((ticket) => ticket.classList.remove("hidden"));
  }
});

// Auth Modal / Profile Dropdown Toggles
joinAuthBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const currentUser = JSON.parse(
    sessionStorage.getItem("nironCinema_current_user"),
  );

  if (currentUser) {
    // 1. Close mobile menu if it's currently open (prevents overlap)
    if (mobileMenu) {
      mobileMenu.classList.add("hidden");
    }
    // 2. Toggle user profile dropdown if logged in
    if (dropdownMenu) {
      dropdownMenu.classList.toggle("hidden");
    }
  } else {
    // 3. Open auth modal if not logged in (FIXED from .add("hidden"))
    modal.classList.remove("hidden");
  }
});

// Close dropdowns when clicking anywhere outside
window.addEventListener("click", (e) => {
  if (
    dropdownMenu &&
    !dropdownMenu.contains(e.target) &&
    e.target !== joinAuthBtn
  ) {
    dropdownMenu.classList.add("hidden");
  }
  if (
    mobileMenu &&
    !mobileMenu.contains(e.target) &&
    e.target !== mobileMenuBtn
  ) {
    mobileMenu.classList.add("hidden");
  }
  if (e.target === modal) modal.classList.add("hidden");
});

if (closeBtn) {
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
}

// Password Match Validation
function validatePassword() {
  if (signupPassword.value !== repeatPassword.value) {
    repeatPassword.setCustomValidity("Passwords do not match.");
  } else {
    repeatPassword.setCustomValidity("");
  }
}
if (signupPassword && repeatPassword) {
  signupPassword.addEventListener("change", validatePassword);
  repeatPassword.addEventListener("keyup", validatePassword);
}

// Handle Sign Up Submission
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  return actionFeedback(signupForm, async () => {
    const result = signupUser({
      name: fullNameInput.value,
      email: signupEmail.value,
      password: signupPassword.value,
    });

    if (result.success) {
      await bookingAlert(
        "Account created",
        "Sign up successful! Please sign in.",
        { confirm: "Sign in", required: true, success: true },
      );
      signupForm.reset();
      signinTab.click();
    } else {
      await bookingAlert("Please try again", result.message, {
        confirm: "OK",
        required: true,
      });
      if (result.message === "Email is already registered!") {
        signupForm.reset();
        signinTab.click();
      }
    }
  });
});

// Function to update the UI layout live
function updateAuthUI() {
  window.dispatchEvent(new Event("auth-changed"));
  const currentUser = JSON.parse(
    sessionStorage.getItem("nironCinema_current_user"),
  );
  staffDashboardOption.classList.toggle(
    "hidden",
    !["staff", "admin"].includes(currentUser?.role),
  );
  if (currentUser && joinAuthBtn) {
    const displayName = currentUser.name || currentUser.username;

    // Truncates long names on mobile so they don't break layout
    joinAuthBtn.innerHTML = `
      <i class="fa-solid fa-user shrink-0"></i>
      <span class="ml-1 truncate max-w-27.5 sm:max-w-none">
      </span>
    `;
    joinAuthBtn.querySelector("span").textContent = displayName;

    // Only administrators can enter the full data-control dashboard.
    if (adminDashboardOption) {
      if (currentUser.role === "admin") {
        adminDashboardOption.classList.remove("hidden");
      } else {
        adminDashboardOption.classList.add("hidden");
      }
    }
  } else if (joinAuthBtn) {
    joinAuthBtn.innerHTML = `<i class="fa-solid fa-user"></i> <span class="hidden sm:inline ml-1">Join Now</span><span class="sm:hidden ml-1">Join</span>`;
    if (adminDashboardOption) adminDashboardOption.classList.add("hidden");
  }
}

initProfile(updateAuthUI);

// Handle Sign In Submission
signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  return actionFeedback(signinForm, async () => {
    const result = signinUser(signinEmail.value, signinPassword.value, {
      allowedRoles: ["user", "staff"],
      rememberMe: document.getElementById("remember").checked,
    });

    if (result.success) {
      await bookingAlert("Signed in", `Welcome back, ${result.user.name}!`, {
        confirm: "Continue",
        required: true,
        success: true,
      });
      modal.classList.add("hidden");
      signinForm.reset();

      // Updates the button instantly without needing a page refresh
      updateAuthUI();
      resumeAccess();
    } else {
      await bookingAlert("Please try again", result.message, {
        confirm: "OK",
        required: true,
      });
    }
  });
});

// Function to trigger the custom sign out modal
function promptSignout() {
  if (signoutModal) {
    signoutModal.classList.remove("hidden");
  }
  // Close dropdowns if they are open
  if (dropdownMenu) dropdownMenu.classList.add("hidden");
  if (mobileMenu) mobileMenu.classList.add("hidden");
}

// Attach to Desktop Logout Button
if (signoutBtn) {
  signoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    promptSignout();
  });
}

// Handle Confirm Sign Out Action
if (confirmSignoutBtn) {
  confirmSignoutBtn.addEventListener("click", async () => {
    signoutUser();
    updateAuthUI();
    if (signoutModal) signoutModal.classList.add("hidden");
    await bookingAlert(
      "Signed out successfully",
      "You have been signed out of your account.",
      { confirm: "Done", required: true, success: true },
    );
    window.location.replace("./index.html");
  });
}

// Handle Cancel Action
if (cancelSignoutBtn) {
  cancelSignoutBtn.addEventListener("click", () => {
    if (signoutModal) signoutModal.classList.add("hidden");
  });
}

// Close if clicking outside the modal box backdrop
window.addEventListener("click", (e) => {
  if (e.target === signoutModal) {
    signoutModal.classList.add("hidden");
  }
});

// Run immediately on page load so it updates automatically if already logged in
updateAuthUI();
if (new URLSearchParams(window.location.search).has("signin")) {
  requestAccess(
    sessionStorage.getItem("nironCinema_pendingPage") || "./tickets.html",
  );
}
document.addEventListener("click", (event) => {
  const movie = event.target.closest("a[data-movie-id]");
  const tickets = event.target.closest(
    "#openTicketsBtn, #mobileTicketsLink, [data-tickets-link]",
  );
  if (!movie && !tickets) return;
  event.preventDefault();
  requestAccess(
    movie
      ? `./movie.html?id=${encodeURIComponent(movie.dataset.movieId)}`
      : "./tickets.html",
  );
});

initUserControlMenu();
initFoodNavigation();
