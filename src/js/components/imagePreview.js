const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function previewImage(src, title = "Image preview") {
  const previous = document.activeElement;
  const dialog = document.createElement("dialog");
  dialog.className =
    "m-auto w-[min(92vw,720px)] rounded-2xl border border-white/15 bg-slate-950 p-4 text-white backdrop:bg-black/75 backdrop:backdrop-blur-sm";
  dialog.innerHTML = `<div class="mb-3 flex items-center justify-between gap-3"><h2 class="font-bold">${esc(title)}</h2><button type="button" class="h-10 w-10 rounded-full bg-white/10" aria-label="Close image preview"><i class="fa-solid fa-xmark"></i></button></div><img class="mx-auto max-h-[75vh] max-w-full rounded-xl object-contain" src="${esc(src)}" alt="${esc(title)}">`;
  document.body.append(dialog);
  dialog.querySelector("button").onclick = () => dialog.close();
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      previous?.focus();
    },
    { once: true },
  );
  dialog.showModal();
}
if (typeof document !== "undefined") {
  const open = (event) => {
    const target = event.target.closest("[data-image-preview]");
    if (
      !target ||
      (event.type === "keydown" && !["Enter", " "].includes(event.key))
    )
      return;
    const img = target.matches("img") ? target : target.querySelector("img");
    if (!img) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    previewImage(
      img.currentSrc || img.src,
      target.dataset.imagePreview || img.alt,
    );
  };
  document.addEventListener("click", open, true);
  document.addEventListener("keydown", open, true);
}
