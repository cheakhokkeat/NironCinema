export function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(value || ""));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59)
    return "Not available";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}
