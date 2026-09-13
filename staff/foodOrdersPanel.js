import { pageJump } from "../src/js/components/pageJump.js";
import { getData, saveData } from "../src/js/data/storage.js";
import { signedInUser } from "../src/js/auth/access.js";
import { updateFoodOrder } from "../src/js/booking/foodOrders.js";
import { bookingAlert } from "../src/js/components/bookingAlert.js";
import { enhanceSelect } from "../src/js/components/selectMenu.js";
import { statusBadge } from "../src/js/components/workspaceCards.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderFoodOrders(root, locationId = "", onUpdate = () => {}) {
  if (!root) return;
  const state = (root.foodState ||= { filter: "awaiting", query: "", page: 1 });
  const data = getData();
  const orders = (data.foodOrders || [])
    .filter(
      (o) =>
        (!locationId || o.locationId === locationId) &&
        (state.filter === "all" ||
          (state.filter === "cancelled" && o.status === "Cancelled") ||
          (state.filter === "collected" &&
            o.status === "Confirmed" &&
            o.foodCollectedAt) ||
          (state.filter === "awaiting" &&
            o.status === "Confirmed" &&
            !o.foodCollectedAt)) &&
        [
          o.id,
          data.users.find((u) => u.id === o.userId)?.name,
          data.users.find((u) => u.id === o.userId)?.email,
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(state.query.toLowerCase()),
        ),
    )
    .reverse();
  const pages = Math.max(1, Math.ceil(orders.length / 6));
  state.page = Math.min(state.page, pages);
  root.className = "my-6 rounded-2xl border border-white/10 p-4 sm:p-5";
  root.innerHTML = `<h2>Food-only orders</h2><p class="staff-note">Orders without movie tickets. Verify the order ID before handing over food.</p><div class="admin-filters my-4 grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><input data-food-query type="search" aria-label="Search food orders" placeholder="Order ID, customer name or email" value="${esc(state.query)}"><select data-food-filter aria-label="Food order status">${[
    ["awaiting", "Awaiting pickup"],
    ["collected", "Collected"],
    ["cancelled", "Cancelled"],
    ["all", "All statuses"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${state.filter === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></div><p class="staff-note">${orders.length} orders</p><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${
    orders
      .slice((state.page - 1) * 6, state.page * 6)
      .map(
        (o) =>
          `<article class="staff-card">${statusBadge(o.status === "Cancelled" ? "Cancelled" : o.foodCollectedAt ? "Collected" : "Awaiting pickup")}<h3>${esc(data.users.find((u) => u.id === o.userId)?.name || "Customer unavailable")}</h3><p>${esc(data.locations.find((l) => l.id === o.locationId)?.name)}</p><p>${esc(o.date)} / $${Number(o.total).toFixed(2)}</p><small class="break-all">${esc(o.id)}</small><ul class="my-3 text-sm">${o.food.map((f) => `<li>${f.quantity} &times; ${esc(f.name)}</li>`).join("")}</ul><p class="staff-note">${o.status === "Cancelled" ? "Cancelled" : o.foodCollectedAt ? "Food collected" : "Awaiting food pickup"}</p>${o.status === "Confirmed" && !o.foodCollectedAt ? `<button data-food-collect="${esc(o.id)}"><i class="fa-solid fa-utensils"></i> Mark collected</button>` : ""}<details class="staff-disclosure"><summary>Activity</summary>${(o.activity || []).map((a) => `<p class="staff-note">${esc(a.action)} / ${esc(data.users.find((u) => u.id === a.actorId)?.name || a.actorId)} / ${esc(new Date(a.at).toLocaleString())}</p>`).join("")}</details></article>`,
      )
      .join("") || '<p class="staff-empty">No matching food orders.</p>'
  }</div><div class="staff-pagination mt-4"><button data-food-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>Previous</button>${pageJump(state.page, pages, "food-orders")}<button data-food-page="${state.page + 1}" ${state.page === pages ? "disabled" : ""}>Next</button></div>`;
  enhanceSelect(root.querySelector("select"), "fa-filter");
  const redraw = () => renderFoodOrders(root, locationId, onUpdate);
  root.querySelector("[data-food-filter]").onchange = (e) => {
    state.filter = e.target.value;
    state.page = 1;
    redraw();
  };
  root.querySelector("[data-food-query]").onchange = (e) => {
    state.query = e.target.value;
    state.page = 1;
    redraw();
  };
  root.querySelector("[data-page-jump]").onsubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const input = e.currentTarget.elements.page;
    if (!input.value.trim() || !Number.isFinite(Number(input.value))) return;
    state.page = Math.max(1, Math.min(pages, Math.floor(Number(input.value))));
    redraw();
  };
  root.querySelectorAll("[data-food-page]").forEach(
    (b) =>
      (b.onclick = () => {
        state.page = Number(b.dataset.foodPage);
        redraw();
      }),
  );
  root.querySelectorAll("[data-food-collect]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (
          !(await bookingAlert(
            "Confirm food pickup?",
            "Verify the order ID and hand over all listed items.",
            { confirm: "Mark collected" },
          ))
        )
          return;
        try {
          const latest = getData();
          updateFoodOrder(
            latest,
            signedInUser()?.id,
            b.dataset.foodCollect,
            "collect",
          );
          saveData(latest);
          redraw();
          onUpdate();
          void bookingAlert("Food collected", "Pickup recorded successfully.", {
            success: true,
          });
        } catch (error) {
          void bookingAlert("Unable to collect", error.message, {
            required: true,
            confirm: "OK",
          });
        }
      }),
  );
}
