const cambodiaFlag = new URL("../../assets/flag-cambodia.svg", import.meta.url)
  .href;
const drawings = {
  EN: '<path fill="#012169" d="M0 0h30v20H0z"/><path stroke="white" stroke-width="5" d="m0 0 30 20M30 0 0 20"/><path stroke="#c8102e" stroke-width="2" d="m0 0 30 20M30 0 0 20"/><path stroke="white" stroke-width="7" d="M15 0v20M0 10h30"/><path stroke="#c8102e" stroke-width="4" d="M15 0v20M0 10h30"/>',
  KR: '<path fill="white" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="5" fill="#cd2e3a"/><path fill="#0047a0" d="M10 10a5 5 0 0 0 10 0c-2-4-3 4-5 0s-4-1-5 0"/><path stroke="#111" stroke-width="1" d="m4 4 4-2M4 6l4-2M22 2l4 2M22 4l4 2M4 14l4 2M4 16l4 2M22 16l4-2M22 18l4-2"/>',
  JP: '<path fill="white" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
  ZH: '<path fill="#de2910" d="M0 0h30v20H0z"/><path fill="#ffde00" d="m6 3 1 3h3L8 8l1 3-3-2-3 2 1-3-2-2h3zm7-1 1 1-1 1-1-1zm3 3 1 1-1 1-1-1zm0 4 1 1-1 1-1-1zm-3 3 1 1-1 1-1-1z"/>',
  HI: '<path fill="#ff9933" d="M0 0h30v7H0z"/><path fill="white" d="M0 7h30v6H0z"/><path fill="#138808" d="M0 13h30v7H0z"/><circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080"/><path stroke="#000080" stroke-width=".5" d="M15 7.5v5M12.5 10h5m-4-1.5 3 3m-3 0 3-3"/>',
};
export function languageFlag(code) {
  if (code === "KH")
    return `<img src="${cambodiaFlag}" class="inline-block h-4 w-6 shrink-0 rounded-sm object-contain" alt="" aria-hidden="true">`;
  return drawings[code]
    ? `<svg viewBox="0 0 30 20" class="inline-block h-4 w-6 shrink-0 overflow-hidden rounded-sm" aria-hidden="true">${drawings[code]}</svg>`
    : "";
}
export const languageName = (code) =>
  ({
    KH: "Khmer",
    EN: "English",
    KR: "Korean",
    JP: "Japanese",
    ZH: "Chinese",
    HI: "Hindi",
    None: "None",
  })[code] || code;
