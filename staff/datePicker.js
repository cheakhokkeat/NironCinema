import { localDate } from "./operations.js";
export function initDatePicker(input, allowClear = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "month-picker date-picker";
  input.after(wrapper);
  input.hidden = true;
  wrapper.innerHTML =
    '<button type="button" class="month-trigger" aria-expanded="false"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i><span></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button><div class="month-popover" hidden><div class="month-year"><button type="button" data-nav="-1" aria-label="Previous month">‹</button><strong></strong><button type="button" data-nav="1" aria-label="Next month">›</button></div><div class="date-grid"></div><div class="date-actions"><button type="button" data-today>Today</button>' +
    (allowClear ? '<button type="button" data-clear>All dates</button>' : "") +
    "</div></div>";
  const trigger = wrapper.querySelector(".month-trigger"),
    panel = wrapper.querySelector(".month-popover");
  trigger.dataset.controlSize = "standard";
  const entry = document.createElement("div");
  entry.className = "mb-3 grid grid-cols-[1fr_auto] gap-2";
  entry.innerHTML =
    '<label class="min-w-0 text-xs">Type date (DD/MM/YYYY)<input data-typed-date type="text" inputmode="numeric" maxlength="10" placeholder="DD/MM/YYYY" class="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2"></label><button type="button" data-apply-date class="self-end rounded-lg border border-cyan-300/20 px-3 py-2 text-cyan-200">Apply</button><p data-date-error class="col-span-full text-xs text-rose-300" role="alert"></p>';
  panel.prepend(entry);
  const typed = entry.querySelector("input");
  const applyTyped = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const digits = typed.value.replace(/\D/g, "");
    const day = Number(digits.slice(0, 2)),
      month = Number(digits.slice(2, 4)),
      year = Number(digits.slice(4));
    const value = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(value + "T12:00:00");
    if (
      digits.length !== 8 ||
      year < 1900 ||
      !Number.isFinite(date.getTime()) ||
      localDate(date) !== value ||
      (input.min && value < input.min) ||
      (input.max && value > input.max)
    ) {
      entry.querySelector("[data-date-error]").textContent =
        "Enter a valid date as DD/MM/YYYY.";
      return;
    }
    entry.querySelector("[data-date-error]").textContent = "";
    input.value = value;
    cursor = new Date(value + "T12:00:00");
    cursor.setDate(1);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    close(true);
  };
  entry.querySelector("button").onclick = applyTyped;
  typed.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applyTyped(event);
  });
  entry.addEventListener("click", (event) => event.stopPropagation());
  let cursor = new Date((input.value || localDate()) + "T12:00:00");
  cursor.setDate(1);
  function draw() {
    typed.value = input.value ? input.value.split("-").reverse().join("/") : "";
    trigger.querySelector("span").textContent = input.value
      ? new Date(input.value + "T12:00:00").toLocaleDateString("en", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "All dates";
    trigger.setAttribute(
      "aria-label",
      `${input.getAttribute("aria-label") || "Screening date"}: ${trigger.textContent}`,
    );
    panel.querySelector("strong").textContent = cursor.toLocaleDateString(
      "en",
      { month: "long", year: "numeric" },
    );
    const count = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
    ).getDate();
    panel.querySelector(".date-grid").innerHTML =
      ["S", "M", "T", "W", "T", "F", "S"]
        .map((d) => `<span aria-hidden="true">${d}</span>`)
        .join("") +
      "<span></span>".repeat(cursor.getDay()) +
      Array.from({ length: count }, (_, i) => {
        const date = localDate(
          new Date(cursor.getFullYear(), cursor.getMonth(), i + 1),
        );
        return `<button type="button" data-date="${date}" aria-label="${date}" aria-pressed="${input.value === date}" ${date === localDate() ? 'aria-current="date"' : ""}>${i + 1}</button>`;
      }).join("");
  }
  function close(focus = false) {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (focus) trigger.focus();
  }
  trigger.onclick = () => {
    panel.hidden = !panel.hidden;
    trigger.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) {
      cursor = new Date((input.value || localDate()) + "T12:00:00");
      cursor.setDate(1);
      draw();
      (
        panel.querySelector('[aria-pressed="true"]') ||
        panel.querySelector("[data-date]")
      ).focus();
    }
  };
  panel.onclick = (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.nav) {
      cursor.setMonth(cursor.getMonth() + Number(b.dataset.nav));
      draw();
      return;
    }
    input.value =
      b.dataset.date || (b.hasAttribute("data-today") ? localDate() : "");
    input.dispatchEvent(new Event("change", { bubbles: true }));
    draw();
    close(true);
  };
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    }
  });
  wrapper.addEventListener("focusout", (e) => {
    if (!wrapper.contains(e.relatedTarget)) close();
  });
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) close();
  });
  input.addEventListener("change", draw);
  draw();
}
