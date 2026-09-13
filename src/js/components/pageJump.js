export function pageJump(page, pages, section) {
  return `<form data-page-jump="${section}" class="flex flex-wrap items-center justify-center gap-2" novalidate><label class="flex items-center gap-2"><span>Page</span><span class="block w-16"><input name="page" type="number" inputmode="numeric" min="1" max="${pages}" step="1" value="${page}" aria-label="Page number" class="text-center"></span><span>of ${pages}</span></label><button type="submit" aria-label="Go to page">Go</button></form>`;
}

export function initPageJump(root, navigate) {
  root.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-page-jump]");
    if (!form) return;
    event.preventDefault();
    const input = form.elements.namedItem("page");
    const value = Number(input.value);
    if (!input.value.trim() || !Number.isFinite(value)) {
      input.focus();
      return;
    }
    const page = Math.max(1, Math.min(Number(input.max), Math.trunc(value)));
    navigate(form.dataset.pageJump, page);
  });
}
