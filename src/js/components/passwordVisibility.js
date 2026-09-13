export function initPasswordVisibility(input, button) {
  if (!input || !button) return;
  const update = (visible) => {
    input.type = visible ? "text" : "password";
    button.setAttribute(
      "aria-label",
      visible ? "Hide password" : "Show password",
    );
    button.setAttribute("aria-pressed", String(visible));
    button.title = visible ? "Hide password" : "Show password";
    button.querySelector("i").className =
      `fa-solid ${visible ? "fa-eye-slash" : "fa-eye"}`;
  };
  button.setAttribute("aria-controls", input.id);
  update(false);
  button.addEventListener("click", () => update(input.type === "password"));
  input.form?.addEventListener("reset", () => update(false));
  return () => update(false);
}

export function enhancePasswordInputs(root) {
  root.querySelectorAll('input[type="password"]').forEach((input) => {
    if (input.dataset.passwordToggle) return;
    input.dataset.passwordToggle = "true";
    const wrap = document.createElement("div");
    wrap.className = "relative";
    for (const name of [...input.classList]) {
      if (name.startsWith("mt-")) {
        wrap.classList.add(name);
        input.classList.remove(name);
      }
    }
    input.before(wrap);
    input.classList.add("pr-10");
    wrap.append(input);
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-nironBlue";
    button.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
    wrap.append(button);
    initPasswordVisibility(input, button);
  });
}
