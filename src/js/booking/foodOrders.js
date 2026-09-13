export function createFoodOrder(
  data,
  userId,
  locationId,
  quantities,
  payment,
  now = new Date(),
) {
  const user = data.users.find((u) => u.id === userId);
  if (!user) throw new Error("Please sign in before ordering.");
  if (!data.locations.some((l) => l.id === locationId && l.active === "Yes"))
    throw new Error("Choose an available cinema for pickup.");
  if (!["Debit/Credit Card", "ABA KHQR", "PayPal"].includes(payment))
    throw new Error("Choose a payment method.");
  const food = Object.entries(quantities)
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([id, quantity]) => {
      const item = data.foods.find((f) => f.id === id && f.active !== "No");
      if (
        !item ||
        !Number.isInteger(Number(quantity)) ||
        quantity > 20 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
      )
        throw new Error("The food menu changed. Review your order.");
      return {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(quantity),
      };
    });
  if (!food.length) throw new Error("Add at least one food or drink.");
  const total =
    food.reduce((sum, f) => sum + Math.round(f.price * 100) * f.quantity, 0) /
    100;
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const order = {
    id: "food_" + crypto.randomUUID(),
    type: "food",
    userId,
    locationId,
    food,
    foodTotal: total,
    total,
    seats: [],
    date,
    createdAt: now.toISOString(),
    status: "Confirmed",
    paymentMethod: payment,
    demo: true,
    activity: [
      { action: "Food order placed", actorId: userId, at: now.toISOString() },
    ],
  };
  (data.foodOrders ||= []).push(order);
  return order;
}
export function updateFoodOrder(data, actorId, id, action, now = new Date()) {
  const actor = data.users.find((u) => u.id === actorId),
    order = (data.foodOrders || []).find((o) => o.id === id);
  if (!actor || !order) throw new Error("Order unavailable.");
  if (order.status !== "Confirmed" || order.foodCollectedAt)
    throw new Error("This order has already been collected or cancelled.");
  if (action === "collect") {
    if (!["staff", "admin"].includes(actor.role))
      throw new Error("Staff access is required.");
    order.foodCollectedAt = now.toISOString();
    order.foodCollectedBy = actorId;
  } else if (action === "cancel") {
    if (actor.id !== order.userId && actor.role !== "admin")
      throw new Error("You cannot cancel this order.");
    order.status = "Cancelled";
    order.cancelledAt = now.toISOString();
  } else throw new Error("Unknown order action.");
  (order.activity ||= []).push({
    action: action === "collect" ? "Food collected" : "Food order cancelled",
    actorId,
    at: now.toISOString(),
  });
  return order;
}
