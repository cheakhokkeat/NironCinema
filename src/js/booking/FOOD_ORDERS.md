# Food-only orders

`food.html` provides a menu, cinema pickup selection, a five-minute checkout, and customer order history. Payment uses the existing demo workflow; it does not charge a card or payment account.

Orders are saved under `foodOrders` in the existing `nironCinema_data` localStorage object. They are separate from movie `bookings` and never reserve seats. Existing saved data does not need to be reset.

Each order contains `id`, `type: "food"`, `userId`, `locationId`, `food` (item ID, name, sale price and quantity), `foodTotal`, `total`, `date`, `createdAt`, `status`, `paymentMethod`, `demo`, and `activity`. Pickup adds `foodCollectedAt` and `foodCollectedBy`; cancellation adds `cancelledAt`. Activity entries contain an action, actor ID and timestamp.

Customers can cancel their own uncollected demo orders. Staff/admin can record pickup once. Admin can also cancel through the operations function. Monthly reporting combines confirmed ticket and food-only orders for sales totals while movie rankings exclude food-only orders.
