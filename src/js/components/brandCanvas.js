// Preserve the header's gradient N icon in every export palette.
export function drawCinemaBrand(ctx, x, y, { size = 28, light = false } = {}) {
  ctx.save();
  const gradient = ctx.createLinearGradient(x, y + size, x + size, y);
  gradient.addColorStop(0, "#00f0ff");
  gradient.addColorStop(1, "#ff007f");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 4);
  ctx.fill();
  ctx.font = `bold ${size * 0.625}px Orbitron, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText("N", x + size / 2, y + size / 2);
  ctx.textAlign = "left";
  ctx.font = `800 ${size * 0.625}px Orbitron, sans-serif`;
  ctx.fillStyle = light ? "#111827" : "#ffffff";
  ctx.fillText("NIRON", x + size + 8, y + size / 2);
  const offset = ctx.measureText("NIRON").width;
  ctx.fillStyle = "#00f0ff";
  ctx.fillText("CINEMA", x + size + 8 + offset, y + size / 2);
  ctx.restore();
}
