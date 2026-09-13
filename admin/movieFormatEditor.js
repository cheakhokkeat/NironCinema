import {
  movieFormats,
  formatFields,
  profilesFor,
} from "../src/js/movies/formatProfiles.js";
import { enhanceSelect } from "../src/js/components/selectMenu.js";
export function initMovieFormatEditor(form, movie, showtimes) {
  const initial = profilesFor(movie, showtimes),
    values = new Map(initial.map((p) => [p.format, { ...p }]));
  const selected = new Set(values.keys());
  const section = document.createElement("section");
  section.className = "rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4";
  section.innerHTML =
    '<h3 class="font-bold">Movie formats</h3><p class="mt-2 text-sm text-gray-400">Select formats and set their default audio, subtitles and sound. Existing screenings keep their settings.</p><div data-format-buttons class="my-4 grid grid-cols-2 gap-2 sm:grid-cols-4"></div><div data-format-panels class="space-y-4"></div>';
  form.querySelector("[data-error]").before(section);
  const panels = section.querySelector("[data-format-panels]");
  function addPanel(format) {
    const settings = values.get(format) || {
      format,
      ...Object.fromEntries(
        formatFields.map(([key, , options]) => [key, options[0]]),
      ),
    };
    values.set(format, settings);
    const panel = document.createElement("div");
    panel.dataset.formatPanel = format;
    panel.className = "rounded-xl border border-white/10 bg-slate-950/60 p-4";
    panel.innerHTML = `<div class="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 class="font-bold text-cyan-200">${format}</h4><button type="button" data-copy-format class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"><i class="fa-regular fa-copy" aria-hidden="true"></i>Copy previous format</button></div><div class="grid gap-3 sm:grid-cols-3">${formatFields.map(([key, label, options]) => `<label class="min-w-0 text-sm">${label}<select data-format-field="${key}" aria-label="${format} ${label}">${options.map((v) => `<option ${settings[key] === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>`).join("")}</div><p data-copy-status class="mt-2 text-xs text-gray-400" role="status"></p>`;
    panel.querySelectorAll("select").forEach((select) => {
      enhanceSelect(select, "fa-chevron-down");
      select.onchange = () =>
        (settings[select.dataset.formatField] = select.value);
    });
    panel.querySelector("[data-copy-format]").onclick = () => {
      const ordered = [...panels.children].filter((p) => !p.hidden);
      const previous = ordered[ordered.indexOf(panel) - 1];
      if (!previous) return;
      const source = values.get(previous.dataset.formatPanel);
      panel.querySelectorAll("select").forEach((select) => {
        select.value = source[select.dataset.formatField];
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      panel.querySelector("[data-copy-status]").textContent =
        `Copied from ${source.format}. You can edit these settings independently.`;
    };
    panels.append(panel);
  }
  function sync() {
    for (const button of section.querySelectorAll("[data-select-format]"))
      button.setAttribute(
        "aria-pressed",
        String(selected.has(button.dataset.selectFormat)),
      );
    let first = true;
    for (const panel of panels.children) {
      panel.hidden = !selected.has(panel.dataset.formatPanel);
      if (!panel.hidden) {
        panel.querySelector("[data-copy-format]").disabled = first;
        first = false;
      }
    }
  }
  for (const format of movieFormats) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.selectFormat = format;
    button.className =
      "min-h-11 rounded-xl border border-white/15 px-3 py-2 aria-pressed:border-cyan-300/40 aria-pressed:bg-cyan-400/15 aria-pressed:text-cyan-200";
    button.innerHTML = `<i class="fa-solid fa-film mr-2" aria-hidden="true"></i>${format}`;
    button.onclick = () => {
      if (selected.has(format)) selected.delete(format);
      else {
        selected.add(format);
        if (!values.has(format)) addPanel(format);
      }
      sync();
    };
    section.querySelector("[data-format-buttons]").append(button);
  }
  initial.forEach((p) => addPanel(p.format));
  sync();
  return () =>
    [...panels.children]
      .filter((p) => selected.has(p.dataset.formatPanel))
      .map((p) => ({ ...values.get(p.dataset.formatPanel) }));
}

export function initScreeningFormatDefaults(form, data, existing) {
  const movieInput = form.elements.movieId,
    formatInput = form.elements.format;
  let profiles = [];
  function syncOptions(preserve = false) {
    profiles = profilesFor(
      data.movies.find((m) => m.id === movieInput.value),
      data.showtimes,
    );
    const options = profiles.length
      ? profiles.map((p) => p.format)
      : movieFormats;
    const current = formatInput.value;
    const allowed =
      preserve && !options.includes(current) ? [...options, current] : options;
    formatInput.replaceChildren(...allowed.map((v) => new Option(v, v)));
    formatInput.value = allowed.includes(current) ? current : allowed[0];
    if (!preserve) applyDefaults();
    formatInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
  let initializing = true;
  function applyDefaults() {
    const profile = profiles.find((p) => p.format === formatInput.value);
    if (!profile) return;
    for (const [key] of formatFields) {
      form.elements[key].value = profile[key];
      form.elements[key].dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  formatInput.addEventListener("change", () => {
    if (!initializing) applyDefaults();
  });
  movieInput.addEventListener("change", () => syncOptions());
  syncOptions(Boolean(existing?.id));
  initializing = false;
}
