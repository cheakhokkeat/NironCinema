export function initUserControlMenu() {
  const menu = document.getElementById("mobileMenu");
  const toggle = document.getElementById("mobile-menu-button");
  const dropdown = document.getElementById("userDropdown");
  if (!menu || !toggle || !dropdown) return;
  const links = [...menu.querySelectorAll("a")];
  menu.className = "user-control-menu hidden";
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");
  menu.setAttribute("aria-label", "Control center");
  menu.innerHTML =
    '<div class="user-control-heading"><strong>CONTROL CENTER</strong><button type="button" aria-label="Close menu"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div class="user-control-links"></div><div class="user-control-account"></div>';
  const section = (parent, title) => {
    const el = document.createElement("section");
    el.innerHTML = `<h2>${title}</h2>`;
    parent.append(el);
    return el;
  };
  const browse = section(menu.querySelector(".user-control-links"), "Explore");
  const movies = section(menu.querySelector(".user-control-links"), "Movies");
  links.forEach((a) =>
    (a.hasAttribute("data-movie-filter") ? movies : browse).append(a),
  );
  const account = section(
    menu.querySelector(".user-control-account"),
    "My account",
  );
  const workspace = section(
    menu.querySelector(".user-control-links"),
    "Workspaces",
  );
  const close = () => menu.classList.add("hidden");
  const proxy = (original, target) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = original.innerHTML;
    button.onclick = () => {
      close();
      original.click();
    };
    target.append(button);
    const sync = () => {
      button.hidden = original.classList.contains("hidden");
      workspace.hidden = ![...workspace.querySelectorAll("button")].some(
        (b) => !b.hidden,
      );
    };
    new MutationObserver(sync).observe(original, {
      attributes: true,
      attributeFilter: ["class"],
    });
    sync();
  };
  dropdown
    .querySelectorAll("a")
    .forEach((a) =>
      proxy(
        a,
        a.id === "profileOption" || a.id === "signoutBtn" ? account : workspace,
      ),
    );
  const join = document.createElement("button");
  join.type = "button";
  join.innerHTML =
    '<i class="fa-solid fa-user" aria-hidden="true"></i>Join Now';
  join.onclick = () => {
    close();
    document.getElementById("joinAuthBtn").click();
  };
  account.append(join);
  document.body.append(menu);
  const backdrop = document.createElement("button");
  backdrop.className = "user-control-backdrop";
  backdrop.setAttribute("aria-label", "Close menu");
  document.body.append(backdrop);
  backdrop.onclick = close;
  menu.querySelector(".user-control-heading button").onclick = close;
  let opened = false,
    overflow = "";
  const sync = () => {
    const open = !menu.classList.contains("hidden");
    if (open === opened) return;
    opened = open;
    toggle.setAttribute("aria-expanded", String(open));
    menu.inert = !open;
    backdrop.classList.toggle("is-open", open);
    if (open) {
      overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const signedIn = Boolean(
        JSON.parse(
          sessionStorage.getItem("nironCinema_current_user") || "null",
        ),
      );
      join.hidden = signedIn;
      account
        .querySelectorAll("button:not(:last-child)")
        .forEach((b) => (b.hidden = !signedIn));
      menu.querySelector(".user-control-heading button").focus();
    } else {
      document.body.style.overflow = overflow;
      toggle.focus();
    }
  };
  menu.inert = true;
  toggle.setAttribute("aria-controls", menu.id);
  new MutationObserver(sync).observe(menu, {
    attributes: true,
    attributeFilter: ["class"],
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key !== "Tab") return;
    const items = [...menu.querySelectorAll("a,button")].filter(
      (el) => el.getClientRects().length && !el.hidden,
    );
    if (e.shiftKey && document.activeElement === items[0]) {
      e.preventDefault();
      items.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
      e.preventDefault();
      items[0].focus();
    }
  });
  matchMedia("(min-width:768px)").addEventListener("change", close);
}
