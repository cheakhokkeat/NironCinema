import { languageFlag, languageName } from "./languageFlags.js";
export function enhanceSelect(select, icon, { searchable = false } = {}) {
  const isLanguage = ["audioLanguage", "subtitleLanguage"].includes(
    select.name || select.dataset.formatField,
  );
  const flagNode = (value) => {
    const node = document.createElement("span");
    node.innerHTML = languageFlag(value);
    return node;
  };
  if (!select.id) select.id = `cinemaSelect_${crypto.randomUUID()}`;
  const label = document.querySelector(`label[for="${select.id}"]`);
  const accessibleName =
    select.getAttribute("aria-label") ||
    label?.textContent.trim() ||
    (select.id === "cinemaFilter" ? "Cinema" : "Day");
  const wrapper = document.createElement("div");
  wrapper.className = "cinema-select";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.dataset.controlSize = "standard";
  trigger.className = "cinema-select-trigger";
  trigger.id = `${select.id}Trigger`;
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", `${select.id}Options`);
  const list = document.createElement("div");
  const search = searchable ? document.createElement("input") : null;
  if (search) {
    search.type = "search";
    search.placeholder = `Search ${accessibleName.toLowerCase()}...`;
    search.setAttribute("aria-label", `Search ${accessibleName}`);
    search.className =
      "mb-2 block w-full rounded-lg border border-nironBlue/20 bg-nironDark px-3 py-2 text-sm text-white";
  }
  list.id = `${select.id}Options`;
  list.className = "cinema-select-options";
  list.role = searchable ? "group" : "listbox";
  list.setAttribute("aria-label", accessibleName);
  list.hidden = true;
  select.after(wrapper);
  select.hidden = true;
  if (label) label.htmlFor = trigger.id;
  wrapper.append(trigger, list);
  function close(restoreFocus = false) {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  }
  function refresh() {
    trigger.replaceChildren();
    const glyph = document.createElement("i");
    glyph.className = `fa-solid ${icon}`;
    glyph.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.textContent = isLanguage
      ? `${select.value} / ${languageName(select.value)}`
      : select.selectedOptions[0]?.textContent || "Select";
    const chevron = document.createElement("i");
    chevron.className = "fa-solid fa-chevron-down";
    chevron.setAttribute("aria-hidden", "true");
    trigger.append(
      isLanguage && languageFlag(select.value) ? flagNode(select.value) : glyph,
      text,
      chevron,
    );
    trigger.setAttribute(
      "aria-label",
      `${accessibleName}: ${text.textContent}`,
    );
    list.replaceChildren();
    if (search) list.append(search);
    const items = searchable ? document.createElement("div") : list;
    if (searchable) {
      items.role = "listbox";
      items.setAttribute("aria-label", accessibleName);
      list.append(items);
    }
    [...select.options].forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "option";
      button.tabIndex = -1;
      button.textContent = option.textContent;
      if (isLanguage) {
        button.textContent = `${option.value} / ${languageName(option.value)}`;
        button.prepend(flagNode(option.value));
        button.classList.add("flex", "items-center", "gap-2");
      }
      button.setAttribute("aria-selected", String(option.selected));
      button.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        refresh();
        close(true);
      });
      items.append(button);
    });
    if (search) filter();
  }
  function filter() {
    list.querySelectorAll('[role="option"]').forEach((option) => {
      option.hidden = !option.textContent
        .toLowerCase()
        .includes(search.value.trim().toLowerCase());
    });
    list.querySelector("[data-no-results]")?.remove();
    if (
      ![...list.querySelectorAll('[role="option"]')].some(
        (option) => !option.hidden,
      )
    ) {
      const empty = document.createElement("p");
      empty.dataset.noResults = "";
      empty.className = "p-3 text-sm text-gray-400";
      empty.textContent = "No matching options.";
      list.append(empty);
    }
  }
  if (search) search.addEventListener("input", filter);
  function open() {
    if (search) {
      search.value = "";
      filter();
    }
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    (
      search ||
      list.querySelector('[aria-selected="true"]') ||
      list.firstElementChild
    )?.focus();
  }
  trigger.addEventListener("click", () => (list.hidden ? open() : close()));
  wrapper.addEventListener("keydown", (event) => {
    if (event.target === search && event.key === "Enter") {
      event.preventDefault();
      [...list.querySelectorAll('[role="option"]')]
        .find((option) => !option.hidden)
        ?.click();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    }
    if (event.target === search && ["Home", "End"].includes(event.key)) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (list.hidden) {
        open();
        return;
      }
      const options = [...list.querySelectorAll('[role="option"]')].filter(
        (option) => !option.hidden,
      );
      const index = options.indexOf(document.activeElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
              options.length;
      options[next]?.focus();
    }
    if (event.key === "Tab") close();
  });
  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) close();
  });
  new MutationObserver(refresh).observe(select, {
    childList: true,
    subtree: true,
  });
  select.addEventListener("change", refresh);
  refresh();
}
