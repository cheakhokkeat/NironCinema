import { initHeaderBrand } from "./headerBrand.js";
import { initWorkspaceClock } from "./workspaceClock.js";
// One responsive control center for staff and admin, preserving existing action handlers.
export function initWorkspaceNavigation({ root, navigation, role, quick }) {
  root.classList.add("workspace-shell");
  const header = root.querySelector("header");
  const brand = header.querySelector("a");
  initHeaderBrand(brand);
  header.setAttribute("data-smart-header", "");
  const profile = root.querySelector("#joinAuthBtn");
  const logout = root.querySelector("#logout");
  const adminLink = root.querySelector("#adminWorkspaceLink");
  const mobile = matchMedia("(max-width: 767px)");
  const key = `nironCinema_${role}_sidebarCollapsed`;
  header.className = "workspace-header";
  const actions = document.createElement("div");
  actions.className = "workspace-header-actions";
  const toggle = document.createElement("button");
  toggle.className = "workspace-menu-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open control center");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  actions.append(toggle);
  const headerRow = document.createElement("div");
  headerRow.className =
    "workspace-header-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3";
  headerRow.append(brand, actions);
  header.replaceChildren(headerRow);
  navigation.className = "workspace-links";
  navigation.querySelectorAll("button").forEach((button) => {
    button.title = button.textContent.trim();
    button.setAttribute("aria-label", button.title);
    const icon = button.querySelector("i");
    const label = document.createElement("span");
    label.className = "workspace-label";
    label.textContent = button.title;
    button.replaceChildren(icon, label);
  });
  const sidebar = document.createElement("aside");
  sidebar.id = `${role}ControlCenter`;
  sidebar.className = "workspace-sidebar";
  sidebar.setAttribute("aria-label", "Control center");
  toggle.setAttribute("aria-controls", sidebar.id);
  sidebar.innerHTML =
    '<div class="workspace-sidebar-heading"><span class="workspace-label">CONTROL CENTER</span><button type="button" data-collapse aria-label="Collapse menu"><i class="fa-solid fa-angles-left" aria-hidden="true"></i></button><button type="button" data-close aria-label="Close control center"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div class="workspace-destinations"></div><div class="workspace-account"></div>';
  const destinations = sidebar.querySelector(".workspace-destinations");
  const link = (href, label, icon) => {
    const a = document.createElement("a");
    a.href = href;
    a.title = label;
    a.setAttribute("aria-label", label);
    a.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span class="workspace-label">${label}</span>`;
    return a;
  };
  const group = (parent, title) => {
    const section = document.createElement("section");
    section.className = "workspace-group";
    section.setAttribute("aria-label", title);
    const heading = document.createElement("h2");
    heading.className = "workspace-group-label";
    heading.textContent = title;
    section.append(heading);
    parent.append(section);
    return section;
  };
  const customer = group(destinations, "Customer");
  customer.append(
    link("../index.html", "Home", "fa-house"),
    link("../index.html#movies", "Book tickets", "fa-ticket"),
    link("../food.html", "Food & drinks", "fa-utensils"),
  );
  const switcher = group(destinations, "Workspaces");
  if (role === "admin")
    switcher.append(
      link("../staff/index.html", "Staff workspace", "fa-id-badge"),
    );
  if (adminLink) {
    adminLink.querySelector("a").innerHTML =
      '<i class="fa-solid fa-gauge-high" aria-hidden="true"></i><span class="workspace-label">Admin workspace</span>';
    switcher.append(adminLink);
    const syncSwitcher = () => {
      switcher.hidden = adminLink.hidden;
    };
    new MutationObserver(syncSwitcher).observe(adminLink, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
    syncSwitcher();
  }
  const buttons = [...navigation.querySelectorAll("button")];
  const groups =
    role === "admin"
      ? [
          ["Admin overview", ["overview"]],
          [
            "Cinema management",
            ["movies", "showtimes", "locations", "foods", "ads"],
          ],
          ["Booking operations", ["bookings", "requests"]],
          ["Administration", ["users", "reports", "activity"]],
        ]
      : [
          ["Staff operations", ["desk", "schedule"]],
          ["Reports", ["report"]],
        ];
  groups.forEach(([title, ids]) => {
    const section = group(navigation, title);
    ids.forEach((id) => {
      const button = buttons.find(
        (b) => (b.dataset.section || b.dataset.view) === id,
      );
      if (button) section.append(button);
    });
  });
  destinations.append(navigation);
  const account = sidebar.querySelector(".workspace-account");
  profile.querySelector("span")?.classList.add("workspace-label");
  logout.insertAdjacentHTML(
    "beforeend",
    '<span class="workspace-label">Sign out</span>',
  );
  const accountGroup = group(account, "My account");
  accountGroup.append(profile, logout);
  initWorkspaceClock(actions, accountGroup);
  root.querySelector("#adminNav")?.remove();
  root.querySelector("#navBackdrop")?.remove();
  root.append(sidebar);
  if (role === "admin") {
    const scrollFrame = document.createElement("div");
    scrollFrame.className = "relative flex min-h-0 flex-1 flex-col";
    destinations.before(scrollFrame);
    scrollFrame.append(destinations);
    const makeHint = (top) => {
      const hint = document.createElement("div");
      hint.className = `pointer-events-none absolute inset-x-0 z-10 flex h-8 justify-center text-nironBlue opacity-0 transition-opacity duration-200 motion-reduce:transition-none ${top ? "top-0 items-start bg-linear-to-b" : "bottom-0 items-end bg-linear-to-t"} from-nironDark via-nironBlue/15 to-transparent`;
      hint.setAttribute("aria-hidden", "true");
      hint.innerHTML = `<i class="fa-solid ${top ? "fa-angle-up" : "fa-angle-down"} text-xs"></i>`;
      scrollFrame.append(hint);
      return hint;
    };
    const above = makeHint(true),
      below = makeHint(false);
    const updateHints = () => {
      above.classList.toggle("opacity-0", destinations.scrollTop <= 2);
      below.classList.toggle(
        "opacity-0",
        destinations.scrollTop + destinations.clientHeight >=
          destinations.scrollHeight - 2,
      );
    };
    destinations.addEventListener("scroll", updateHints, { passive: true });
    const resize = new ResizeObserver(updateHints);
    resize.observe(destinations);
    resize.observe(navigation);
    requestAnimationFrame(updateHints);
  }
  const backdrop = document.createElement("button");
  backdrop.className = "workspace-backdrop";
  backdrop.setAttribute("aria-label", "Close control center");
  root.append(backdrop);
  const bottom = document.createElement("nav");
  bottom.className = "workspace-bottom";
  bottom.setAttribute("aria-label", "Quick navigation");
  bottom.style.setProperty("--quick-count", String(quick.length));
  quick.forEach(([selector, label, icon]) => {
    const original = navigation.querySelector(selector);
    if (!original) return;
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span>`;
    button.onclick = () => original.click();
    const sync = () =>
      original.hasAttribute("aria-current")
        ? button.setAttribute("aria-current", "page")
        : button.removeAttribute("aria-current");
    new MutationObserver(sync).observe(original, {
      attributes: true,
      attributeFilter: ["aria-current"],
    });
    sync();
    bottom.append(button);
  });
  root.append(bottom);
  let previousOverflow = "";
  function close() {
    if (!root.classList.contains("control-open")) return;
    root.classList.remove("control-open");
    document.body.style.overflow = previousOverflow;
    toggle.setAttribute("aria-expanded", "false");
    sidebar.inert = mobile.matches;
    toggle.focus();
  }
  toggle.onclick = () => {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.classList.add("control-open");
    sidebar.inert = false;
    toggle.setAttribute("aria-expanded", "true");
    sidebar.querySelector("[data-close]").focus();
  };
  sidebar.querySelector("[data-close]").onclick = close;
  backdrop.onclick = close;
  sidebar.addEventListener(
    "wheel",
    (event) => {
      if (
        event.ctrlKey ||
        destinations.scrollHeight <= destinations.clientHeight
      )
        return;
      const amount =
        event.deltaY *
        (event.deltaMode === 1
          ? 20
          : event.deltaMode === 2
            ? destinations.clientHeight
            : 1);
      if (!amount) return;
      destinations.scrollBy({ top: amount, behavior: "instant" });
      event.preventDefault();
    },
    { passive: false },
  );
  navigation.addEventListener("click", (e) => {
    if (e.target.closest("button")) close();
  });
  sidebar.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key !== "Tab" || !mobile.matches) return;
    const focusable = [...sidebar.querySelectorAll("button,a[href]")].filter(
      (el) => el.getClientRects().length && !el.disabled,
    );
    const first = focusable[0],
      last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  const collapse = sidebar.querySelector("[data-collapse]");
  const syncCollapse = () => {
    const collapsed = root.classList.contains("control-collapsed");
    collapse.setAttribute("aria-expanded", String(!collapsed));
    collapse.setAttribute(
      "aria-label",
      collapsed ? "Expand menu" : "Collapse menu",
    );
    collapse.title = collapse.getAttribute("aria-label");
    collapse.querySelector("i").className = "fa-solid fa-angles-left";
  };
  try {
    root.classList.toggle(
      "control-collapsed",
      localStorage.getItem(key) === "true",
    );
  } catch {}
  collapse.onclick = () => {
    root.classList.toggle("control-collapsed");
    syncCollapse();
    try {
      localStorage.setItem(
        key,
        String(root.classList.contains("control-collapsed")),
      );
    } catch {}
  };
  syncCollapse();
  const adapt = () => {
    close();
    sidebar.inert = mobile.matches;
  };
  mobile.addEventListener("change", adapt);
  adapt();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.add("control-ready")),
  );
  new ResizeObserver(() =>
    root.style.setProperty(
      "--workspace-header",
      `${header.getBoundingClientRect().height}px`,
    ),
  ).observe(header);
  return close;
}
