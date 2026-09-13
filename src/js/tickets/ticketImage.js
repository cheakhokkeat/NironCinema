import { drawCinemaBrand } from "../components/brandCanvas.js";
import { fallbackPoster } from "../components/posterFallback.js";
import { formatTime } from "../utils/formatTime.js";
// Render a standalone PNG without depending on external fonts or image CORS.
export async function ticketImage(
  booking,
  data,
  style = "simple",
  colorMode = "light",
) {
  const fullColor = colorMode === "full";
  const show = data.showtimes.find((item) => item.id === booking.showtimeId);
  const movie = data.movies.find((item) => item.id === show?.movieId);
  const cinema = data.locations.find((item) => item.id === show?.locationId);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image export unavailable");
  const width = 440,
    padding = 40,
    textWidth = width - padding * 2;
  const lines = [];
  let y = 58;
  let textX = padding,
    availableWidth = textWidth;
  function text(value, size = 13, color = "#444444", bold = false) {
    if (fullColor)
      color =
        {
          "#444444": "#cbd5e1",
          "#111111": "#f3f4f6",
          "#126478": "#00f0ff",
          "#555555": "#94a3b8",
        }[color] || color;
    ctx.font = `${bold ? "bold " : ""}${size}px sans-serif`;
    // Character wrapping also handles long booking IDs and seat lists.
    let line = "";
    for (const character of String(value ?? "")) {
      if (ctx.measureText(line + character).width > availableWidth && line) {
        lines.push({ text: line, x: textX, y, size, color, bold });
        y += size * 1.5;
        line = "";
      }
      line += character;
    }
    lines.push({ text: line, x: textX, y, size, color, bold });
    y += size * 1.5;
  }
  y += 30; // Reserve the header logo row.
  text(
    booking.demo ? "DEMO TICKET" : "DIGITAL TICKET",
    10,
    fullColor ? "#ff69b4" : "#126478",
  );
  const posterTop = y + 14;
  const headerLine = y + 2;
  if (style === "poster") {
    textX = 116;
    availableWidth = width - padding - textX;
  }
  y += 16;
  text(movie?.title || "Movie unavailable", 17, "#111111", true);
  text(cinema?.name || "Cinema unavailable");
  y += 12;
  text(`STATUS  ${booking.status}`, 10, "#126478");
  const factsX = textX,
    factsWidth = availableWidth;
  function factRow(leftLabel, leftValue, rightLabel, rightValue) {
    const rowTop = y,
      columnWidth = (factsWidth - 16) / 2;
    textX = factsX;
    availableWidth = columnWidth;
    text(leftLabel, 9, "#555555");
    text(leftValue, 12, "#111111", true);
    const leftBottom = y;
    y = rowTop;
    textX = factsX + columnWidth + 16;
    text(rightLabel, 9, "#555555");
    text(rightValue, 12, "#111111", true);
    y = Math.max(leftBottom, y) + 8;
    textX = factsX;
    availableWidth = factsWidth;
  }
  factRow(
    "DATE",
    show?.date || "Not available",
    "TIME",
    formatTime(show?.time),
  );
  factRow(
    "HALL",
    show?.hall || "Not available",
    "FORMAT",
    show?.format || "2D",
  );
  text(`SEATS  ${(booking.seats || []).join(", ")}`, 13, "#111111", true);
  y = Math.max(y, style === "poster" ? posterTop + 112 : y);
  textX = padding;
  availableWidth = textWidth;
  const divider = y + 6;
  y += 28;
  for (const item of booking.food || [])
    text(`${item.name} × ${item.quantity}`, 12);
  text(`TOTAL  $${Number(booking.total).toFixed(2)}`, 16, "#111111", true);
  y += 8;
  text(
    booking.demo ? "Demo payment · not valid for admission" : booking.status,
    11,
    "#555555",
  );
  text(`Reference: ${booking.id}`, 10, "#555555");
  const height = Math.ceil(y + 42);
  canvas.width = width * 2;
  canvas.height = height * 2;
  ctx.scale(2, 2);
  ctx.fillStyle = fullColor ? "#0b0f19" : "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  if (fullColor) {
    const gradient = ctx.createLinearGradient(22, 22, width - 22, height - 22);
    gradient.addColorStop(0, "#10212c");
    gradient.addColorStop(0.65, "#0b0f19");
    ctx.fillStyle = gradient;
  }
  ctx.beginPath();
  ctx.roundRect(22, 22, width - 44, height - 44, 16);
  ctx.fill();
  if (style === "poster") {
    const poster = new Image();
    poster.crossOrigin = "anonymous";
    try {
      if (!movie?.poster) throw new Error("No poster");
      poster.src = movie.poster;
      await Promise.race([
        poster.decode(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Poster timeout")), 8000),
        ),
      ]);
      const scale = Math.min(
        62 / poster.naturalWidth,
        100 / poster.naturalHeight,
      );
      const w = poster.naturalWidth * scale,
        h = poster.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(padding, posterTop, w, h, 8);
      ctx.clip();
      ctx.drawImage(poster, padding, posterTop, w, h);
      ctx.restore();
    } catch {
      const fallback = new Image();
      fallback.src = fallbackPoster;
      try {
        await fallback.decode();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(padding, posterTop, 62, 100, 8);
        ctx.clip();
        ctx.drawImage(fallback, padding, posterTop, 62, 100);
        ctx.restore();
      } catch {
        ctx.fillStyle = "#10212c";
        ctx.fillRect(padding, posterTop, 62, 100);
        drawCinemaBrand(ctx, padding + 5, posterTop + 35, { size: 18 });
      }
    }
  }
  ctx.strokeStyle = "#1d5260";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(22, 22, width - 44, height - 44, 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(22, headerLine);
  ctx.lineTo(width - 22, headerLine);
  ctx.stroke();
  ctx.strokeStyle = "#5c6a78";
  ctx.lineWidth = 0.7;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.roundRect(15, 15, width - 30, height - 30, 18);
  ctx.stroke();
  ctx.strokeStyle = "#37606b";
  ctx.beginPath();
  ctx.moveTo(padding, divider);
  ctx.lineTo(width - padding, divider);
  ctx.stroke();
  ctx.setLineDash([]);
  // Corner registration marks sit outside the cut guide.
  for (const [x, yy, dx, dy] of [
    [15, 15, -1, -1],
    [width - 15, 15, 1, -1],
    [15, height - 15, -1, 1],
    [width - 15, height - 15, 1, 1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * 4, yy);
    ctx.lineTo(x + dx * 11, yy);
    ctx.moveTo(x, yy + dy * 4);
    ctx.lineTo(x, yy + dy * 11);
    ctx.stroke();
  }
  drawCinemaBrand(ctx, padding, 36, { size: 28, light: !fullColor });
  for (const line of lines) {
    ctx.font = `${line.bold ? "bold " : ""}${line.size}px sans-serif`;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, line.x, line.y);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image export failed")),
      "image/png",
    ),
  );
}
