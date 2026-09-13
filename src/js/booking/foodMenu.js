import { getData } from "../data/storage.js";
export function foodQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, Math.min(20, Math.floor(number)))
    : 0;
}
export function foodLines(quantities) {
  return getFoodMenu()
    .filter((item) => foodQuantity(quantities[item.id]) > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: foodQuantity(quantities[item.id]),
    }));
}
export function foodTotal(quantities) {
  return (
    foodLines(quantities).reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0,
    ) / 100
  );
}

export function getFoodMenu() {
  return getData().foods;
}
