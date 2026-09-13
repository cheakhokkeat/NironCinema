// Shared account UI, using the same forms as the home page.
const modalMarkup = `
  <div
    id="signoutModal"
    class="hidden fixed inset-0 z-50 flex items-center justify-center bg-nironDark/40 backdrop-blur-sm h-full"
  >
    <div
      class="bg-nironDark/80 border border-nironBlue rounded-2xl shadow-2xl p-6 w-80 text-center space-y-4"
    >
      <div class="text-nironPink text-3xl">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>

      <h3 class="text-lg font-bold text-white">Sign Out</h3>

      <p class="text-sm text-gray-300">
        Are you sure you want to sign out of Niron Cinema?
      </p>

      <div class="flex space-x-3 pt-2">
        <button
          id="cancelSignout"
          class="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 rounded-xl transition"
        >
          Cancel
        </button>

        <button
          id="confirmSignout"
          class="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2 rounded-xl transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>

  <div
    id="authModal"
    class="fixed h-full inset-0 bg-black/50 items-center justify-center z-50 flex hidden"
  >
    <!-- Modal Card -->
    <div
      class="bg-nironDark/80 p-8 rounded-xl shadow-2xl w-80 md:w-180 border border-nironBlue relative"
    >
      <!-- Close Button -->
      <button
        id="closeBtn"
        class="absolute px-2 top-3 right-5 text-nironPink/90 hover:text-nironBlue hover:cursor-pointer text-2xl font-bold transform duration-300"
      >
        &times;
      </button>

      <div class="flex justify-center gap-3 md:gap-10">
        <h2
          id="signupTab"
          class="auth-selected text-2xl font-bold mb-6 text-white-800 text-center hover:cursor-pointer hover:text-nironBlue/90 transform duration-300 text-nironBlue"
        >
          Sign Up
        </h2>

        <p class="text-2xl text-nironBlue/90">|</p>

        <h2
          id="signinTab"
          class="auth-selected text-2xl font-bold mb-6 text-white-800 text-center hover:cursor-pointer hover:text-nironBlue/90 transform duration-300"
        >
          Sign In
        </h2>
      </div>

      <!-- Signup Form -->
      <form class="" id="signupForm">
        <p class="text-white-800 text-[16px] text-center mb-2">
          Join us and booking your favorite movies.
        </p>

        <!-- Row1 -->
        <div class="md:flex md:justify-between md:gap-6">
          <div class="input-group w-full mb-3">
            <label
              for="fullName"
              class="text-sm font-medium text-white mb-1"
            >
              Full Name
            </label>

            <input
              type="text"
              required
              id="fullName"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nironBlue/80"
            >
          </div>

          <div class="input-group w-full mb-3">
            <label
              for="signupEmail"
              class="text-sm font-medium text-white mb-1"
            >
              Email
            </label>

            <input
              type="email"
              required
              id="signupEmail"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nironBlue/80"
            >
          </div>
        </div>

        <!-- Row2 -->
        <div class="md:flex md:justify-between md:gap-6">
          <div class="input-group w-full mb-3">
            <label
              for="signupPassword"
              class="block text-sm font-medium text-white mb-1"
            >
              Password
            </label>

            <input
              type="password"
              id="signupPassword"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nironBlue/80"
            >
          </div>

          <div class="input-group w-full mb-3">
            <label
              for="repeatPassword"
              class="block text-sm font-medium text-white mb-1"
            >
              Repeat Password
            </label>

            <input
              type="password"
              id="repeatPassword"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nironBlue/80"
            >
          </div>
        </div>

        <!-- Terms Checkbox -->
        <div class="flex gap-2 mb-3">
          <input
            type="checkbox"
            id="terms"
            required
            class="cursor-pointer"
          />

          <label
            for="terms"
            class="terms text-[13px] md:text-[16px]"
          >
            I agree to the
            <a
              href="#"
              class="text-nironBlue/90 hover:underline"
            >
              Terms & Conditions
            </a>
          </label>
        </div>

        <button
          type="submit"
          class="mb-3 w-full bg-nironBlue/90 hover:bg-nironBlue/80 text-nironDark font-medium py-2 rounded-lg transition
            bg-linear-to-r from-nironBlue to-blue-600
            hover:opacity-90 hover:text-white
          "
        >
          Continue
        </button>
      </form>

      <!-- Signin Form -->
      <form class="hidden" id="signinForm">
        <p class="text-white-800 text-[16px] text-center mb-2">
          Welcome back customer !
        </p>

        <!-- Row1 -->
        <div class="input-group w-full mb-3">
          <label
            for="signinEmail"
            class="text-sm font-medium text-white mb-1"
          >
            Email
          </label>

          <input
            type="text"
            required
            id="signinEmail"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nironBlue/80"
          >
        </div>

        <!-- Row2 -->
        <div class="input-group w-full mb-6">
          <label
            for="signinPassword"
            class="block text-sm font-medium text-white mb-1"
          >
            Password
          </label>

          <input
            type="password"
            id="signinPassword"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nironBlue/80"
          >
        </div>

        <!-- Remember Checkbox -->
        <div class="flex gap-2 mb-3">
          <input
            type="checkbox"
            id="remember"
            class="cursor-pointer"
          />

          <label
            for="remember"
            class="terms text-[13px] md:text-[16px]"
          >
            Remember me
          </label>
        </div>

        <button
          type="submit"
          class="mb-3 w-full bg-nironBlue/90 hover:bg-nironBlue/80 text-nironDark font-medium py-2 rounded-lg transition
            bg-linear-to-r from-nironBlue to-blue-600
            hover:opacity-90 hover:text-white
          "
        >
          Continue
        </button>

        <div class="flex justify-end">
          <a
            href="#"
            class="text-[13px] md:text-[16px] text-nironBlue/90 hover:underline"
          >
            Forgot password
          </a>
        </div>
      </form>
    </div>
  </div>
`;

