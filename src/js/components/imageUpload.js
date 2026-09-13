export function initImageUploads(form) {
  let pending = 0;
  form.querySelectorAll("[data-upload]").forEach((input) => {
    const field = form.elements.namedItem(input.dataset.upload);
    const card = document.createElement("div");
    card.className =
      "mt-3 rounded-xl border border-dashed border-nironBlue/40 bg-nironBlue/5 p-3";
    card.innerHTML =
      '<div class="flex items-center gap-3"><div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-nironDark text-xl text-nironBlue"><i class="fa-regular fa-image" aria-hidden="true"></i><img alt="Selected image preview" class="hidden size-full object-contain"></div><div class="min-w-0 flex-1"><button type="button" data-pick class="inline-flex items-center gap-2 rounded-lg border border-nironBlue/30 bg-nironBlue/15 px-3 py-2 text-sm font-semibold text-nironBlue hover:bg-nironBlue/25"><i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>Choose image</button><p data-file class="mt-2 wrap-break-word text-xs text-gray-400" aria-live="polite">Choose from your device or paste a URL above.</p></div></div><div class="mt-3 flex items-center justify-between gap-2"><p class="text-xs text-gray-400">PNG, JPEG or WebP. Maximum 1 MB.</p><button type="button" data-remove class="text-xs text-rose-300">Remove image</button></div>';
    input.parentElement.replaceWith(card);
    input.className = "sr-only";
    input.tabIndex = -1;
    card.append(input);
    const preview = card.querySelector("img"),
      icon = preview.previousElementSibling,
      message = card.querySelector("[data-file]");
    const error = form.querySelector("[data-error]");
    const paint = () => {
      const src = field.value.trim();
      const valid =
        /^https?:\/\//i.test(src) ||
        /^data:image\/(png|jpeg|webp);base64,/.test(src);
      preview.classList.toggle("hidden", !valid);
      icon.classList.toggle("hidden", valid);
      if (valid) preview.src = src;
      else preview.removeAttribute("src");
      card.querySelector("[data-remove]").hidden = !src;
    };
    preview.onerror = () => {
      preview.classList.add("hidden");
      icon.classList.remove("hidden");
      message.textContent =
        "Preview unavailable. Choose another image or check the URL.";
    };
    field.addEventListener("input", () => {
      message.textContent = "Image URL updated.";
      paint();
    });
    card.querySelector("[data-pick]").onclick = () => input.click();
    let revision = 0;
    card.querySelector("[data-remove]").onclick = () => {
      revision++;
      field.value = "";
      input.value = "";
      message.textContent = "Image removed.";
      paint();
    };
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      if (
        file.size > 1048576 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      ) {
        error.textContent = "Choose a PNG, JPEG or WebP image up to 1 MB.";
        input.value = "";
        return;
      }
      const version = ++revision,
        reader = new FileReader();
      pending++;
      message.textContent = "Reading image...";
      error.textContent = "";
      reader.onload = () => {
        if (version !== revision) return;
        field.value = reader.result;
        message.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
        paint();
      };
      reader.onerror = () => {
        error.textContent =
          "Unable to read this image. Please choose it again.";
      };
      reader.onloadend = () => pending--;
      reader.readAsDataURL(file);
    };
    field.addEventListener("input", () => revision++);
    paint();
  });
  return () => pending > 0;
}
