import { matchesBookingStatus } from "./bookingFilters.js";
import { renderFoodOrders } from "./foodOrdersPanel.js";
import { actionFeedback } from "../src/js/components/actionFeedback.js";
import {
  movieHeading,
  statusBadge,
} from "../src/js/components/workspaceCards.js";
import { initWorkspaceNavigation } from "../src/js/components/workspaceNavigation.js";
import { pageJump, initPageJump } from "../src/js/components/pageJump.js";
let activityPage = 1;
import { requestCancellation } from "./cancellations.js";
import { bookingActivities } from "../src/js/booking/activity.js";
import { collectFood, shiftSummary } from "./shift.js";
import { greeting } from "../src/js/utils/greeting.js";
import { screeningAvailability } from "./operations.js";
import { initDatePicker } from "./datePicker.js";
import { layoutFor } from "../src/js/booking/seatLayouts.js";
import { enhanceSelect } from "../src/js/components/selectMenu.js";
import { reportPdf, reportCanvas } from "./reportPdf.js";
import { renderCharts } from "./reportCharts.js";
import { initMonthPicker } from "./monthPicker.js";
import { getData, saveData, signoutUser } from "../src/js/data/storage.js";
import { signedInUser } from "../src/js/auth/access.js";
import { initProfile } from "../src/js/auth/profileModal.js";
import { bookingAlert } from "../src/js/components/bookingAlert.js";
import { digitalTicket } from "../src/js/tickets/digitalTicket.js";
import { initTicketActions } from "../src/js/tickets/ticketActions.js";
import { formatTime } from "../src/js/utils/formatTime.js";
import {
  isStaff,
  localDate,
  checkIn,
  monthlyReport,
  reportCsv,
} from "./operations.js";

const $ = (selector) => document.querySelector(selector);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) => "$" + Number(value).toFixed(2);
let page = 1,
  showPage = 1,
  chartMetric = "sales";
