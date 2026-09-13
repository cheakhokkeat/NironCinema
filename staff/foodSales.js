const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) => "$" + Number(value || 0).toFixed(2);
export function foodSales(bookings) {
  const items = new Map();
  let orders = 0,
    awaiting = 0,
    collected = 0;
  for (const booking of bookings.filter((b) => b.status === "Confirmed")) {
    const lines = (booking.food || []).filter((f) => Number(f.quantity) > 0);
    if (!lines.length) continue;
    orders++;
    if (booking.foodCollectedAt) collected++;
    else awaiting++;
    for (const line of lines) {
      const key = line.id || line.name;
      const item = items.get(key) || {
        name: line.name || "Food unavailable",
        quantity: 0,
        cents: 0,
      };
      item.quantity += Number(line.quantity);
      item.cents +=
        Math.round((Number(line.price) || 0) * 100) * Number(line.quantity);
      items.set(key, item);
    }
  }
  return {
    orders,
    awaiting,
    collected,
    units: [...items.values()].reduce((sum, item) => sum + item.quantity, 0),
    items: [...items.values()].sort((a, b) => b.cents - a.cents),
  };
}
export function foodSalesPanel(report) {
  const sales = foodSales(report.bookings);
  return `<article class="chart-panel"><h3>Food & drinks sales</h3><p class="staff-note">Confirmed orders in the selected period and cinema. Prices reflect the original sale.</p><div class="chart-values food-sales-values">${[
    ["Revenue", money(report.food)],
    ["Items sold", sales.units],
    ["Food orders", sales.orders],
    ["Awaiting pickup", sales.awaiting],
    ["Collected", sales.collected],
    [
      "Food attachment",
      report.count
        ? Math.round((sales.orders / report.count) * 100) + "%"
        : "0%",
    ],
    ["Average order", money(report.count ? report.total / report.count : 0)],
  ]
    .map(
      ([label, value]) =>
        `<div><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join(
      "",
    )}</div><details class="staff-disclosure"><summary>Sales by item</summary><div class="movie-bars">${sales.items.map((item) => `<div><p><span>${esc(item.name)} <small>(${item.quantity} sold)</small></span><strong>${money(item.cents / 100)}</strong></p></div>`).join("") || '<p class="staff-empty">No food sales in this period.</p>'}</div></details></article>`;
}
