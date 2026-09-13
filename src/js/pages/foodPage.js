import "../components/posterFallback.js";
import { getData, saveData } from "../data/storage.js";
import { signedInUser, requestAccess } from "../auth/access.js";
import { createFoodOrder, updateFoodOrder } from "../booking/foodOrders.js";
import { bookingAlert } from "../components/bookingAlert.js";
import { actionFeedback } from "../components/actionFeedback.js";
import { enhanceSelect } from "../components/selectMenu.js";
import "../components/imagePreview.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (v) => "$" + Number(v || 0).toFixed(2);
const main = document.getElementById("pageContent");
const key = "nironCinema_foodCart";
let quantities = {};
try {
  quantities = JSON.parse(sessionStorage.getItem(key) || "{}");
} catch {}
let cinema = "",
  payment = "ABA KHQR",
  checkout = false,
  deadline = 0,
  quote = "";
const cart = () =>
  getData()
    .foods.filter((f) => f.active !== "No" && quantities[f.id] > 0)
    .map((f) => ({ ...f, quantity: quantities[f.id] }));
const total = () =>
  cart().reduce(
    (sum, f) => sum + Math.round(Number(f.price) * 100) * f.quantity,
    0,
  ) / 100;
function quantityControls(f, quantity, locked = false) {
  return `<div class="flex min-w-0 items-center gap-1"><button data-food="${esc(f.id)}" data-delta="-1" aria-label="Remove one ${esc(f.name)}" ${locked ? "disabled" : ""} class="h-10 w-9 shrink-0 rounded-lg bg-white/10">&minus;</button><input data-quantity="${esc(f.id)}" type="number" inputmode="numeric" ${locked ? "disabled" : ""} min="0" max="20" step="1" value="${quantity}" aria-label="${esc(f.name)} quantity" class="h-10 min-w-0 w-full rounded-lg border border-white/10 bg-slate-950 text-center"><button data-food="${esc(f.id)}" data-delta="1" aria-label="Add one ${esc(f.name)}" ${locked ? "disabled" : ""} class="h-10 w-9 shrink-0 rounded-lg bg-cyan-400/15 text-cyan-200">+</button></div>`;
}
function render() {
  const data = getData(),
    user = signedInUser();
  const cinemas = data.locations.filter((l) => l.active === "Yes");
  if (!cinemas.some((l) => l.id === cinema)) cinema = cinemas[0]?.id || "";
  main.innerHTML = `<div class="mb-6"><p class="text-xs uppercase tracking-widest text-nironPink">Fresh for your cinema visit</p><h1 class="mt-2 font-cyber text-2xl font-bold">Food & drinks</h1><p class="mt-3 text-sm text-slate-400">Order for cinema pickup. No movie ticket needed.</p></div><div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><section>${
    checkout
      ? `<div class="booking-top"><h2 class="font-cyber text-xl font-bold">Checkout</h2><span class="booking-timer" aria-label="Checkout time remaining"><i class="fa-regular fa-clock" aria-hidden="true"></i><span id="foodTimer" role="timer">05:00</span></span></div><p class="mt-3 text-sm text-gray-400">Choose a payment method. Demo mode: no payment details or real charge required.</p><fieldset class="payment-methods"><legend>Payment method</legend>${[
          ["Debit/Credit Card", "fa-credit-card"],
          ["ABA KHQR", "fa-qrcode"],
          ["PayPal", "fa-wallet"],
        ]
          .map(
            ([label, icon]) =>
              `<label><input type="radio" name="foodPayment" value="${label}" ${payment === label ? "checked" : ""}><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span><small>Demo</small></label>`,
          )
          .join(
            "",
          )}</fieldset><div class="demo-payment-note"><i class="fa-solid fa-lock" aria-hidden="true"></i> All methods are enabled for demo checkout. No card, bank or PayPal information is collected.</div><button data-edit-cart class="mt-4 rounded-xl border border-white/15 px-4 py-3">Back to menu</button>`
      : `<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">${
          data.foods
            .filter((f) => f.active !== "No")
            .map(
              (f) =>
                `<article class="rounded-2xl border border-white/10 bg-slate-900/60 p-3"><div class="food-art aspect-square">${f.image ? `<button type="button" data-image-preview="${esc(f.name)}" class="h-full w-full"><img src="${esc(f.image)}" alt="${esc(f.name)}" class="h-full w-full object-cover"></button>` : '<i class="fa-solid fa-utensils text-3xl text-cyan-200"></i>'}</div><h2 class="mt-3 text-sm font-bold">${esc(f.name)}</h2><p class="mt-2 text-xs text-slate-400">${esc(f.description)}</p><p class="my-3 text-sm text-cyan-200">${money(f.price)}</p>${quantityControls(f, quantities[f.id] || 0)}</article>`,
            )
            .join("") || "<p>No food available yet.</p>"
        }</div>`
  }</section><aside class="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-5"><h2 class="mb-4 text-lg font-bold">Your order</h2><label class="text-sm">Pickup cinema<select id="foodCinema" ${checkout ? "disabled" : ""}>${cinemas.map((l) => `<option value="${esc(l.id)}" ${cinema === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label><div class="my-4 space-y-3">${
    cart()
      .map(
        (f) =>
          `<div class="flex justify-between gap-3 text-sm"><span>${f.quantity} &times; ${esc(f.name)}</span><span>${money(f.price * f.quantity)} <button data-remove="${esc(f.id)}" aria-label="Remove ${esc(f.name)}" ${checkout ? "disabled" : ""} class="ml-2 text-rose-300"><i class="fa-solid fa-trash-can"></i></button></span></div>`,
      )
      .join("") || '<p class="text-sm text-slate-400">Your order is empty.</p>'
  }</div><div class="flex justify-between border-t border-white/10 pt-4 font-bold"><span>Total</span><span>${money(total())}</span></div><button data-place class="mt-5 min-h-11 w-full rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-40" ${!cart().length || !cinema ? "disabled" : ""}>${checkout ? "Confirm demo order" : "Continue to checkout"}</button></aside></div><section class="mt-10"><h2 class="mb-4 text-xl font-bold">My food orders</h2><div class="grid gap-4 sm:grid-cols-2">${
    user
      ? (data.foodOrders || [])
          .filter((o) => o.userId === user.id)
          .slice()
          .reverse()
          .map(
            (o) =>
              `<article class="rounded-2xl border border-white/10 bg-slate-900/60 p-5"><p class="text-xs text-cyan-200">${o.status === "Cancelled" ? "Cancelled" : o.foodCollectedAt ? "Collected" : "Awaiting pickup"}</p><h3 class="mt-2 font-bold">${esc(data.locations.find((l) => l.id === o.locationId)?.name || "Cinema unavailable")}</h3><p class="mt-2 break-all text-xs text-slate-400">${esc(o.id)}</p><p class="mt-2 text-sm">${esc(o.date)} / ${money(o.total)}</p><ul class="my-3 text-sm text-slate-300">${o.food.map((f) => `<li>${f.quantity} &times; ${esc(f.name)}</li>`).join("")}</ul><p class="text-xs text-slate-400">Show this order ID at the food counter. Demo order.</p>${o.status === "Confirmed" && !o.foodCollectedAt ? `<button data-cancel-order="${esc(o.id)}" class="mt-3 text-sm text-rose-300">Cancel order</button>` : ""}</article>`,
          )
          .join("") ||
        '<p class="text-sm text-slate-400">No food orders yet.</p>'
      : '<p class="text-sm text-slate-400">Sign in to view your orders.</p>'
  }</div></section>`;
  enhanceSelect(main.querySelector("#foodCinema"), "fa-location-dot");
  main.querySelector("#foodCinema").onchange = (e) => (cinema = e.target.value);
  main
    .querySelectorAll("[name=foodPayment]")
    .forEach((input) => (input.onchange = () => (payment = input.value)));
  tick();
}
function setQuantity(id, value) {
  if (checkout) return;
  quantities[id] = Math.min(20, Math.max(0, Math.floor(Number(value) || 0)));
  sessionStorage.setItem(key, JSON.stringify(quantities));
  render();
}
main.addEventListener("change", (e) => {
  if (e.target.dataset.quantity)
    setQuantity(e.target.dataset.quantity, e.target.value);
});
main.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.dataset.food)
    setQuantity(
      b.dataset.food,
      (quantities[b.dataset.food] || 0) + Number(b.dataset.delta),
    );
  if (b.dataset.remove) setQuantity(b.dataset.remove, 0);
  if (b.hasAttribute("data-edit-cart")) {
    checkout = false;
    deadline = 0;
    render();
  }
  if (b.hasAttribute("data-place")) {
    if (!signedInUser()) {
      requestAccess("./food.html");
      return;
    }
    if (!checkout) {
      checkout = true;
      quote = JSON.stringify(cart().map((f) => [f.id, f.price, f.quantity]));
      deadline = Date.now() + 300000;
      render();
      main.scrollIntoView({ behavior: "smooth" });
      return;
    }
    await actionFeedback(
      b,
      async () => {
        try {
          if (Date.now() >= deadline)
            throw Error("Checkout expired. Please review your order again.");
          if (
            quote !==
            JSON.stringify(cart().map((f) => [f.id, f.price, f.quantity]))
          ) {
            checkout = false;
            render();
            throw Error(
              "The menu or prices changed. Review your cart before continuing.",
            );
          }
          const data = getData();
          createFoodOrder(
            data,
            signedInUser()?.id,
            cinema,
            quantities,
            payment,
          );
          saveData(data);
          quantities = {};
          sessionStorage.removeItem(key);
          checkout = false;
          deadline = 0;
          render();
          window.dispatchEvent(new Event("booking-complete"));
          void bookingAlert(
            "Food order complete",
            "Your order is saved. Show its ID at the selected cinema.",
            { success: true },
          );
        } catch (error) {
          await bookingAlert("Unable to place order", error.message, {
            required: true,
            confirm: "OK",
          });
        }
      },
      "Placing order...",
    );
  }
  if (
    b.dataset.cancelOrder &&
    (await bookingAlert(
      "Cancel food order?",
      "This demo order will be cancelled.",
      { confirm: "Cancel order", cancel: "Keep order" },
    ))
  ) {
    try {
      const data = getData();
      updateFoodOrder(
        data,
        signedInUser()?.id,
        b.dataset.cancelOrder,
        "cancel",
      );
      saveData(data);
      render();
      window.dispatchEvent(new Event("booking-complete"));
      void bookingAlert(
        "Order cancelled",
        "Your food order has been cancelled.",
        { success: true },
      );
    } catch (error) {
      void bookingAlert("Unable to cancel", error.message, {
        required: true,
        confirm: "OK",
      });
    }
  }
});
function tick() {
  if (!checkout) return;
  const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  const timer = document.getElementById("foodTimer");
  if (timer)
    timer.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  if (!left) {
    checkout = false;
    deadline = 0;
    render();
    void bookingAlert(
      "Checkout expired",
      "Your items are still in your cart. Please review them and continue again.",
      { required: true, confirm: "OK" },
    );
  }
}
setInterval(tick, 1000);
window.addEventListener("auth-changed", () => {
  checkout = false;
  deadline = 0;
  render();
});
window.addEventListener("storage", render);
render();
