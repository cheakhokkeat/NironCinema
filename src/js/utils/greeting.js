export function greeting(name, now = new Date()) {
  const hour = now.getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${salutation}${name ? `, ${String(name).trim()}` : ""}.`;
}
