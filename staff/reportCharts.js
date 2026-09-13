import "../src/js/components/imagePreview.js";
import { foodSalesPanel } from "./foodSales.js";
import "../src/js/components/posterFallback.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) => "$" + Number(value).toFixed(2);
export function dailySeries(report, month) {
  const [year, m] = month.split("-").map(Number);
  return Array.from({ length: new Date(year, m, 0).getDate() }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    const bookings = report.bookings.filter((b) => b.date === date);
    return {
      date,
      sales:
        bookings.reduce((n, b) => n + Math.round(Number(b.total) * 100), 0) /
        100,
      food:
        bookings.reduce(
          (sum, b) =>
            sum +
            (b.foodTotal != null
              ? Math.round(Number(b.foodTotal) * 100)
              : (b.food || []).reduce(
                  (n, f) =>
                    n + Math.round(Number(f.price) * 100) * Number(f.quantity),
                  0,
                )),
          0,
        ) / 100,
      bookings: bookings.length,
      seats: bookings.reduce((n, b) => n + (b.seats || []).length, 0),
    };
  });
}
export function renderCharts(root, report, data, month, metric = "sales") {
  const metricLabel =
    metric === "bookings"
      ? "orders"
      : metric === "food"
        ? "food & drinks sales"
        : metric;
  const series = dailySeries(report, month),
    values = series.map((d) => d[metric]);
  const max = ["sales", "food"].includes(metric)
      ? Math.max(1, ...values)
      : Math.max(2, Math.ceil(Math.max(...values) / 2) * 2),
    format = (v) => (["sales", "food"].includes(metric) ? money(v) : String(v));
  const peak = series.reduce(
    (best, d) => (d[metric] > best[metric] ? d : best),
    series[0],
  );
  const points = series
    .map(
      (d, i) =>
        `${48 + (i * 644) / (series.length - 1)},${220 - (d[metric] / max) * 170}`,
    )
    .join(" ");
  const ticks = [0, 0.5, 1]
    .map(
      (t) =>
        `<line x1="48" x2="692" y1="${220 - t * 170}" y2="${220 - t * 170}" stroke="#ffffff12"/><text x="40" y="${224 - t * 170}" text-anchor="end">${esc(format(max * t))}</text>`,
    )
    .join("");
  const percent =
    report.total > 0
      ? Math.max(0, Math.min(100, (report.tickets / report.total) * 100))
      : 0;
  const movies = new Map();
  for (const b of report.bookings) {
    if (b.type === "food") continue;
    const s = data.showtimes.find((s) => s.id === b.showtimeId),
      m = data.movies.find((m) => m.id === s?.movieId);
    const title = m?.title || "Movie unavailable";
    movies.set(
      title,
      (movies.get(title) || 0) + Math.round(Number(b.total) * 100),
    );
  }
  const top = [...movies].sort((a, b) => b[1] - a[1]).slice(0, 5),
    topMax = Math.max(1, ...top.map(([, v]) => v));
  root.innerHTML = `<article class="chart-panel chart-trend">
  <div class="chart-heading">
    <div>
      <p class="staff-eyebrow">MONTH AT A GLANCE</p>
      <h3>Daily ${esc(metricLabel)}</h3>
    </div>

    <span>
      ${
        report.count
          ? `Peak: ${esc(peak.date.slice(8))} · ${format(peak[metric])}`
          : "No sales this month"
      }
    </span>
  </div>

  <svg
    viewBox="0 0 720 260"
    role="img"
    aria-label="Daily ${esc(metricLabel)} for ${esc(month)}"
  >
    <defs>
      <linearGradient
        id="salesFill"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          stop-color="#00f0ff"
          stop-opacity=".25"
        />
        <stop
          offset="1"
          stop-color="#00f0ff"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>

    ${ticks}

    <polygon
      points="48,220 ${points} 692,220"
      fill="url(#salesFill)"
    />

    <polyline
      points="${points}"
      fill="none"
      stroke="#00f0ff"
      stroke-width="3"
      stroke-linejoin="round"
    />

    ${series
      .map(
        (d, i) => `
            <circle
              cx="${48 + (i * 644) / (series.length - 1)}"
              cy="${220 - (d[metric] / max) * 170}"
              r="4"
              fill="#00f0ff"
            >
              <title>
                ${esc(d.date)}: ${format(d[metric])}
              </title>
            </circle>

            ${
              i % 5 === 0 || i === series.length - 1
                ? `
                  <text
                    x="${48 + (i * 644) / (series.length - 1)}"
                    y="246"
                    text-anchor="middle"
                  >
                    ${i + 1}
                  </text>
                `
                : ""
            }
          `,
      )
      .join("")}
  </svg>

  <details class="staff-disclosure">
    <summary>View daily values</summary>

    <div class="chart-values">
      ${series
        .map(
          (d) => `
              <div>
                <span>${esc(d.date)}</span>
                <strong>${format(d[metric])}</strong>
              </div>
            `,
        )
        .join("")}
    </div>
  </details>
</article>

<article class="chart-panel chart-breakdown">
  <h3>Sales breakdown</h3>

  <div
    class="chart-donut ${report.total === 0 ? "is-empty" : ""}"
    style="--share:${percent}%"
    role="img"
    aria-label="Ticket sales ${money(report.tickets)}, food and drinks ${money(report.food)}"
  >
    <div>
      <small>Total sales</small>
      <strong>${money(report.total)}</strong>
    </div>
  </div>

  <div class="chart-legend">
    <p>
      <span>
        <i></i>
        Tickets
      </span>

      <strong>${money(report.tickets)}</strong>
    </p>

    <p>
      <span>
        <i class="pink"></i>
        Food & drinks
      </span>

      <strong>${money(report.food)}</strong>
    </p>
  </div>
</article>

${foodSalesPanel(report)}
<article class="chart-panel">
  <h3>Top movies</h3>

  <p class="staff-note">
    Top 5 by total booking sales, including extras.
  </p>

  <div class="movie-bars">
    ${
      top
        .map(
          ([title, total]) => `
            <div>
              <p>
                <span class="flex min-w-0 items-center gap-2">
                  <img
                    data-image-preview="${esc(title)}" role="button" tabindex="0" data-movie-poster
                    src="${esc(
                      data.movies.find((m) => m.title === title)?.poster || "",
                    )}"
                    alt=""
                    loading="lazy"
                    class="aspect-2/3 w-10 shrink-0 rounded-md object-cover"
                  />

                  <span class="min-w-0 wrap-break-word">
                    ${esc(title)}
                  </span>
                </span>

                <strong>
                  ${money(total / 100)}
                </strong>
              </p>

              <div class="chart-track">
                <span
                  style="width:${(total / topMax) * 100}%"
                ></span>
              </div>
            </div>
          `,
        )
        .join("") || '<p class="staff-empty">No movie sales yet.</p>'
    }
  </div>
<details class="staff-disclosure"><summary>Sales by movie</summary><div class="chart-values movie-sales-values">${
    [...movies]
      .sort((a, b) => b[1] - a[1])
      .map(
        ([title, total]) =>
          `<div><span>${esc(title)}</span><strong>${money(total / 100)}</strong></div>`,
      )
      .join("") || '<p class="staff-empty">No movie sales in this period.</p>'
  }</div></details>
</article>
`;
}
