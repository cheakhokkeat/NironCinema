import "../components/imagePreview.js";
import { layoutFor } from "./seatLayouts.js";
import { recordActivity } from "./activity.js";
import { bookingRecipient } from "./bookingRecipient.js";
import { initSeatZoom } from "../components/seatZoom.js";
import { formatTime } from "../utils/formatTime.js";
import { changeBookingStep } from "./bookingSession.js";
import { showBookingComplete } from "../tickets/ticketActions.js";
import { digitalTicket } from "../tickets/digitalTicket.js";
import { getFoodMenu, foodQuantity, foodLines, foodTotal } from "./foodMenu.js";
import { getData, saveData } from "../data/storage.js";
import { signedInUser, requestAccess } from "../auth/access.js";
import { seatPrice, occupiedSeats, hasSeatGap } from "./seatRules.js";
import { bookingAlert } from "../components/bookingAlert.js";

const key = "nironCinema_seatDraft";
const esc = (v = "") =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) => `$${Number(value).toFixed(2)}`;
let opening = false;

export async function startSeatBooking(showId) {
  if (opening) return;
  opening = true;
  const data = getData(),
    user = signedInUser(),
    show = data.showtimes.find((s) => s.id === showId),
    movie = data.movies.find((m) => m.id === show?.movieId);
  if (!show || !movie) {
    opening = false;
    return;
  }
  const back = `./movie.html?id=${encodeURIComponent(movie.id)}`;
  if (!user) {
    opening = false;
    requestAccess(back);
    return;
  }
  let draft;
  try {
    draft = JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    draft = null;
  }
  const resume = draft?.showId === showId && draft?.userId === user.id;
  if (!resume && /18/.test(String(movie.classification))) {
    const accepted = await bookingAlert(
      "Age warning · 18+",
      "This movie is restricted to viewers aged 18 and over. Please confirm you are at least 18. The cinema may check your ID.",
      { confirm: "I am 18 or older", cancel: "Go back" },
    );
    if (!accepted) {
      opening = false;
      return;
    }
  }
  if (new Date(`${show.date}T${show.time}`) <= new Date()) {
    await bookingAlert(
      "Showtime unavailable",
      "This screening has already started.",
      { confirm: "Back to showtimes", required: true },
    );
    opening = false;
    location.href = back;
    return;
  }
  if (!resume)
    draft = {
      showId,
      userId: user.id,
      deadline: Date.now() + 120000,
      seats: [],
    };
  const layout = layoutFor(show),
    seatRows = layout.rows,
    seatIds = layout.ids;
  let selected = new Set(
      (draft.seats || []).filter((s) => seatIds.includes(s)),
    ),
    step = [1, 2, 3].includes(draft.step) ? draft.step : 1,
    expired = false,
    complete = false,
    zoom = 1;
  const foodMenu = getFoodMenu();
  let payment = ["card", "khqr", "paypal"].includes(draft.payment)
    ? draft.payment
    : "card";
  const food = Object.fromEntries(
    foodMenu.map((item) => [item.id, foodQuantity(draft.food?.[item.id])]),
  );
  const staffBooking = ["staff", "admin"].includes(user.role);
  let recipientIdentifier = staffBooking
    ? String(draft.recipientIdentifier || "")
    : "";
  const main = document.getElementById("pageContent");
  const cinema = data.locations.find((c) => c.id === show.locationId);
  const persist = () => {
    draft.seats = [...selected];
    draft.food = food;
    draft.step = step;
    draft.payment = payment;
    draft.recipientIdentifier = recipientIdentifier;
    sessionStorage.setItem(key, JSON.stringify(draft));
  };
  persist();
  main.innerHTML = `<div class="booking-top">
  <div>
    <p class="text-xs text-nironPink">YOUR MOVIE NIGHT</p>

    <h1
      id="bookingTitle"
      class="mt-2 font-cyber text-2xl font-bold"
    >
      Choose your seats
    </h1>
  </div>

  <span class="booking-timer">
    <i class="fa-regular fa-clock" aria-hidden="true"></i>
    <span id="seatTimer">02:00</span>
  </span>
</div>

<ol class="booking-steps" aria-label="Booking progress">
  ${["Showtime", "Choose seat", "Order review", "Checkout"]
    .map(
      (label, i) => `
        <li data-step="${i}">
          <button type="button" data-go-step="${i}">
            <span><i class="fa-solid ${["fa-calendar-days", "fa-couch", "fa-utensils", "fa-credit-card"][i]}" aria-hidden="true"></i></span>
            ${label}
          </button>
        </li>
      `,
    )
    .join("")}
</ol>

<div class="booking-layout">
  <section
    class="booking-panel"
    id="bookingStage"
  ></section>

  <aside class="booking-panel booking-order">
    <h2 class="text-lg font-bold">Order details</h2>

    <div class="booking-movie">
      <img
        data-image-preview="${esc(movie.title)}" role="button" tabindex="0" src="${esc(movie.poster)}"
        alt=""
      />

      <div>
        <h3 class="font-semibold">
          ${esc(movie.title)}
        </h3>

        <p>
          <span class="classification-tag rounded-lg border px-2 py-1 text-xs">${esc(movie.classification)}</span>
          ·
          ${esc(movie.genre?.replaceAll(";", ", "))}
        </p>
      </div>
    </div>

    <dl>
      ${[
        ["Cinema", cinema?.name || "Not available"],
        ["Date", show.date],
        ["Time", formatTime(show.time)],
        ["Format", show.format || "2D"],
        ["Hall", show.hall],
      ]
        .map(
          ([label, value]) => `
            <div>
              <dt>${label}</dt>
              <dd>${esc(value)}</dd>
            </div>
          `,
        )
        .join("")}
    </dl>

    <div
      id="chosenSeats"
      aria-live="polite"
    ></div>

    <div id="foodOrder"></div>

    <div class="booking-total">
      <span>Total</span>
      <strong id="seatTotal"></strong>
    </div>

    <div class="booking-actions">
      <button id="cancelBooking">
        Cancel
      </button>

      <button
        id="continueBooking"
        class="booking-primary"
      >
        Continue
      </button>
    </div>
  </aside>
</div>
`;
  if (staffBooking) {
    const panel = document.createElement("div");
    panel.className = "booking-recipient";
    panel.innerHTML = `
    <label for="bookFor">
  Book for <small>Optional</small>
</label>

<input
  id="bookFor"
  type="text"
  autocomplete="off"
  placeholder="Customer username or email"
  maxlength="254"
  aria-describedby="bookForStatus"
/>

<p
  id="bookForStatus"
  role="status"
  aria-live="polite"
></p>
      `;
    main.querySelector(".booking-order h2").after(panel);
    const input = panel.querySelector("input");
    input.value = recipientIdentifier;
    function showRecipient() {
      const status = panel.querySelector("p");
      try {
        const current = getData(),
          recipient = bookingRecipient(current, user.id, recipientIdentifier),
          customer = current.users.find((u) => u.id === recipient.userId);
        status.textContent = customer
          ? "Ticket will appear in My Tickets for " +
            customer.name +
            " (" +
            customer.email +
            ")."
          : "Walk-in guest. Leave blank to book without an account; print or share the ticket after checkout.";
        status.classList.remove("text-red-400");
      } catch (error) {
        status.textContent = error.message;
        status.classList.add("text-red-400");
      }
    }
    input.addEventListener("input", () => {
      if (expired || complete) return;
      recipientIdentifier = input.value;
      persist();
      showRecipient();
    });
    showRecipient();
  }
  const stage = document.getElementById("bookingStage");
  let seatZoomController;
  const seatTotal = () =>
    [...selected].reduce(
      (sum, seat) => sum + seatPrice(seat, show.price, layout),
      0,
    );
  const total = () => seatTotal() + foodTotal(food);
  function updateOrder() {
    document.getElementById("chosenSeats").innerHTML = selected.size
      ? `<p class="text-xs text-gray-400">Selected seats (${selected.size})</p><div class="seat-chips">${[
          ...selected,
        ]
          .sort()
          .map(
            (s) =>
              `<span>${s} · ${money(seatPrice(s, show.price, layout))}</span>`,
          )
          .join("")}</div>`
      : '<div class="empty-seats"><i class="fa-solid fa-couch" aria-hidden="true"></i><p>Your selection is empty</p><small>Choose a seat to get started.</small></div>';
    document.getElementById("foodOrder").innerHTML =
      `<div class="food-subtotals"><p><span>Seats</span><span>${money(seatTotal())}</span></p>${foodLines(
        food,
      )
        .map(
          (item) =>
            `<div class="order-food-item">
  <p>
    <span>${esc(item.name)}</span>
    <span>${money(item.price * item.quantity)}</span>
  </p>

  <div class="order-food-controls"><div class="food-quantity">
    <button
      type="button"
      data-food="${item.id}"
      data-delta="-1"
      aria-label="Remove one ${esc(item.name)}"
    >
      &minus;
    </button>

    <input
      type="number"
      inputmode="numeric"
      min="0"
      max="20"
      step="1"
      data-food-input="${item.id}"
      aria-label="${esc(item.name)} order quantity"
      value="${item.quantity}"
    />

    <button
      type="button"
      data-food="${item.id}"
      data-delta="1"
      aria-label="Add one ${esc(item.name)}"
      ${item.quantity === 20 ? "disabled" : ""}
    >
      +
    </button>
  </div>
  <button type="button" class="order-food-remove" data-remove-food="${esc(item.id)}" aria-label="Remove ${esc(item.name)} from order"><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remove</button></div>
</div>
`,
        )
        .join(
          "",
        )}<p><span>Food & drinks</span><span>${money(foodTotal(food))}</span></p></div>`;

    document.getElementById("seatTotal").textContent = money(total());
    persist();
  }
  function goStep(next) {
    if (expired || complete) return;
    if (!changeBookingStep(draft, step, next)) {
      void timeout();
      return;
    }
    step = next;
    renderStage();
    tick();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderStage() {
    seatZoomController?.destroy();
    document.getElementById("bookingTitle").textContent = [
      "",
      "Choose your seats",
      "Order review",
      "Checkout",
    ][step];
    main.querySelectorAll("[data-step]").forEach((item) => {
      const n = Number(item.dataset.step);
      item.querySelector("button").disabled = n >= step;
      item.classList.toggle("is-active", n === step);
      item.classList.toggle("is-done", n < step);
      if (n === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    document.getElementById("continueBooking").textContent =
      step === 3
        ? "Pay & get demo tickets"
        : step === 2
          ? "Checkout"
          : "Continue";
    if (step === 1) {
      const occupied = occupiedSeats(getData(), showId);
      zoom = 1;
      stage.innerHTML = `<div class="flex items-center justify-between gap-3"><h2 class="text-lg font-bold">Choose seats</h2><div class="seat-zoom"><button data-zoom="-1" aria-label="Zoom out">−</button><span id="zoomLabel">100%</span><button data-zoom="1" aria-label="Zoom in">+</button></div></div><p class="mt-3 text-xs leading-relaxed text-gray-400">Please do not leave a gap near the edge or between seats.</p><div class="seat-viewport"><div id="seatCanvas"><div class="cinema-screen">SCREEN</div><div class="seat-map" style="--seat-columns:${layout.columns}">${seatRows
        .map(
          (row) =>
            `<div class="seat-row"><span class="seat-row-label">${row}</span>${Array.from(
              { length: layout.columns },
              (_, i) => {
                const seat = row + (i + 1);
                return `<button type="button" data-seat="${seat}" class="seat ${layout.premiumRows.includes(row) ? "premium" : ""}" aria-label="Seat ${seat}, ${money(seatPrice(seat, show.price, layout))}${occupied.has(seat) ? ", unavailable" : ""}" aria-pressed="${selected.has(seat)}" ${occupied.has(seat) ? "disabled" : ""}><i class="fa-solid fa-couch" aria-hidden="true"></i><span>${i + 1}</span></button>`;
              },
            ).join("")}<span class="seat-row-label">${row}</span></div>`,
        )
        .join(
          "",
        )}</div></div></div><div class="seat-legend"><span><i class="fa-solid fa-couch"></i> Standard ${money(show.price)}</span><span class="text-nironPink"><i class="fa-solid fa-couch"></i> Premium ${money(Number(show.price) + 2)}</span><span class="text-nironBlue"><i class="fa-solid fa-couch"></i> Selected</span><span class="text-gray-500"><i class="fa-solid fa-couch"></i> Unavailable</span></div>`;
      seatZoomController = initSeatZoom(document.getElementById("seatCanvas"));
    } else if (step === 2) {
      stage.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-cyber text-xl font-bold">Food & drinks</h2><span class="rounded-full bg-nironBlue/10 px-3 py-1 text-xs text-nironBlue">Optional</span></div><p class="mt-3 text-sm text-gray-400">Add something for your movie, or continue without extras.</p><div class="food-grid">${foodMenu.map((item) => `<article class="food-card"><button type="button" class="food-card-add" data-food="${esc(item.id)}" data-delta="1" aria-label="Add one ${esc(item.name)}" ${food[item.id] === 20 ? "disabled" : ""}></button><div class="food-art relative z-10">${item.image ? `<button type="button" data-image-preview="${esc(item.name)}" class="h-full w-full cursor-zoom-in" aria-label="Preview ${esc(item.name)}"><img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"></button>` : `<i class="fa-solid fa-utensils" aria-hidden="true"></i>`}</div><h3>${esc(item.name)}</h3><p>${esc(item.description || "A cinema treat to enjoy with your movie.")}</p><strong>${money(item.price)}</strong><div class="food-quantity"><button type="button" data-food="${item.id}" data-delta="-1" aria-label="Remove one ${esc(item.name)}" ${food[item.id] === 0 ? "disabled" : ""}>&minus;</button><input type="number" inputmode="numeric" min="0" max="20" step="1" data-food-input="${item.id}" aria-label="${esc(item.name)} quantity" value="${food[item.id]}"><button type="button" data-food="${item.id}" data-delta="1" aria-label="Add one ${esc(item.name)}" ${food[item.id] === 20 ? "disabled" : ""}>+</button></div></article>`).join("")}</div><button id="editSeats" class="mt-6 text-sm text-nironBlue">&larr; Edit seats</button>`;
      document.getElementById("editSeats").onclick = () => {
        if (expired || complete) return;
        if (Date.now() >= draft.deadline) {
          void timeout();
          return;
        }
        goStep(1);
      };
    } else {
      stage.innerHTML = `<h2 class="font-cyber text-xl font-bold">Checkout</h2><p class="mt-3 text-sm text-gray-400">Choose a payment method. Demo mode: no payment details or real charge required.</p><fieldset class="payment-methods"><legend>Payment method</legend>${[
        ["card", "fa-credit-card", "Debit/Credit Card"],
        ["khqr", "fa-qrcode", "ABA KHQR"],
        ["paypal", "fa-wallet", "PayPal"],
      ]
        .map(
          ([id, icon, label]) =>
            `<label><input type="radio" name="paymentMethod" value="${id}" ${payment === id ? "checked" : ""}><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${label}</span><small>Demo</small></label>`,
        )
        .join(
          "",
        )}</fieldset><div class="demo-payment-note"><i class="fa-solid fa-lock" aria-hidden="true"></i> All methods are enabled for demo checkout. No card, bank or PayPal information is collected.</div><button id="editSeats" class="mt-6 text-sm text-nironBlue">Back to food & drinks</button>`;
      document.getElementById("editSeats").onclick = () => {
        if (expired || complete) return;
        if (Date.now() >= draft.deadline) {
          void timeout();
          return;
        }
        goStep(2);
      };
    }
    updateOrder();
  }
  async function timeout() {
    if (expired || complete) return;
    expired = true;
    seatZoomController?.destroy();
    clearInterval(timer);
    sessionStorage.removeItem(key);
    main
      .querySelectorAll("button, input")
      .forEach((control) => (control.disabled = true));
    await bookingAlert(
      "Session timed out",
      "Your booking session has ended. Please choose a showtime again.",
      {
        confirm: "Back to showtimes",
        required: true,
      },
    );
    location.href = back;
  }
  const tick = () => {
    const left = Math.max(0, Math.ceil((draft.deadline - Date.now()) / 1000));
    document.getElementById("seatTimer").textContent =
      `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
    if (!left) void timeout();
  };
  const timer = setInterval(tick, 250);
  document.addEventListener("visibilitychange", tick);
  main.addEventListener("click", (event) => {
    if (expired || complete) return;
    if (Date.now() >= draft.deadline) {
      void timeout();
      return;
    }
    const stepButton = event.target.closest("[data-go-step]");
    if (stepButton && !stepButton.disabled) {
      const next = Number(stepButton.dataset.goStep);
      if (next === 0) {
        document.getElementById("cancelBooking").click();
      } else if (next < step) goStep(next);
      return;
    }
    const removeFood = event.target.closest("[data-remove-food]");
    if (removeFood) {
      setFood(removeFood.dataset.removeFood, 0);
      document
        .getElementById("continueBooking")
        ?.focus({ preventScroll: true });
      return;
    }
    const foodButton = event.target.closest("[data-food]");
    if (foodButton) {
      setFood(
        foodButton.dataset.food,
        food[foodButton.dataset.food] + Number(foodButton.dataset.delta),
      );
      return;
    }
    const zoomButton = event.target.closest("[data-zoom]");
    if (zoomButton) {
      zoom = Math.max(
        0.75,
        Math.min(1.75, zoom + Number(zoomButton.dataset.zoom) * 0.25),
      );
      seatZoomController.setScale(zoom);
      document.getElementById("zoomLabel").textContent =
        `${Math.round(zoom * 100)}%`;
      return;
    }
    const button = event.target.closest("[data-seat]");
    if (!button || button.disabled) return;
    const seat = button.dataset.seat;
    const next = new Set(selected);
    if (next.has(seat)) next.delete(seat);
    else next.add(seat);
    const occupied = occupiedSeats(getData(), showId);
    if (occupied.has(seat)) {
      button.disabled = true;
      void bookingAlert(
        "Seat unavailable",
        "This seat has just been booked. Please choose another seat.",
        { confirm: "Choose another seat", required: true },
      );
      return;
    }
    if (hasSeatGap(next, occupied, layout)) {
      void bookingAlert(
        "Please do not leave one empty seat",
        "In the same row, do not leave a single empty seat next to the left or right wall, or between chosen seats. Choose the adjacent seat first.",
        { confirm: "Choose adjacent seats", required: true },
      );
      return;
    }
    selected = next;
    button.setAttribute("aria-pressed", String(selected.has(seat)));
    updateOrder();
  });
  function setFood(id, value) {
    if (expired || complete) return;
    if (Date.now() >= draft.deadline) {
      void timeout();
      return;
    }
    if (!foodMenu.some((item) => item.id === id)) return;
    food[id] = foodQuantity(value);
    const input = main.querySelector('[data-food-input="' + id + '"]');
    if (input) input.value = food[id];
    main.querySelectorAll('[data-food="' + id + '"]').forEach((button) => {
      button.disabled =
        Number(button.dataset.delta) < 0 ? food[id] === 0 : food[id] === 20;
    });
    const focused = document.activeElement;
    const inOrder = focused?.closest("#foodOrder");
    updateOrder();
    if (inOrder) {
      const replacement = document.querySelector(
        '#foodOrder [data-food-input="' + id + '"]',
      );
      replacement?.focus();
    }
  }
  main.addEventListener("input", (event) => {
    if (event.target.matches("[data-food-input]"))
      setFood(event.target.dataset.foodInput, event.target.value);
  });
  main.addEventListener("change", (event) => {
    if (event.target.name === "paymentMethod") {
      if (expired || Date.now() >= draft.deadline) {
        void timeout();
        return;
      }
      payment = event.target.value;
      persist();
    }
  });
  document.getElementById("cancelBooking").onclick = async () => {
    if (
      await bookingAlert(
        "Cancel booking?",
        "Your selected seats will be cleared.",
        { confirm: "Cancel booking", cancel: "Keep choosing" },
      )
    ) {
      if (expired) return;
      clearInterval(timer);
      sessionStorage.removeItem(key);
      await bookingAlert(
        "Booking cancelled successfully",
        "Your seat selection has been cleared.",
        { confirm: "Done", required: true, success: true },
      );
      location.href = back;
    }
  };
  document.getElementById("continueBooking").onclick = async () => {
    if (expired || complete) return;
    if (Date.now() >= draft.deadline) {
      void timeout();
      return;
    }
    if (signedInUser()?.id !== user.id) {
      clearInterval(timer);
      sessionStorage.removeItem(key);
      location.href = back;
      return;
    }
    if (!selected.size) {
      await bookingAlert(
        "Choose a seat",
        "Select at least one seat to continue.",
        { confirm: "Choose seats", required: true },
      );
      return;
    }
    const latest = getData(),
      occupied = occupiedSeats(latest, showId);
    const currentShow = latest.showtimes.find((s) => s.id === showId);
    if (
      !currentShow ||
      [
        "movieId",
        "locationId",
        "date",
        "time",
        "hall",
        "format",
        "price",
        "seatLayout",
        "audioLanguage",
        "subtitleLanguage",
        "sound",
      ].some((field) => currentShow[field] !== show[field]) ||
      !latest.locations.some(
        (l) => l.id === currentShow.locationId && l.active === "Yes",
      )
    ) {
      await bookingAlert(
        "Screening updated",
        "The screening details changed. Please choose your showtime again.",
        { confirm: "Back to showtimes", required: true },
      );
      clearInterval(timer);
      sessionStorage.removeItem(key);
      location.href = back;
      return;
    }
    if ([...selected].some((s) => occupied.has(s))) {
      selected = new Set([...selected].filter((s) => !occupied.has(s)));
      goStep(1);
      await bookingAlert(
        "Seats unavailable",
        "Some seats were booked. Please check your selection.",
        { confirm: "Choose seats", required: true },
      );
      return;
    }
    if (hasSeatGap(selected, occupied, layout)) {
      await bookingAlert(
        "Please choose seats together",
        "Please do not leave a gap near the edge or between seats. Move your selection to avoid leaving a single empty seat.",
        { confirm: "Adjust seats", required: true },
      );
      return;
    }
    if (step < 3) {
      goStep(step + 1);
      return;
    }
    let recipient;
    try {
      recipient = bookingRecipient(latest, user.id, recipientIdentifier);
    } catch (error) {
      await bookingAlert("Check booking account", error.message, {
        confirm: "Edit account",
        required: true,
      });
      document.getElementById("bookFor")?.focus();
      return;
    }
    const booking = {
      id: `nironB_${crypto.randomUUID()}`,
      ...recipient,
      showtimeId: showId,
      seats: [...selected],
      food: foodLines(food),
      seatTotal: seatTotal(),
      foodTotal: foodTotal(food),
      total: total(),
      paymentMethod: payment,
      createdAt: new Date().toISOString(),
      paymentStatus: "Demo approved",
      status: "Confirmed",
      date: new Date().toISOString().slice(0, 10),
      demo: true,
    };
    try {
      recordActivity(booking, signedInUser(), "Booking created");
      latest.bookings.push(booking);
      saveData(latest);
    } catch {
      await bookingAlert(
        "Could not save",
        "Please try again before your session expires.",
        { confirm: "Try again", required: true },
      );
      return;
    }
    complete = true;
    seatZoomController?.destroy();
    clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
    sessionStorage.removeItem(key);
    main.querySelectorAll("[data-step]").forEach((item) => {
      item.classList.add("is-done");
      item.classList.remove("is-active");
    });
    document.querySelector(".booking-layout").innerHTML =
      `<section class="booking-complete"><h2 class="mb-5 font-cyber text-2xl">Your movie night is booked!</h2>${digitalTicket(booking, latest)}<a href="${staffBooking ? "./staff/index.html" : "./tickets.html"}" class="mt-6 inline-block text-nironBlue">${staffBooking ? "Back to staff workspace" : "View my tickets"}</a></section>`;

    document.getElementById("seatTimer").textContent = "Complete";
    window.dispatchEvent(new Event("booking-complete"));
    showBookingComplete(booking, latest);
  };
  renderStage();
  tick();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function resumeSeatBooking(movieId) {
  let draft;
  try {
    draft = JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return;
  }
  if (
    draft &&
    getData().showtimes.some(
      (show) => show.id === draft.showId && show.movieId === movieId,
    )
  )
    void startSeatBooking(draft.showId);
}
