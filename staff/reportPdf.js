import { drawCinemaBrand } from "../src/js/components/brandCanvas.js";
import { buildImagePdf } from "../src/js/tickets/ticketPdf.js";
import { dailySeries } from "./reportCharts.js";

// A standalone A4-proportioned summary, with no remote image dependencies.
export function reportCanvas(
  report,
  month,
  cinema,
  style = "modern",
  workspace = "Staff",
) {
  const classic = style === "classic",
    dark = style === "dark";
  const palette = dark
    ? {}
    : {
        "#0b0f19": "#ffffff",
        "#cbd5e1": "#475569",
        "#fff": "#111827",
        "#00f0ff": classic ? "#111827" : "#087f8c",
        "#ff69b4": classic ? "#475569" : "#a83268",
        "#10212c": classic ? "#f3f4f6" : "#eef8fa",
        "#23303d": "#d1d5db",
        "#00c7d4": classic ? "#334155" : "#0891a1",
        "#ff007f": classic ? "#94a3b8" : "#c75286",
      };
  const color = (value) => palette[value] || value;
  const canvas = document.createElement("canvas");
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF rendering unavailable");
  ctx.scale(2, 2);
  ctx.fillStyle = color("#0b0f19");
  ctx.fillRect(0, 0, 595, 842);
  const text = (value, x, y, size = 11, color = "#cbd5e1") => {
    ctx.fillStyle = palette[color] || color;
    ctx.font = `${size >= 16 ? "bold " : ""}${size}px sans-serif`;
    ctx.fillText(String(value), x, y, 515);
  };
  const money = (v) => "$" + Number(v).toFixed(2);
  drawCinemaBrand(ctx, 40, 28, { size: 28, light: !dark });
  text(`MONTHLY ${workspace.toUpperCase()} REPORT`, 40, 80, 11, "#ff69b4");
  text(month, 40, 112, 24, "#fff");
  text(cinema, 40, 137);
  text(
    "Confirmed bookings by booking date. Includes demo bookings.",
    40,
    158,
    10,
  );
  const metrics = [
    ["Orders", report.count],
    ["Seats sold", report.seats],
    ["Total sales", money(report.total)],
  ];
  metrics.forEach(([label, value], i) => {
    const x = 40 + i * 175;
    ctx.fillStyle = color("#10212c");
    ctx.beginPath();
    ctx.roundRect(x, 185, 165, 80, classic ? 0 : 10);
    ctx.fill();
    text(label, x + 12, 208, 10);
    text(value, x + 12, 244, 22, "#00f0ff");
  });
  text("Daily sales", 40, 302, 16, "#fff");
  const days = dailySeries(report, month),
    max = Math.max(1, ...days.map((d) => d.sales));
  for (const fraction of [0, 0.5, 1]) {
    const y = 475 - fraction * 130;
    ctx.strokeStyle = color("#23303d");
    ctx.beginPath();
    ctx.moveTo(78, y);
    ctx.lineTo(550, y);
    ctx.stroke();
    text(money(max * fraction), 40, y + 3, 8);
  }
  days.forEach((d, i) => {
    const x = 80 + (i * 470) / days.length,
      h = (d.sales / max) * 130;
    ctx.fillStyle = color("#00c7d4");
    ctx.fillRect(x, 475 - h, Math.max(3, 470 / days.length - 4), h);
    if (i % 5 === 0 || i === days.length - 1) text(i + 1, x, 493, 8);
  });
  text("Sales breakdown", 40, 535, 16, "#fff");
  const share =
    report.total > 0
      ? Math.max(0, Math.min(1, report.tickets / report.total))
      : 0;
  ctx.fillStyle = color(report.total ? "#ff007f" : "#23303d");
  ctx.fillRect(40, 555, 515, 12);
  ctx.fillStyle = color("#00f0ff");
  ctx.fillRect(40, 555, 515 * share, 12);
  text("Tickets: " + money(report.tickets), 40, 591, 12, "#00f0ff");
  text("Food & drinks: " + money(report.food), 310, 591, 12, "#ff69b4");
  const peak = days.reduce((a, b) => (b.sales > a.sales ? b : a), days[0]);
  text("Quick summary", 40, 640, 16, "#fff");
  text(
    report.count
      ? `Highest sales day: ${peak.date} (${money(peak.sales)})`
      : "No confirmed sales for this period.",
    40,
    666,
  );
  text(
    "Average order value: " +
      money(report.count ? report.total / report.count : 0),
    40,
    688,
  );
  text("Pending and cancelled bookings are excluded.", 40, 728, 10);
  text("Export CSV for the individual booking records.", 40, 746, 10);
  text(`NironCinema / ${workspace} operations`, 40, 800, 9);
  text("1 / 1", 520, 800, 9);
  return canvas;
}

export async function reportPdf(
  report,
  month,
  cinema,
  style = "modern",
  workspace = "Staff",
) {
  const canvas = reportCanvas(report, month, cinema, style, workspace);
  const jpeg = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PDF export failed"))),
      "image/jpeg",
      0.95,
    ),
  );
  return buildImagePdf(
    new Uint8Array(await jpeg.arrayBuffer()),
    canvas.width,
    canvas.height,
  );
}
