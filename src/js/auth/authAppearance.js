export function styleAuthForm() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  document.body.append(modal);
  modal.className =
    "fixed inset-0 z-50 hidden flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm";
  const card = modal.firstElementChild;
  card.className =
    "relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-nironBlue bg-nironDark/90 p-6 text-white shadow-2xl backdrop-blur sm:p-8";
  const close = document.getElementById("closeBtn");
  close.type = "button";
  close.setAttribute("aria-label", "Close sign in");
  close.className =
    "absolute right-2 top-2 flex size-11 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-nironBlue";
  close.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
  const brand = document.createElement("div");
  brand.className = "mb-6 mt-4 text-center";
  brand.innerHTML =
    '<div class="mb-5 flex items-center justify-center gap-2"><span class="flex size-10 items-center justify-center rounded bg-linear-to-tr from-nironBlue to-nironPink font-cyber text-xl font-bold text-black shadow-[0_0_15px_rgba(0,240,255,.4)]">N</span><span class="font-cyber text-lg font-extrabold tracking-wider sm:text-xl">NIRON<span class="text-nironBlue">CINEMA</span></span></div><p class="text-xs font-bold uppercase tracking-[.2em] text-nironPink">Your movie night starts here</p>';
  card.prepend(brand);
  const tabs = document.getElementById("signupTab").parentElement;
  tabs.className =
    "mb-6 grid grid-cols-2 gap-1 rounded-xl border border-nironBlue/15 bg-gray-900/70 p-1";
  tabs.querySelector("p")?.remove();
  for (const id of ["signupTab", "signinTab"]) {
    const original = document.getElementById(id),
      button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.textContent = original.textContent.trim();
    button.className =
      "min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-gray-400 transition hover:text-nironBlue aria-pressed:bg-nironBlue/15 aria-pressed:text-nironBlue";
    original.replaceWith(button);
  }
  const signup = document.getElementById("signupForm"),
    signin = document.getElementById("signinForm");
  signup.classList.add("space-y-4");
  signin.classList.add("space-y-4");
  const updateTabs = () => {
    document
      .getElementById("signupTab")
      .setAttribute(
        "aria-pressed",
        String(!signup.classList.contains("hidden")),
      );
    document
      .getElementById("signinTab")
      .setAttribute(
        "aria-pressed",
        String(!signin.classList.contains("hidden")),
      );
  };
  new MutationObserver(updateTabs).observe(signup, {
    attributes: true,
    attributeFilter: ["class"],
  });
  updateTabs();
  for (const form of [signup, signin]) {
    const intro = form.querySelector("p");
    intro.className = "mb-5 text-center text-sm leading-relaxed text-gray-400";
    intro.textContent =
      form === signin
        ? "Welcome back. Sign in to book your next movie."
        : "Create an account and find your next movie night.";
    form
      .querySelectorAll(".md\\:flex")
      .forEach((row) => (row.className = "space-y-4"));
    form.querySelectorAll(".input-group").forEach((group) => {
      group.className = "w-full";
      const input = group.querySelector("input"),
        label = group.querySelector("label");
      label.className = "mb-1 block text-sm font-medium";
      if (input.id === "signinEmail") label.textContent = "Email or username";
      input.className =
        "block min-h-11 w-full min-w-0 rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-10 pr-3 text-base outline-none focus:border-nironBlue focus:ring-2 focus:ring-nironBlue/20";
      input.autocomplete =
        input.type === "password"
          ? form === signin
            ? "current-password"
            : "new-password"
          : input.id === "fullName"
            ? "name"
            : input.id === "signinEmail"
              ? "username"
              : "email";
      const wrap = document.createElement("div");
      wrap.className = "relative";
      input.before(wrap);
      wrap.append(input);
      const icon = document.createElement("i");
      icon.className =
        "fa-solid " +
        (input.type === "password"
          ? "fa-lock"
          : input.id === "signupEmail"
            ? "fa-envelope"
            : "fa-user") +
        " pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500";
      icon.setAttribute("aria-hidden", "true");
      wrap.append(icon);
      if (input.type === "password") {
        input.classList.add("pr-12");
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className =
          "absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-nironBlue";
        toggle.setAttribute("aria-label", "Show password");
        toggle.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
        toggle.onclick = () => {
          const visible = input.type === "password";
          input.type = visible ? "text" : "password";
          toggle.setAttribute(
            "aria-label",
            visible ? "Hide password" : "Show password",
          );
          toggle.firstElementChild.className =
            "fa-solid " + (visible ? "fa-eye-slash" : "fa-eye");
        };
        wrap.append(toggle);
      }
    });
    form
      .querySelectorAll('input[type="checkbox"]')
      .forEach(
        (input) =>
          (input.className = "size-4 shrink-0 cursor-pointer accent-nironBlue"),
      );
    form
      .querySelectorAll("label.terms")
      .forEach(
        (label) =>
          (label.className = "terms text-xs leading-relaxed text-gray-300"),
      );
    const submit = form.querySelector('[type="submit"]');
    submit.className =
      "min-h-11 w-full rounded-xl bg-nironPink py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,0,127,.4)] transition hover:opacity-90";
    submit.textContent = form === signin ? "Sign in" : "Create account";
  }
}
