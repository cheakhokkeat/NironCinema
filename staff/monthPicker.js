export function initMonthPicker(input, onChange) {
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2026, i, 1).toLocaleString("en", { month: "short" }),
  );
  const wrapper = document.createElement("div");
  wrapper.className = "month-picker";
  input.after(wrapper);
  input.hidden = true;
  wrapper.innerHTML =
    '<button type="button" class="month-trigger" aria-expanded="false" aria-label="Choose report month"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i><span></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button><div class="month-popover" hidden><div class="month-year"><button type="button" data-year="-1" aria-label="Previous year">‹</button><strong></strong><button type="button" data-year="1" aria-label="Next year">›</button></div><div class="month-grid"></div><button type="button" class="month-today">This month</button></div>';
  const trigger = wrapper.querySelector(".month-trigger"),
    panel = wrapper.querySelector(".month-popover");
  trigger.dataset.controlSize = "standard";
  const entry = document.createElement("div");
  entry.className = "mb-3 grid grid-cols-[1fr_auto] gap-2";
  entry.innerHTML =
    '<label class="min-w-0 text-xs">Type month (MM/YYYY)<input type="text" inputmode="numeric" maxlength="7" placeholder="MM/YYYY" class="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"></label><button type="button" class="self-end rounded-lg border border-cyan-300/20 px-3 py-2 text-cyan-200">Apply</button><p class="col-span-full text-xs text-rose-300" role="alert"></p>';
  panel.prepend(entry);
  const typed = entry.querySelector("input");
  const apply = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const digits = typed.value.replace(/\D/g, ""),
      month = Number(digits.slice(0, 2)),
      nextYear = Number(digits.slice(2));
    if (
      digits.length !== 6 ||
      month < 1 ||
      month > 12 ||
      nextYear < 1900 ||
      nextYear > 9999
    ) {
      entry.querySelector("p").textContent = "Enter a valid month as MM/YYYY.";
      return;
    }
    entry.querySelector("p").textContent = "";
    year = nextYear;
    choose(`${year}-${String(month).padStart(2, "0")}`);
  };
  entry.querySelector("button").onclick = apply;
  typed.onkeydown = (event) => {
    if (event.key === "Enter") apply(event);
  };
  entry.onclick = (event) => event.stopPropagation();
  let year = Number(input.value.slice(0, 4));
  function draw() {
    typed.value = input.value ? input.value.split("-").reverse().join("/") : "";
    trigger.querySelector("span").textContent = new Date(
      input.value + "-01T12:00:00",
    ).toLocaleString("en", { month: "long", year: "numeric" });
    panel.querySelector("strong").textContent = year;
    panel.querySelector(".month-grid").innerHTML = months
      .map(
        (m, i) =>
          `<button type="button" data-month="${i + 1}" aria-pressed="${input.value === `${year}-${String(i + 1).padStart(2, "0")}`}">${m}</button>`,
      )
      .join("");
  }
  function close(focus = false) {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (focus) trigger.focus();
  }
  function choose(value) {
    input.value = value;
    draw();
    close(true);
    onChange();
  }
  trigger.onclick = () => {
    panel.hidden = !panel.hidden;
    trigger.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) {
      year = Number(input.value.slice(0, 4));
      draw();
      panel.querySelector('[aria-pressed="true"]')?.focus();
    }
  };
  panel.onclick = (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.year) {
      year = Math.max(1900, Math.min(2100, year + Number(b.dataset.year)));
      draw();
    } else if (b.dataset.month) {
      choose(`${year}-${b.dataset.month.padStart(2, "0")}`);
    } else if (b.classList.contains("month-today")) {
      const now = new Date();
      choose(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      );
    }
  };
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    }
  });
  wrapper.addEventListener("focusout", (event) => {
    if (!wrapper.contains(event.relatedTarget)) close();
  });
  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) close();
  });
  draw();
}