const profileMarkup = `
  <div class="relative inline-block text-left">
    <button
      id="joinAuthBtn"
      aria-label="Account menu"
      class="inline-flex max-w-40 items-center gap-1 rounded-full bg-nironPink px-3 py-2 text-sm font-semibold text-white"
    >
      <i class="fa-solid fa-user" aria-hidden="true"></i>
      <span>Join Now</span>
    </button>

    <div
      id="userDropdown"
      class="hidden absolute right-0 mt-2 w-48 rounded-xl border border-nironBlue/30 bg-nironDark/95 py-2 text-sm shadow-xl"
    >
      <a
        href="#"
        id="profileOption"
        class="block px-4 py-2 text-gray-300 hover:bg-nironBlue/10"
      >
        <i class="fa-solid fa-user-gear mr-2 text-nironBlue"></i>
        Profile
      </a>

      <a
        href="./tickets.html"
        data-tickets-link
        class="block px-4 py-2 text-gray-300 hover:bg-nironBlue/10"
      >
        <i
          class="fa-solid fa-ticket mr-2 text-nironBlue"
          aria-hidden="true"
        ></i>
        My Tickets
      </a>

      <a
        href="./admin/index.html"
        id="adminDashboardOption"
        class="hidden block px-4 py-2 text-gray-300 hover:bg-nironBlue/10"
      >
        Admin Dashboard
      </a>

      <a
        href="#"
        id="signoutBtn"
        class="block px-4 py-2 text-gray-300 hover:bg-red-500/10"
      >
        <i class="fa-solid fa-right-from-bracket mr-2"></i>
        Sign Out
      </a>
    </div>
  </div>
`;

export function ensureAuthShell() {
  const header = document.querySelector("[data-smart-header]");
  if (!header) return;
  if (!document.getElementById("joinAuthBtn")) {
    header.dataset.sharedHeader = "";
    const actions = document.createElement("div");
    actions.dataset.headerActions = "";
    actions.className = "ml-auto flex shrink-0 items-center gap-2";
    actions.innerHTML = profileMarkup;
    const back = header.querySelector('[title="Back to home"]');
    if (back) {
      back.before(actions);
      actions.append(back);
    } else header.firstElementChild.append(actions);
  }
  if (!document.getElementById("authModal")) {
    const shell = document.createElement("div");
    shell.innerHTML = modalMarkup;
    document.body.append(...shell.children);
  }
}
