import { languageFlag } from "./languageFlags.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function screeningFormat(show) {
  return `<div class="screening-format-tags"><span class="format-tag"><i class="fa-solid fa-film" aria-hidden="true"></i>${esc(show.format || "2D")}</span><span class="audio-tag" title="Audio language"><i class="fa-solid fa-volume-high" aria-hidden="true"></i>${languageFlag(show.audioLanguage)}${esc(show.audioLanguage || "Audio N/A")}</span><span class="subtitle-tag" title="Subtitle language"><i class="fa-solid fa-closed-captioning" aria-hidden="true"></i>${languageFlag(show.subtitleLanguage)}${esc(show.subtitleLanguage || "Sub N/A")}</span><span class="sound-tag" title="Sound system"><i class="fa-solid fa-headphones" aria-hidden="true"></i>${esc(show.sound || "Standard")}</span></div>`;
}
