// A brief painted busy state for local actions, with duplicate-submit protection.
export async function actionFeedback(target, action, label = "Processing...") {
  if (target?.dataset.processing) return;
  const button = target?.matches("button")
    ? target
    : target?.querySelector('button[type="submit"], input[type="submit"]');
  const original = button?.innerHTML;
  const disabled = button?.disabled;
  if (target) {
    target.dataset.processing = "true";
    target.setAttribute("aria-busy", "true");
  }
  if (button) {
    button.disabled = true;
    button.innerHTML =
      '<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" aria-hidden="true"></span> ' +
      label;
  }
  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return await action();
  } finally {
    if (target) {
      delete target.dataset.processing;
      target.removeAttribute("aria-busy");
    }
    if (button) {
      button.innerHTML = original;
      button.disabled = disabled;
    }
  }
}