function authorized() {
  const user = signedInUser();
  $("#adminWorkspaceLink").hidden = user?.role !== "admin";
  if (isStaff(user)) return true;
  location.replace("./login.html");
  return false;
}
if (authorized()) {
  const report = $("#report");
  const toolbar = document.createElement("div");
  toolbar.className =
    "workspace-report-controls mb-5 grid w-full gap-3 sm:grid-cols-3";
  const cinemaSlot = document.createElement("div");
  cinemaSlot.id = "reportCinemaSlot";
  toolbar.append(
    cinemaSlot,
    report.querySelector(".report-period"),
    report.querySelector(".report-paper-label"),
  );
  const exports = report.querySelector(".report-export");
  exports.className =
    "workspace-report-exports mb-5 flex flex-wrap justify-end gap-2";
  exports.append($("#export"), $("#exportPdf"), $("#printReport"));
  const metrics = $("#metrics");
  metrics.before(toolbar, exports);
  report.querySelector(".chart-switch").classList.add("mb-4");

  initPageJump($("#workspace"), (section, number) => {
    if (!authorized()) return;
    if (section === "desk") page = number;
    else if (section === "screenings") showPage = number;
    else if (section === "activity") activityPage = number;
    render();
  });
  $("#workspace").hidden = false;
  const name = () => {
    $("#staffName").textContent = signedInUser()?.name || "Staff";
    $("#staffGreeting").textContent = greeting(signedInUser()?.name);
  };
  name();
  initProfile(name, $("#joinAuthBtn"));
  $("#day").value = "";
  $("#scheduleDay").value = localDate();
  $("#month").value = localDate().slice(0, 7);
  getData().locations.forEach((cinema) => {
    const option = new Option(cinema.name, cinema.id);
    $("#cinema").add(option);
  });
  enhanceSelect($("#cinema"), "fa-location-dot");
  enhanceSelect($("#reportStyle"), "fa-file-lines");
  enhanceSelect($("#status"), "fa-filter");
  initWorkspaceNavigation({
    root: $("#workspace"),
    navigation: $(".staff-tabs"),
    role: "staff",
    quick: [
      ['[data-view="desk"]', "Ticket desk", "fa-ticket"],
      ['[data-view="schedule"]', "Screenings", "fa-calendar-day"],
      ['[data-view="report"]', "Reports", "fa-chart-column"],
    ],
  });
  initMonthPicker($("#month"), render);
  initDatePicker($("#day"), true);
  initDatePicker($("#scheduleDay"));
  const catalogue = getData();
  catalogue.movies
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((movie) =>
      $("#screenMovie").add(new Option(movie.title, movie.id)),
    );
  [...new Set(catalogue.showtimes.map((show) => show.hall).filter(Boolean))]
    .sort()
    .forEach((hall) => $("#screenHall").add(new Option(hall, hall)));
  enhanceSelect($("#screenMovie"), "fa-film");
  enhanceSelect($("#screenHall"), "fa-door-open");
  enhanceSelect($("#screenAvailability"), "fa-circle-check");
  $("#resetScreenFilters").onclick = () => {
    for (const id of ["screenMovie", "screenHall", "screenAvailability"]) {
      $("#" + id).value = "";
      $("#" + id).dispatchEvent(new Event("change"));
    }
  };
  $("#shows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view-seats]");
    if (button && authorized()) openSeats(button.dataset.viewSeats);
  });
  document.querySelectorAll("[data-metric]").forEach((button) =>
    button.addEventListener("click", () => {
      chartMetric = button.dataset.metric;
      document
        .querySelectorAll("[data-metric]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      render();
    }),
  );
  $("#showPages").addEventListener("click", (event) => {
    const button = event.target.closest("[data-show-page]");
    if (button && !button.disabled) {
      showPage = Number(button.dataset.showPage);
      render();
      $("#showCount").scrollIntoView({ block: "center" });
    }
  });
  initTicketActions();
  document.querySelectorAll("[data-view]").forEach((button) =>
    button.addEventListener("click", () => {
      if (!authorized()) return;
      document.querySelectorAll("[data-view]").forEach((tab) => {
        tab.removeAttribute("aria-current");
        $("#" + tab.dataset.view).hidden = true;
      });
      button.setAttribute("aria-current", "page");
      $("#" + button.dataset.view).hidden = false;
      const cinema = $("#cinema").closest(".staff-cinema");
      (button.dataset.view === "report"
        ? $("#reportCinemaSlot")
        : $(".staff-intro")
      ).append(cinema);
      render();
    }),
  );
  for (const id of [
    "cinema",
    "day",
    "status",
    "scheduleDay",
    "month",
    "screenMovie",
    "screenHall",
    "screenAvailability",
  ])
    $("#" + id).addEventListener("change", () => {
      page = 1;
      showPage = 1;
      render();
    });
  $("#search").addEventListener("input", () => {
    page = 1;
    render();
  });
  $("#clear").onclick = () => {
    $("#search").value = $("#day").value = $("#status").value = "";
    $("#status").dispatchEvent(new Event("change"));
    $("#day").dispatchEvent(new Event("change"));
    page = 1;
    render();
  };
  $("#logout").onclick = async () => {
    if (
      !(await bookingAlert("Sign out?", "End your staff session?", {
        confirm: "Sign out",
        cancel: "Stay",
      }))
    )
      return;
    signoutUser();
    $("#workspace").hidden = true;
    await bookingAlert(
      "Signed out successfully",
      "Your staff session has ended.",
      { success: true },
    );
    location.replace("./login.html");
  };
  $("#bookings").addEventListener("click", (event) => {
    const button = event.target.closest("[data-booking]");
    if (button && authorized()) openBooking(button.dataset.booking);
  });
  $("#pages").addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (button) {
      page = Number(button.dataset.page);
      render();
      $("#resultCount").scrollIntoView({ block: "center" });
    }
  });
  $("#printReport").onclick = () => {
    if (!authorized()) return;
    const report = monthlyReport(
      getData(),
      $("#month").value,
      $("#cinema").value,
    );
    const canvas = reportCanvas(
      report,
      $("#month").value,
      $("#cinema").selectedOptions[0].textContent,
      $("#reportStyle").value,
    );
    const root = document.createElement("div");
    root.id = "ticketPrintRoot";
    const img = new Image();
    img.className = "staff-report-print";
    img.alt = "Monthly staff report";
    img.src = canvas.toDataURL("image/png");
    root.append(img);
    document.getElementById("ticketPrintRoot")?.remove();
    document.body.append(root);
    img
      .decode()
      .then(() => {
        window.addEventListener("afterprint", () => root.remove(), {
          once: true,
        });
        window.print();
      })
      .catch(() => {
        root.remove();
        void bookingAlert("Could not print", "Please try again.", {
          confirm: "OK",
          required: true,
        });
      });
  };
  $("#exportPdf").onclick = async () => {
    if (!authorized()) return;
    const button = $("#exportPdf");
    button.disabled = true;
    try {
      const month = $("#month").value,
        cinema = $("#cinema").selectedOptions[0].textContent;
      const report = monthlyReport(getData(), month, $("#cinema").value);
      const blob = await reportPdf(
        report,
        month,
        cinema,
        $("#reportStyle").value,
      );
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `NironCinema-report-${month}.pdf`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      void bookingAlert(
        "PDF prepared successfully",
        "Your monthly report download has started.",
        { success: true },
      );
    } catch (error) {
      await bookingAlert("Could not export report", "Please try again.", {
        confirm: "OK",
        required: true,
      });
    } finally {
      button.disabled = false;
    }
  };
  $("#export").onclick = () => {
    if (!authorized() || !$("#month").value) return;
    const report = monthlyReport(
      getData(),
      $("#month").value,
      $("#cinema").value,
    );
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + reportCsv(report)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `NironCinema-staff-${$("#month").value}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    void bookingAlert(
      "Report prepared successfully",
      "Your CSV download has started.",
      { success: true },
    );
  };
  window.addEventListener("storage", () => {
    if (authorized()) render();
  });
  window.addEventListener("focus", () => {
    if (authorized()) render();
  });
  render();
}
function details(data, b) {
  const show = data.showtimes.find((s) => s.id === b.showtimeId);
  return {
    show,
    movie: data.movies.find((m) => m.id === show?.movieId),
    cinema: data.locations.find((c) => c.id === show?.locationId),
    guest: data.users.find((u) => u.id === b.userId),
  };
}
function render() {
  if (!authorized()) return;
  const data = getData(),
    locationId = $("#cinema").value;
  renderShift(data, locationId);
  renderActivity(data, locationId);
  const query = $("#search").value.trim().toLowerCase(),
    status = $("#status").value;
  let foodRoot = $("#foodOnlyOrders");
  if (!foodRoot) {
    foodRoot = document.createElement("section");
    foodRoot.id = "foodOnlyOrders";
    $("#desk").append(foodRoot);
  }
  renderFoodOrders(foodRoot, locationId, render);
  const matches = data.bookings
    .filter((b) => {
      const { show, movie, guest } = details(data, b);
      return (
        (!locationId || show?.locationId === locationId) &&
        (!$("#day").value || show?.date === $("#day").value) &&
        matchesBookingStatus(b, status) &&
        (!query ||
          [b.id, movie?.title, guest?.name, guest?.email].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(query),
          ))
      );
    })
    .reverse();
  const pages = Math.max(1, Math.ceil(matches.length / 9));
  page = Math.min(page, pages);
  $("#resultCount").textContent =
    `${matches.length} booking${matches.length === 1 ? "" : "s"} found`;
  $("#bookings").innerHTML =
    matches
      .slice((page - 1) * 9, page * 9)
      .map((b) => {
        const { show, movie, cinema, guest } = details(data, b);
        return `<button class="staff-card booking-card" data-booking="${esc(b.id)}"><div class="staff-card-top">${bookingStatusBadge(b)}<span>${money(b.total)}</span></div>${movieHeading(movie)}<p>${esc(guest?.name || (b.guestBooking ? "Walk-in guest" : "Guest unavailable"))}</p><p>${esc(cinema?.name || "Cinema unavailable")}</p><div class="staff-card-facts"><span>${esc(show?.date || "No date")} · ${esc(formatTime(show?.time))}</span><span>${esc(show?.hall)} · ${esc((b.seats || []).join(", "))}</span></div><small>${esc(b.id)}</small>${b.status === "Confirmed" && (b.food || []).some((f) => Number(f.quantity) > 0) ? '<span class="screening-availability ' + (b.foodCollectedAt ? "is-checked" : "is-pending") + ' food-pickup-badge"><i class="fa-solid fa-utensils" aria-hidden="true"></i>' + (b.foodCollectedAt ? "Food collected" : "Food awaiting pickup") + "</span>" : ""}<span class="staff-open">View ticket <i class="fa-solid fa-arrow-right"></i></span></button>`;
      })
      .join("") ||
    '<div class="staff-empty"><i class="fa-solid fa-ticket"></i><h3>No bookings found</h3><p>Try another date, cinema, or booking reference.</p></div>';
  $("#pages").innerHTML =
    pages > 1
      ? `<button data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>Previous</button>${pageJump(page, pages, "desk")}<button data-page="${page + 1}" ${page === pages ? "disabled" : ""}>Next</button>`
      : "";
  $("#staffGreeting").textContent = greeting(signedInUser()?.name);
  const screenings = data.showtimes
    .filter(
      (s) =>
        (!locationId || s.locationId === locationId) &&
        s.date === $("#scheduleDay").value,
    )
    .filter(
      (s) =>
        (!$("#screenMovie").value || s.movieId === $("#screenMovie").value) &&
        (!$("#screenHall").value || s.hall === $("#screenHall").value) &&
        (!$("#screenAvailability").value ||
          screeningAvailability(data, s).available ===
            ($("#screenAvailability").value === "open")),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const showPages = Math.max(1, Math.ceil(screenings.length / 9));
  showPage = Math.min(showPage, showPages);
  $("#showCount").textContent = screenings.length
    ? `Showing ${(showPage - 1) * 9 + 1} - ${Math.min(showPage * 9, screenings.length)} of ${screenings.length} screenings`
    : "0 screenings";
  $("#showPages").innerHTML =
    showPages > 1
      ? `<button data-show-page="${showPage - 1}" ${showPage === 1 ? "disabled" : ""}>Previous</button>${pageJump(showPage, showPages, "screenings")}<button data-show-page="${showPage + 1}" ${showPage === showPages ? "disabled" : ""}>Next</button>`
      : "";
  $("#shows").innerHTML =
    screenings
      .slice((showPage - 1) * 9, showPage * 9)
      .map((s) => {
        const movie = data.movies.find((m) => m.id === s.movieId),
          cinema = data.locations.find((c) => c.id === s.locationId);
        const bookings = data.bookings.filter(
          (b) => b.showtimeId === s.id && b.status === "Confirmed",
        );
        const seats = bookings.reduce((n, b) => n + (b.seats || []).length, 0),
          admitted = bookings
            .filter((b) => b.checkedInAt)
            .reduce((n, b) => n + (b.seats || []).length, 0);
        const availability = screeningAvailability(data, s);
        return `<button type="button" data-view-seats="${esc(s.id)}" class="staff-card booking-card"><span class="screening-availability ${availability.available ? "is-open" : "is-closed"}"><i class="fa-solid ${availability.available ? "fa-circle-check" : "fa-ban"}" aria-hidden="true"></i> ${esc(availability.label)}</span><span class="staff-eyebrow">${esc(formatTime(s.time))} · ${esc(s.format || "2D")}</span>${movieHeading(movie)}<p>${esc(cinema?.name)} · ${esc(s.hall)}</p><div class="staff-card-facts"><span>${seats} seats booked</span><span>${admitted} guests checked in</span></div><span class="staff-open"><i class="fa-solid fa-couch" aria-hidden="true"></i> View hall seats</span></button>`;
      })
      .join("") ||
    '<div class="staff-empty">No screenings for this date and cinema.</div>';
  const report = monthlyReport(data, $("#month").value, locationId);
  $("#metrics").innerHTML = [
    ["Confirmed orders", report.count],
    ["Seats sold", report.seats],
    ["Ticket sales", money(report.tickets)],
    ["Food & drinks", money(report.food)],
    ["Total sales", money(report.total)],
  ]
    .map(
      ([label, value]) =>
        `<article class="staff-card"><p>${label}</p><strong>${value}</strong></article>`,
    )
    .join("");
  renderCharts($("#daily"), report, data, $("#month").value, chartMetric);
  $("#export").disabled = !report.count;
}
function openBooking(id) {
  const data = getData(),
    b = data.bookings.find((b) => b.id === id);
  if (!b) return;
  const { show, guest } = details(data, b);
  const dialog = document.createElement("dialog");
  dialog.className = "ticket-complete-dialog";
  dialog.setAttribute("aria-label", "Booking details");
  const staff = data.users.find((u) => u.id === b.checkedInBy);
  dialog.innerHTML = `<div class="staff-section-heading"><h2>Booking details</h2><button data-close aria-label="Close booking details">✕</button></div><p class="staff-note">${esc(guest?.name || (b.guestBooking ? "Walk-in guest" : "Guest unavailable"))} · ${esc(guest?.email || "")}</p>${digitalTicket(b, data)}<p class="staff-note">${b.checkedInAt ? `Checked in ${esc(new Date(b.checkedInAt).toLocaleString())} by ${esc(staff?.name || "Staff")}` : "Check-in admits all seats on this booking."}</p><div class="booking-actions"><button class="booking-primary" data-check ${b.status !== "Confirmed" || b.checkedInAt || show?.date !== localDate() ? "disabled" : ""}>${b.checkedInAt ? "Already checked in" : "Check in guests"}</button></div>${show?.date !== localDate() ? '<p class="staff-note">Check-in opens on the screening date.</p>' : ""}`;
  dialog
    .querySelector("[data-close]")
    .closest("div")
    .insertAdjacentHTML("afterend", bookingStatusBadge(b));
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  attachCancellation(dialog, b);
  const foods = (b.food || []).filter((item) => Number(item.quantity) > 0);
  if (foods.length) {
    const section = document.createElement("section");
    section.className = "staff-food-collection staff-pickup-details";
    const collector = data.users.find((u) => u.id === b.foodCollectedBy);
    section.innerHTML =
      "<h3>Food & drinks pickup</h3><ul>" +
      foods
        .map(
          (item) =>
            "<li><span>" +
            esc(item.name) +
            "</span><strong>&times; " +
            Number(item.quantity) +
            "</strong></li>",
        )
        .join("") +
      '</ul><p class="staff-note">' +
      (b.foodCollectedAt
        ? "Collected " +
          esc(new Date(b.foodCollectedAt).toLocaleString()) +
          " by " +
          esc(collector?.name || "Staff")
        : "Hand over all items before marking this order collected.") +
      '</p><button type="button" class="staff-refresh-seats" data-collect ' +
      (b.foodCollectedAt ||
      b.status !== "Confirmed" ||
      show?.date !== localDate()
        ? "disabled"
        : "") +
      ">" +
      (b.foodCollectedAt ? "Already collected" : "Mark food collected") +
      "</button>";
    dialog.append(section);
    section.querySelector("[data-collect]").onclick = async (event) => {
      if (!authorized()) return;
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const latest = getData();
        collectFood(latest, signedInUser(), id);
        saveData(latest);
        dialog.close();
        render();
        openBooking(id);
        void bookingAlert(
          "Food collected successfully",
          "The pickup has been recorded under your account.",
          { success: true },
        );
      } catch (error) {
        button.disabled = false;
        await bookingAlert("Unable to collect food", error.message, {
          confirm: "OK",
          required: true,
        });
      }
    };
  }
  dialog.querySelector("[data-check]").onclick = async (event) => {
    if (!authorized()) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const latest = getData();
      checkIn(latest, signedInUser(), id);
      saveData(latest);
      dialog.close();
      render();
      await bookingAlert(
        "Guests checked in successfully",
        "This ticket has been marked as used.",
        { success: true },
      );
    } catch (error) {
      button.disabled = false;
      await bookingAlert("Unable to check in", error.message, {
        confirm: "OK",
        required: true,
      });
    }
  };
  document.body.append(dialog);
  dialog.showModal();
  if ($("#status").value === "awaiting-food")
    dialog
      .querySelector(".staff-pickup-details")
      ?.scrollIntoView({ block: "center" });
}
function openSeats(showId) {
  const dialog = document.createElement("dialog");
  dialog.className = "ticket-complete-dialog staff-seat-dialog";
  dialog.setAttribute("aria-label", "Hall seat availability");
  function refresh() {
    if (!authorized()) {
      dialog.close();
      return;
    }
    const data = getData(),
      show = data.showtimes.find((s) => s.id === showId);
    if (!show) {
      dialog.close();
      return;
    }
    const movie = data.movies.find((m) => m.id === show.movieId),
      cinema = data.locations.find((c) => c.id === show.locationId);
    const bookings = data.bookings.filter(
      (b) =>
        b.showtimeId === showId && ["Confirmed", "Pending"].includes(b.status),
    );
    const state = (id) => {
      const b = bookings.find((b) => (b.seats || []).includes(id));
      return !b
        ? "available"
        : b.checkedInAt
          ? "admitted"
          : b.status === "Pending"
            ? "pending"
            : "booked";
    };
    const layout = layoutFor(show),
      seatRows = layout.rows,
      seatIds = layout.ids;
    const counts = seatIds.reduce(
      (n, id) => {
        n[state(id)]++;
        return n;
      },
      { available: 0, booked: 0, pending: 0, admitted: 0 },
    );
    dialog.innerHTML = `<div class="staff-dialog-heading"><h2>Hall seats</h2><button class="staff-dialog-close" data-close aria-label="Close hall seats"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>${movieHeading(movie)}<p class="staff-note">${esc(cinema?.name)} / ${esc(show.hall)}  /  ${esc(show.format || "2D")}<br>${esc(show.date)}  /  ${esc(formatTime(show.time))}</p><div class="staff-seat-legend">${Object.entries(
      counts,
    )
      .map(
        ([name, count]) =>
          `<span class="${name}"><i class="fa-solid fa-couch" aria-hidden="true"></i> ${name === "admitted" ? "Checked in" : name[0].toUpperCase() + name.slice(1)} ${count}</span>`,
      )
      .join(
        "",
      )}</div><div class="cinema-screen">SCREEN</div><div class="staff-hall-map" style="--seat-columns:${layout.columns}">${seatRows
      .map(
        (row) =>
          `<div class="staff-hall-row"><b>${row}</b>${Array.from(
            { length: layout.columns },
            (_, i) => {
              const id = row + (i + 1),
                status = state(id);
              return `<span class="staff-hall-seat ${status}" title="${id}: ${status}" aria-label="Seat ${id}, ${status}"><i class="fa-solid fa-couch" aria-hidden="true"></i><small>${i + 1}</small></span>`;
            },
          ).join("")}<b>${row}</b></div>`,
      )
      .join(
        "",
      )}</div><p class="staff-note">Read-only seat map  /  ${esc(layout.premiumRows.split("").join(", "))} are premium rows. Availability updates when you reopen or refresh this view.</p><button class="staff-refresh-seats" data-refresh><i class="fa-solid fa-rotate" aria-hidden="true"></i> Refresh seats</button>`;
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.querySelector("[data-refresh]").onclick = refresh;
    const book = document.createElement("button");
    book.type = "button";
    book.className = "staff-refresh-seats";
    book.innerHTML =
      '<i class="fa-solid fa-ticket" aria-hidden="true"></i> Book this screening';
    const availability = screeningAvailability(data, show);
    const available = availability.available;
    const badge = document.createElement("div");
    badge.className =
      "screening-availability " + (available ? "is-open" : "is-closed");
    badge.innerHTML =
      '<i class="fa-solid ' +
      (available ? "fa-circle-check" : "fa-ban") +
      '" aria-hidden="true"></i> ';
    badge.append(
      document.createTextNode(availability.label + " / " + availability.reason),
    );
    dialog.querySelector(".staff-dialog-heading").after(badge);
    book.disabled = !available;
    if (!available) book.textContent = "Booking unavailable";
    book.addEventListener("click", () => {
      if (!authorized()) return;
      location.href = `../movie.html?id=${encodeURIComponent(show.movieId)}&showtime=${encodeURIComponent(show.id)}`;
    });
    const actions = document.createElement("div");
    actions.className = "hall-actions mt-4 flex flex-wrap gap-3";
    actions.append(dialog.querySelector("[data-refresh]"), book);
    dialog.append(actions);
  }
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  refresh();
  if (dialog.isConnected) dialog.showModal();
}

function bookingStatusBadge(booking) {
  return statusBadge(
    booking.status === "Confirmed" && booking.checkedInAt
      ? "Checked in"
      : booking.status,
  );
}

function renderShift(data, locationId) {
  const date = localDate(),
    summary = shiftSummary(data, signedInUser().id, date, locationId);
  $("#shiftDate").textContent = new Date().toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const metrics = [
    ["Bookings made", summary.bookings, "fa-ticket"],
    ["Sales", money(summary.sales), "fa-coins"],
    ["Guests checked in", summary.guests, "fa-user-check"],
    ["Food pickups", summary.collections, "fa-utensils"],
  ];
  const max = Math.max(
    1,
    summary.bookings,
    summary.guests,
    summary.collections,
  );
  $("#shiftSummary").innerHTML = metrics
    .map(
      ([label, value, icon], i) =>
        '<article class="staff-card"><p><i class="fa-solid ' +
        icon +
        '" aria-hidden="true"></i> ' +
        label +
        "</p><strong>" +
        value +
        "</strong>" +
        (i !== 1
          ? '<meter min="0" max="' +
            max +
            '" value="' +
            value +
            '" aria-label="' +
            label +
            '"></meter>'
          : "<small>Confirmed bookings, including demo sales</small>") +
        "</article>",
    )
    .join("");
}

function attachCancellation(dialog, booking) {
  const panel = document.createElement("section");
  panel.className = "staff-food-collection";
  const request = booking.cancellationRequest;
  if (request?.status === "Pending") {
    panel.innerHTML =
      '<h3>Cancellation awaiting approval</h3><p class="staff-note"></p><p class="staff-note">The booking stays active until an administrator approves. No refund or seat release has occurred.</p>';
    panel.querySelector("p").textContent =
      request.reason +
      " / Requested by " +
      (request.requestedByName || "Staff") +
      " on " +
      new Date(request.requestedAt).toLocaleString();
  } else if (["Confirmed", "Pending"].includes(booking.status)) {
    panel.innerHTML =
      '<details class="staff-disclosure"><summary>Request cancellation</summary><form class="staff-cancel-form"><label>Reason<textarea required minlength="5" maxlength="500" rows="3" placeholder="Explain why this booking should be cancelled"></textarea></label><p class="staff-note">Admin approval is required. The booking remains active while the request is pending.</p><p data-error role="alert"></p><button type="submit" class="staff-refresh-seats">Submit request</button></form></details>';
    panel.querySelector("form").onsubmit = async (event) => {
      event.preventDefault();
      return actionFeedback(panel.querySelector("form"), async () => {
        if (!authorized()) return;
        const button = panel.querySelector("button");
        button.disabled = true;
        try {
          const latest = getData();
          requestCancellation(
            latest,
            signedInUser(),
            booking.id,
            panel.querySelector("textarea").value,
          );
          saveData(latest);
          dialog.close();
          render();
          openBooking(booking.id);
          void bookingAlert(
            "Cancellation requested",
            "The request is awaiting admin approval.",
            { success: true },
          );
        } catch (error) {
          panel.querySelector("[data-error]").textContent = error.message;
          button.disabled = false;
        }
      });
    };
  }
  if (panel.childElementCount) dialog.append(panel);
  const history = document.createElement("details");
  history.className = "staff-activity staff-disclosure";
  history.innerHTML =
    "<summary>Booking activity</summary>" +
    activityRows(
      bookingActivities(booking, getData()).map((e) => ({
        ...e,
        bookingId: booking.id,
      })),
    );
  dialog.append(history);
}
function activityRows(events) {
  return events.length
    ? events
        .map(
          (e) =>
            "<article><strong>" +
            esc(e.action) +
            "</strong><p>" +
            esc(e.actorName || "Staff") +
            " &middot; " +
            esc(new Date(e.at).toLocaleString()) +
            "</p><small>" +
            esc(e.bookingId) +
            "</small>" +
            (e.detail ? "<p>" + esc(e.detail) + "</p>" : "") +
            "</article>",
        )
        .join("")
    : '<p class="staff-note">No recorded activity yet.</p>';
}
function renderActivity(data, locationId) {
  const events = data.bookings
    .filter(
      (b) =>
        !locationId ||
        data.showtimes.find((s) => s.id === b.showtimeId)?.locationId ===
          locationId,
    )
    .flatMap((b) =>
      bookingActivities(b, data).map((e) => ({ ...e, bookingId: b.id })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  const pages = Math.max(1, Math.ceil(events.length / 10));
  activityPage = Math.min(activityPage, pages);
  $("#activityList").innerHTML = activityRows(
    events.slice((activityPage - 1) * 10, activityPage * 10),
  );
  $("#activityPages").innerHTML =
    pages > 1
      ? '<button data-activity-page="' +
        (activityPage - 1) +
        '" ' +
        (activityPage === 1 ? "disabled" : "") +
        ">Previous</button>" +
        pageJump(activityPage, pages, "activity") +
        '<button data-activity-page="' +
        (activityPage + 1) +
        '" ' +
        (activityPage === pages ? "disabled" : "") +
        ">Next</button>"
      : "";
  $("#activityPages").onclick = (event) => {
    const b = event.target.closest("[data-activity-page]");
    if (b && !b.disabled && authorized()) {
      activityPage = Number(b.dataset.activityPage);
      renderActivity(getData(), $("#cinema").value);
    }
  };
}
