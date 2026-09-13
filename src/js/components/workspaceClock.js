import { enhanceSelect } from "./selectMenu.js";
import { signedInUser } from "../auth/access.js";
import { bookingAlert } from "./bookingAlert.js";

export function initWorkspaceClock(actions, account) {
  const key = `nironCinema_clock_${signedInUser()?.id || "workspace"}`;
  const defaults = {
    visible: true,
    hour12: true,
    seconds: false,
    zone: "Asia/Phnom_Penh",
  };
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        visible: value.visible !== false,
        hour12: value.hour12 !== false,
        seconds: value.seconds === true,
        zone: value.zone === "local" ? "local" : defaults.zone,
      };
    } catch {
      return { ...defaults };
    }
  };
  let settings = read();
  const clock = document.createElement("button");
  clock.type = "button";
  clock.className = "workspace-clock";
  clock.setAttribute("aria-label", "Clock settings");
  clock.innerHTML =
    '<i class="fa-regular fa-clock" aria-hidden="true"></i><time class="tabular-nums whitespace-nowrap"></time>';
  actions.prepend(clock);
  const settingsButton = document.createElement("button");
  settingsButton.type = "button";
  settingsButton.title = "Clock settings";
  settingsButton.setAttribute("aria-label", "Clock settings");
  settingsButton.innerHTML =
    '<i class="fa-solid fa-clock" aria-hidden="true"></i><span class="workspace-label">Clock settings</span>';
  account.append(settingsButton);
  let formatter;
  const configure = () => {
    formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      ...(settings.seconds ? { second: "2-digit" } : {}),
      hour12: settings.hour12,
      ...(settings.zone === "local" ? {} : { timeZone: settings.zone }),
    });
    clock.hidden = !settings.visible;
  };
  const tick = () => {
    if (!settings.visible || document.hidden) return;
    const now = new Date();
    clock.querySelector("time").textContent = formatter.format(now);
    clock.querySelector("time").dateTime = now.toISOString();
    clock.title = `${settings.zone === "local" ? "Device time" : "Cambodia time"} - Clock settings`;
  };
  configure();
  tick();
  let timer = setInterval(tick, 1000);
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("pagehide", () => clearInterval(timer));
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      clearInterval(timer);
      timer = setInterval(tick, 1000);
      tick();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === key) {
      settings = read();
      configure();
      tick();
    }
  });
  const open = () => {
    const dialog = document.createElement("dialog");
    dialog.className =
      "workspace-clock-settings m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-nironBlue/20 bg-nironDark p-5 text-white shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm";
    dialog.setAttribute("aria-label", "Clock settings");
    dialog.innerHTML =
      '<div class="mb-5 flex items-center justify-between"><h2 class="text-lg font-semibold">Clock settings</h2><button type="button" data-close aria-label="Close clock settings" class="p-2 text-nironBlue"><i class="fa-solid fa-xmark"></i></button></div><form class="space-y-4"><label class="flex items-center justify-between gap-3 text-sm">Show header clock<input name="visible" type="checkbox" class="size-4 accent-cyan-400"></label><label class="flex items-center justify-between gap-3 text-sm">Show seconds<input name="seconds" type="checkbox" class="size-4 accent-cyan-400"></label><div><label for="clockFormat" class="mb-2 block text-sm">Time format</label><select id="clockFormat" name="format"><option value="12">12-hour (AM/PM)</option><option value="24">24-hour</option></select></div><div><label for="clockZone" class="mb-2 block text-sm">Time zone</label><select id="clockZone" name="zone"><option value="Asia/Phnom_Penh">Cambodia (UTC+7)</option><option value="local">Device time zone</option></select></div><p class="text-xs text-gray-400">Display only. Screening times and booking timers stay unchanged.</p><p data-error role="alert" class="text-xs text-rose-300"></p><button type="submit" class="w-full rounded-xl bg-nironBlue/15 py-3 text-sm font-semibold text-nironBlue">Save settings</button></form>';
    document.body.append(dialog);
    const form = dialog.querySelector("form");
    form.elements.visible.checked = settings.visible;
    form.elements.seconds.checked = settings.seconds;
    form.elements.format.value = settings.hour12 ? "12" : "24";
    form.elements.zone.value = settings.zone;
    dialog
      .querySelectorAll("select")
      .forEach((select) => enhanceSelect(select, "fa-clock"));
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    form.onsubmit = (event) => {
      event.preventDefault();
      const next = {
        visible: form.elements.visible.checked,
        seconds: form.elements.seconds.checked,
        hour12: form.elements.format.value === "12",
        zone: form.elements.zone.value,
      };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        dialog.querySelector("[data-error]").textContent =
          "Settings could not be saved. Please try again.";
        return;
      }
      settings = next;
      configure();
      tick();
      dialog.close();
      void bookingAlert(
        "Clock settings saved",
        "Your display preferences have been updated.",
        { success: true },
      );
    };
    dialog.showModal();
  };
  clock.onclick = open;
  settingsButton.onclick = open;
}
