export function initFoodNavigation() {
  const add = (parent, mobile = false) => {
    if (!parent || parent.querySelector("[data-food-link]")) return;
    const a = document.createElement("a");
    a.href = "./food.html";
    a.dataset.foodLink = "";
    a.className = mobile
      ? "flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] text-gray-400 hover:text-nironBlue"
      : "rounded-full px-4 py-2 text-sm text-gray-400 hover:bg-nironBlue/10 hover:text-nironBlue";
    a.innerHTML =
      '<i class="fa-solid fa-utensils" aria-hidden="true"></i> Food & drinks';
    if (location.pathname.endsWith("/food.html")) {
      a.setAttribute("aria-current", "page");
      a.classList.add("text-nironBlue", "bg-nironBlue/10");
    }
    const offers = [...parent.querySelectorAll("a")].find(
      (link) =>
        link.querySelector(".fa-tags") ||
        /offers/i.test(link.textContent) ||
        link.getAttribute("href")?.includes("#ads-container"),
    );
    if (offers) offers.after(a);
    else parent.append(a);
    if (mobile)
      parent.style.gridTemplateColumns = `repeat(${parent.children.length},minmax(0,1fr))`;
  };
  add(document.querySelector("header nav"));
  add(document.querySelector("[data-bottom-nav]"), true);
  add(document.querySelector(".user-control-links section"));
}
