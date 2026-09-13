import { enhanceSelect } from "./selectMenu.js";
export function initTimePicker(input) {
  const wrapper = document.createElement("div");
  wrapper.className = "time-picker mt-1 grid min-w-0 grid-cols-3 gap-2";
  const match = /^(\d{2}):(\d{2})$/.exec(input.value);
  const hour = match ? Number(match[1]) : 10,
    minute = match ? match[2] : "00";
  const fields = [
    [
      "Hour",
      Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
      String(hour % 12 || 12).padStart(2, "0"),
    ],
    [
      "Minute",
      Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")),
      minute,
    ],
    ["AM or PM", ["AM", "PM"], hour >= 12 ? "PM" : "AM"],
  ];
  input.type = "hidden";
  input.after(wrapper);
  const selects = fields.map(([label, values, value], i) => {
    const select = document.createElement(i < 2 ? "input" : "select");
    select.id = `${input.id}-part-${i}`;
    select.setAttribute("aria-label", label);
    if(i < 2) select.dataset.controlSize = "standard";
    if (i < 2) {
      select.type = "number";
      select.inputMode = "numeric";
      select.min = i === 0 ? "1" : "0";
      select.max = i === 0 ? "12" : "59";
      select.step = "1";
      select.required = true;
      select.className =
        "min-h-11 min-w-0 w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-center text-base text-white";
    } else values.forEach((v) => select.add(new Option(v, v)));
    select.value = value;
    wrapper.append(select);
    return select;
  });
  const sync = () => {
    if (selects.slice(0, 2).some((field) => !field.checkValidity())) return;
    input.value = `${String((Number(selects[0].value) % 12) + (selects[2].value === "PM" ? 12 : 0)).padStart(2, "0")}:${String(Number(selects[1].value)).padStart(2, "0")}`;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  selects.forEach((select) => {
    if (select.tagName === "SELECT") enhanceSelect(select, "fa-clock");
    select.addEventListener("input", sync);
    select.addEventListener("change", sync);
  });
  const label = document.querySelector(`label[for="${input.id}"]`);
  if (label) label.htmlFor = selects[0].id;
  sync();
}
