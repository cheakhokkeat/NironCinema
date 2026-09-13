import {
  initMovieFormatEditor,
  initScreeningFormatDefaults,
} from "./movieFormatEditor.js";
import { renderFoodOrders } from "../staff/foodOrdersPanel.js";
import { actionFeedback } from "../src/js/components/actionFeedback.js";
import { movieMetadata } from "../src/js/components/movieMetadata.js";
import { layoutFor } from "../src/js/booking/seatLayouts.js";
import {
  movieHeading,
  statusBadge,
} from "../src/js/components/workspaceCards.js";
import { initTimePicker } from "../src/js/components/timePicker.js";
import { screeningFormat } from "../src/js/components/screeningFormat.js";
import { initImageUploads } from "../src/js/components/imageUpload.js";
import { initWorkspaceNavigation } from "../src/js/components/workspaceNavigation.js";
import { pageJump, initPageJump } from "../src/js/components/pageJump.js";
import { enhancePasswordInputs } from "../src/js/components/passwordVisibility.js";
import { getData, saveData, signoutUser } from "../src/js/data/storage.js";
import { signedInUser } from "../src/js/auth/access.js";
import { initProfile } from "../src/js/auth/profileModal.js";
import { greeting } from "../src/js/utils/greeting.js";
import { formatTime } from "../src/js/utils/formatTime.js";
import { enhanceSelect } from "../src/js/components/selectMenu.js";
import { bookingAlert } from "../src/js/components/bookingAlert.js";
import { bookingActivities } from "../src/js/booking/activity.js";
import { digitalTicket } from "../src/js/tickets/digitalTicket.js";
import { initTicketActions } from "../src/js/tickets/ticketActions.js";
import { initMonthPicker } from "../staff/monthPicker.js";
import { initDatePicker } from "../staff/datePicker.js";
import {
  monthlyReport,
  reportCsv,
  localDate,
  checkIn,
} from "../staff/operations.js";
import { renderCharts } from "../staff/reportCharts.js";
import { reportPdf, reportCanvas } from "../staff/reportPdf.js";
import { collectFood } from "../staff/shift.js";
import { schemas } from "./schema.js";
import {
  requireAdmin,
  saveRecord,
  deleteRecord,
  decideCancellation,
} from "./operations.js";

const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const money = (v) => "$" + Number(v || 0).toFixed(2);
let view = "overview",
  page = 1,
  query = "",
  status = "";
const sections = {
  overview: ["Overview", "fa-chart-pie"],
  ...Object.fromEntries(
    Object.entries(schemas).map(([k, v]) => [k, [v.label, v.icon]]),
  ),
  bookings: ["Bookings", "fa-ticket"],
  requests: ["Cancellations", "fa-circle-exclamation"],
  reports: ["Reports", "fa-chart-line"],
  activity: ["Activity history", "fa-clock-rotate-left"],
};
function guard() {
  try {
    return requireAdmin(getData(), signedInUser()?.id);
  } catch {
    $("#adminApp").hidden = true;
    location.replace("./login.html");
    return null;
  }
}
function success(title) {
  void bookingAlert(title, "Your changes have been saved.", { success: true });
}
function error(message) {
  return bookingAlert("Unable to complete action", message, {
    confirm: "OK",
    required: true,
  });
}
let closeNav = () => {};
if (guard()) {
  initPageJump($("#adminContent"), (section, number) => {
    if (!guard()) return;
    page = number;
    if (section === "activity") activity();
    else renderRecords();
  });
  $("#adminApp").hidden = false;
  const updateProfile = () => {
    $("#adminName").textContent = signedInUser()?.name || "Admin";
    $("#adminGreeting").textContent = greeting(signedInUser()?.name);
  };
  updateProfile();
  initProfile(updateProfile, $("#joinAuthBtn"));
  initTicketActions();
  $("#navItems").innerHTML = Object.entries(sections)
    .map(
      ([id, [label, icon]]) =>
        `<button type="button" data-section="${id}" class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-400 transition hover:bg-nironBlue/10 hover:text-nironBlue aria-[current=page]:bg-nironBlue/15 aria-[current=page]:text-nironBlue">
      <i class="fa-solid ${icon} w-5 text-center" aria-hidden="true"></i>${label}
      </button>`,
    )
    .join("");
  $("#navItems").onclick = (e) => {
    const b = e.target.closest("[data-section]");
    if (!b) return;
    view = b.dataset.section;
    page = 1;
    query = "";
    status = "";
    closeNav();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  closeNav = initWorkspaceNavigation({
    root: $("#adminApp"),
    navigation: $("#navItems"),
    role: "admin",
    quick: [
      ['[data-section="overview"]', "Overview", "fa-chart-pie"],
      ['[data-section="reports"]', "Reports", "fa-chart-line"],
      ['[data-section="movies"]', "Movies", "fa-film"],
      ['[data-section="showtimes"]', "Screenings", "fa-calendar-days"],
      ['[data-section="bookings"]', "Bookings", "fa-ticket"],
      ['[data-section="requests"]', "Cancellations", "fa-circle-exclamation"],
    ],
  });
  $("#logout").onclick = async () => {
    if (
      await bookingAlert("Sign out?", "End your administrator session?", {
        confirm: "Sign out",
        cancel: "Stay",
      })
    ) {
      signoutUser();
      $("#adminApp").hidden = true;
      await bookingAlert("Signed out successfully", "Your session has ended.", {
        success: true,
      });
      location.replace("./login.html");
    }
  };
  $("#adminContent").addEventListener("click", handleContentClick);
  window.addEventListener("storage", () => {
    if (guard()) render();
  });
  window.addEventListener("focus", () => {
    guard();
  });
  render();
}
function header(title, subtitle, action = "") {
  return `<div class="staff-section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</div>`;
}
function render() {
  if (!guard()) return;
  document.querySelectorAll("[data-section]").forEach((b) => {
    if (b.dataset.section === view) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (view === "overview") return overview();
  if (view === "reports") return reports();
  if (view === "activity") return activity();
  const options =
    view === "requests"
      ? ["Pending", "Approved", "Rejected"]
      : view === "bookings"
        ? ["Confirmed", "Pending", "Cancelled", "Checked in"]
        : view === "users"
          ? ["user", "staff", "admin"]
          : [];
  $("#adminContent").innerHTML =
    header(
      sections[view][0],
      view === "requests"
        ? "Review requests without losing the original booking history."
        : "Search and manage your cinema records.",
      schemas[view]
        ? '<button data-add><i class="fa-solid fa-plus mr-2"></i>Add record</button>'
        : "",
    ) +
    `<div class="admin-filters mb-5 grid items-center gap-3 ${options.length ? "sm:grid-cols-[minmax(0,1fr)_220px]" : "grid-cols-1"}"><input id="recordSearch" type="search" aria-label="Search records" placeholder="Search names, titles or references" value="${esc(query)}">${options.length ? `<select id="recordStatus" aria-label="Filter status"><option value="">All status</option>${options.map((v) => `<option ${v === status ? "selected" : ""}>${v}</option>`).join("")}</select>` : ""}</div><div id="records" class="staff-bookings"></div><div id="recordPages" class="staff-pagination"></div>`;
  $("#recordSearch").oninput = (e) => {
    query = e.target.value;
    page = 1;
    renderRecords();
  };
  if ($("#recordStatus")) {
    enhanceSelect($("#recordStatus"), "fa-filter");
    $("#recordStatus").onchange = (e) => {
      status = e.target.value;
      page = 1;
      renderRecords();
    };
  }
  renderRecords();
  if (view === "bookings") {
    const foodRoot = document.createElement("section");
    $("#adminContent").append(foodRoot);
    renderFoodOrders(foodRoot, "", render);
  }
}
function bookingInfo(b, data) {
  const show = data.showtimes.find((s) => s.id === b.showtimeId),
    movie = data.movies.find((m) => m.id === show?.movieId),
    cinema = data.locations.find((l) => l.id === show?.locationId),
    user = data.users.find((u) => u.id === b.userId);
  return { show, movie, cinema, user };
}
function recordTitle(r, data) {
  if (view === "showtimes")
    return (
      data.movies.find((m) => m.id === r.movieId)?.title || "Movie unavailable"
    );
  if (["bookings", "requests"].includes(view))
    return bookingInfo(r, data).movie?.title || "Movie unavailable";
  return r.title || r.name || r.id;
}
function renderRecords() {
  const data = getData();
  let records =
    view === "requests"
      ? data.bookings.filter((b) => b.cancellationRequest)
      : data[view] || [];
  records = records.filter((r) => {
    const info = ["bookings", "requests"].includes(view)
      ? bookingInfo(r, data)
      : {};
    const label =
      view === "requests"
        ? r.cancellationRequest.status
        : view === "bookings"
          ? r.checkedInAt && r.status === "Confirmed"
            ? "Checked in"
            : r.status
          : r.role;
    return (
      (!status || label === status) &&
      (!query ||
        [
          recordTitle(r, data),
          r.id,
          r.email,
          r.username,
          r.hall,
          info.user?.name,
          info.user?.email,
          info.cinema?.name,
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ))
    );
  });
  const pages = Math.max(1, Math.ceil(records.length / 9));
  page = Math.min(page, pages);
  $("#records").innerHTML =
    records
      .slice((page - 1) * 9, page * 9)
      .map((r) => {
        let summary = "",
          badge = "";
        if (["bookings", "requests"].includes(view)) {
          const { show, cinema, user } = bookingInfo(r, data);
          summary = `${esc(user?.name || (r.guestBooking ? "Walk-in guest" : "Guest unavailable"))}<br>${esc(cinema?.name)}<br>${esc(show?.date)} / ${esc(formatTime(show?.time))}<br>Seats ${esc((r.seats || []).join(", "))} / ${money(r.total)}`;
          badge =
            view === "requests"
              ? r.cancellationRequest.status
              : r.checkedInAt && r.status === "Confirmed"
                ? "Checked in"
                : r.status;
        } else if (view === "showtimes")
          summary = `${esc(data.locations.find((l) => l.id === r.locationId)?.name)}<br>${esc(r.date)} / ${esc(formatTime(r.time))}<br>${esc(r.hall)} / ${esc(r.format || "2D")} / ${money(r.price)}`;
        else if (view === "users") {
          summary = `${esc(r.email)}<br>@${esc(r.username)}`;
          badge = r.role;
        } else if (view === "movies")
          summary = `${esc(r.genre)}<br>${esc(r.classification)}`;
        else if (view === "foods")
          summary = `${esc(r.description || "Food & drinks")}<br>${money(r.price)}`;
        else {
          summary = esc(r.address || r.subtitle || "");
          badge = r.active === "Yes" ? "Active" : "Inactive";
        }
        const hasMovie = [
          "movies",
          "showtimes",
          "bookings",
          "requests",
        ].includes(view);
        const movie =
          view === "movies"
            ? r
            : view === "showtimes"
              ? data.movies.find((m) => m.id === r.movieId)
              : hasMovie
                ? bookingInfo(r, data).movie
                : null;
        const image = hasMovie
          ? movie?.poster
          : view === "foods" || view === "ads" || view === "locations"
            ? r.image
            : null;
        const poster =
          view === "locations" && image
            ? `<img src="${esc(image)}" alt="${esc(r.name)}" data-image-preview="${esc(r.name)}" role="button" tabindex="0" class="mb-3 aspect-video w-full rounded-xl object-cover">`
            : hasMovie
              ? movieHeading(movie)
              : view === "foods"
                ? `<div class="food-art mb-3 w-20">${image ? `<img data-image-preview="${esc(r.name)}" role="button" tabindex="0" class="cursor-zoom-in" src="${esc(image)}" alt="${esc(r.name)}">` : '<i class="fa-solid fa-utensils"></i>'}</div>`
                : "";
        return `<article class="staff-card">${poster}${badge ? statusBadge(badge) : ""}${hasMovie ? "" : `<h3>${esc(recordTitle(r, data))}</h3>`}${view === "showtimes" ? screeningFormat(r) : view === "movies" ? movieMetadata(r, data.showtimes) : ""}<p>${summary}</p><small class="mt-3 block">${esc(r.id)}</small><div class="mt-4 flex flex-wrap gap-2">${schemas[view] ? `${view === "showtimes" ? `<button data-hall="${esc(r.id)}">View seats</button>` : ""}<button data-edit="${esc(r.id)}">Edit</button><button data-delete="${esc(r.id)}" class="text-rose-300">Delete</button>` : `<button data-booking="${esc(r.id)}">${view === "requests" ? "Review request" : "View booking"}</button>`}</div></article>`;
      })
      .join("") || '<div class="staff-empty">No matching records.</div>';
  $("#recordPages").innerHTML =
    `<button data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>Previous</button>${pageJump(page, pages, "records")}<button data-page="${page + 1}" ${page === pages ? "disabled" : ""}>Next</button>`;
}
async function handleContentClick(event) {
  const b = event.target.closest("button");
  if (!b || !guard()) return;
  if (b.hasAttribute("data-add")) editRecord();
  if (b.dataset.edit) editRecord(b.dataset.edit);
  if (b.dataset.hall) openAdminSeats(b.dataset.hall);
  if (b.dataset.booking) openBooking(b.dataset.booking);
  if (b.dataset.page) {
    page = Number(b.dataset.page);
    renderRecords();
  }
  if (b.dataset.delete) {
    const entity = view,
      id = b.dataset.delete;
    if (
      !(await bookingAlert(
        "Delete this record?",
        "This removes the record. Linked booking history will be protected.",
        { confirm: "Delete", cancel: "Keep record" },
      ))
    )
      return;
    try {
      const data = getData();
      deleteRecord(data, guard()?.id, entity, id);
      saveData(data);
      render();
      success("Record deleted successfully");
    } catch (e) {
      await error(e.message);
    }
  }
}
function modal(title) {
  const dialog = document.createElement("dialog");
  dialog.className = "ticket-complete-dialog";
  dialog.setAttribute("aria-label", title);
  dialog.innerHTML = `<div class="staff-dialog-heading"><h2>${esc(title)}</h2><button type="button" data-close class="staff-dialog-close" aria-label="Close ${esc(title)}"><i class="fa-solid fa-xmark"></i></button></div>`;
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  return dialog;
}
function editRecord(id) {
  const entity = view,
    schema = schemas[entity],
    data = getData(),
    record = data[entity].find((r) => r.id === id) || {};
  const dialog = modal((id ? "Edit " : "Add ") + schema.label);
  const form = document.createElement("form");
  form.className = "space-y-4";
  form.innerHTML =
    schema.fields
      .map(([key, label, type = "text", options]) => {
        if (key === "password") {
          label = id
            ? "New password (leave blank to keep current)"
            : "Password (required, at least 8 characters)";
        }
        let value =
          key === "password"
            ? ""
            : (record[key] ?? record.movie_details?.[key] ?? "");
        if (key === "cast" && Array.isArray(value)) value = value.join(", ");
        if (type === "date" && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const d = new Date(value);
          value = Number.isNaN(+d) ? "" : localDate(d);
        }
        const inputClass =
          "mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-base text-white outline-none focus:border-nironBlue";
        if (type === "select" || type === "relation") {
          const values =
            type === "relation"
              ? data[options].map((r) => [r.id, r.title || r.name])
              : options.map((v) => [v, v]);
          if (
            value &&
            !(
              ["audioLanguage", "subtitleLanguage"].includes(key) &&
              value === "TH"
            ) &&
            !values.some(([v]) => v === value)
          )
            values.push([value, value]);
          return `<div><label for="edit-${key}" class="text-sm text-gray-300">${label}</label><select id="edit-${key}" name="${key}" aria-label="${label}" class="${inputClass}">${values.map(([v, l]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
        }
        return `<div><label for="edit-${key}" class="text-sm text-gray-300">${label}</label>${type === "textarea" ? `<textarea id="edit-${key}" name="${key}" rows="3" class="${inputClass}">${esc(value)}</textarea>` : `<input id="edit-${key}" name="${key}" type="${type === "image" ? "text" : type}" value="${esc(value)}" ${type === "number" ? 'min="0" step="0.01"' : ""} ${type === "password" ? `autocomplete="new-password" minlength="8" ${id ? "" : "required"}` : ""} class="${inputClass}">`}${type === "image" ? `<label class="mt-2 block text-xs text-gray-400">Or upload PNG, JPEG or WebP (up to 1 MB)<input type="file" data-upload="${key}" accept="image/png,image/jpeg,image/webp" class="mt-2 block w-full text-xs"></label>` : ""}</div>`;
      })
      .join("") +
    '<p data-error role="alert" class="text-sm text-rose-300"></p><div class="booking-actions"><button type="button" data-cancel>Cancel</button><button type="submit" class="booking-primary">Save changes</button></div>';
  dialog.append(form);

  enhancePasswordInputs(form);
  form.querySelector("[data-cancel]").onclick = () => dialog.close();
  form.querySelectorAll("select").forEach((s) =>
    enhanceSelect(s, "fa-chevron-down", {
      searchable: ["movieId", "locationId"].includes(s.name),
    }),
  );
  form.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.value) input.value = localDate();
    initDatePicker(input);
  });
  form.querySelectorAll('input[type="time"]').forEach(initTimePicker);
  const readFormats =
    entity === "movies"
      ? initMovieFormatEditor(form, record, data.showtimes)
      : null;
  if (entity === "showtimes") {
    initScreeningFormatDefaults(form, data, record);
    const note = document.createElement("p");
    note.className = "text-xs text-gray-400";
    form.querySelector("[data-error]").before(note);
    const describe = () => {
      const protectedLayout =
        id && data.bookings.some((b) => b.showtimeId === id);
      const layout = layoutFor({
        seatLayout: protectedLayout
          ? record.seatLayout || "Standard"
          : form.elements.format.value,
      });
      note.textContent =
        "Seat layout: " +
        layout.label +
        " / " +
        layout.rows.length +
        " rows / " +
        layout.columns +
        " seats per row (" +
        layout.ids.length +
        " total)." +
        (protectedLayout
          ? " Existing booked layout is preserved."
          : " Sample hall preset selected by screening format.");
    };
    form.elements.format.addEventListener("change", describe);
    describe();
  }
  const uploadsPending = initImageUploads(form);
  form.onsubmit = async (event) => {
    event.preventDefault();
    return actionFeedback(form, async () => {
      if (uploadsPending()) {
        form.querySelector("[data-error]").textContent =
          "Please wait for the image to finish loading.";
        return;
      }
      const actor = guard();
      if (!actor) return;
      try {
        const latest = getData();
        saveRecord(latest, actor.id, entity, id, {
          ...Object.fromEntries(new FormData(form)),
          ...(readFormats ? { formatProfiles: readFormats() } : {}),
        });
        saveData(latest);
        dialog.close();
        render();
        success("Record saved successfully");
      } catch (e) {
        form.querySelector("[data-error]").textContent = e.message;
      }
    });
  };
  dialog.showModal();
}
function openBooking(id) {
  const data = getData(),
    booking = data.bookings.find((b) => b.id === id);
  if (!booking) return;
  const dialog = modal("Booking details");
  dialog.insertAdjacentHTML("beforeend", digitalTicket(booking, data));
  const controls = document.createElement("div");
  controls.className = "mt-5 space-y-4";
  const request = booking.cancellationRequest;
  controls.innerHTML = `<p class="staff-note">${booking.checkedInAt ? "Checked in " + esc(new Date(booking.checkedInAt).toLocaleString()) : "Not checked in"} / ${booking.foodCollectedAt ? "Food collected" : "Food not collected"}</p><div class="booking-actions"><button data-check ${booking.status !== "Confirmed" || booking.checkedInAt ? "disabled" : ""}>Check in</button><button data-food ${booking.status !== "Confirmed" || booking.foodCollectedAt || !(booking.food || []).some((f) => f.quantity > 0) ? "disabled" : ""}>Collect food</button></div>${request ? `<section class="rounded-xl border border-nironBlue/20 p-4"><h3>Cancellation: ${esc(request.status)}</h3><p class="staff-note">${esc(request.reason)}</p><p class="staff-note">Requested by ${esc(request.requestedByName || request.requestedBy)} on ${esc(new Date(request.requestedAt).toLocaleString())}</p>${request.status === "Pending" ? '<label class="mt-3 block text-sm">Decision note<textarea data-note rows="3" maxlength="500" class="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 p-3"></textarea></label><p class="staff-note">Approval cancels the ticket and releases its seats. It does not process a real refund.</p><div class="booking-actions"><button data-decision="reject">Reject</button><button data-decision="approve" class="booking-primary">Approve cancellation</button></div>' : `<p class="staff-note">${esc(request.reviewNote)} / ${esc(request.reviewedByName)}</p>`}</section>` : ""}<details class="staff-disclosure"><summary>Booking activity</summary><div>${eventRows(bookingActivities(booking, data))}</div></details>`;
  dialog.append(controls);
  controls.onclick = async (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const actor = guard();
    if (!actor) return;
    button.disabled = true;
    try {
      let latest = getData();
      if (button.hasAttribute("data-check")) checkIn(latest, actor, id);
      else if (button.hasAttribute("data-food")) collectFood(latest, actor, id);
      else if (button.dataset.decision) {
        const approve = button.dataset.decision === "approve";
        const note = controls.querySelector("[data-note]").value;
        if (!note.trim()) throw new Error("Enter a decision note.");
        if (
          !(await bookingAlert(
            approve ? "Approve cancellation?" : "Reject cancellation?",
            approve
              ? "This cancels the booking and releases its seats."
              : "The booking will stay active.",
            { confirm: approve ? "Approve" : "Reject", cancel: "Go back" },
          ))
        )
          return;
        latest = getData();
        decideCancellation(latest, guard()?.id, id, approve, note);
      } else return;
      saveData(latest);
      dialog.close();
      render();
      openBooking(id);
      success("Booking updated successfully");
    } catch (e) {
      await error(e.message);
    } finally {
      button.disabled = false;
    }
  };
  dialog.showModal();
}
function overview() {
  const data = getData(),
    report = monthlyReport(data, localDate().slice(0, 7));
  $("#adminContent").innerHTML =
    header(
      "Overview",
      "This month across all cinemas. Demo bookings are included.",
    ) +
    `<div class="staff-metrics">${[
      ["Sales", money(report.total)],
      ["Orders", report.count],
      ["Seats sold", report.seats],
      [
        "Pending requests",
        data.bookings.filter((b) => b.cancellationRequest?.status === "Pending")
          .length,
      ],
      ["Accounts", data.users.length],
    ]
      .map(
        ([label, value]) =>
          `<article class="staff-card"><p>${label}</p><strong>${value}</strong></article>`,
      )
      .join("")}</div><div id="overviewCharts" class="report-charts"></div>`;
  adminCharts($("#overviewCharts"), report, data, localDate().slice(0, 7));
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function reports() {
  $("#adminContent").innerHTML =
    header(
      "Reports",
      "Confirmed sales by booking date; pending and cancelled bookings are excluded.",
    ) +
    `<div class="mb-5 grid gap-3 sm:grid-cols-3"><div><label for="reportCinema">Cinema</label><select id="reportCinema" aria-label="Cinema"><option value="">All cinemas</option>${getData()
      .locations.map(
        (l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`,
      )
      .join(
        "",
      )}</select></div><div class="report-period">Period<input id="reportMonth" type="month" value="${localDate().slice(0, 7)}"></div><div><label for="paper">Paper style</label><select id="paper" aria-label="Paper style"><option value="modern">Modern Light</option><option value="classic">Classic Light</option><option value="dark">Full Color Dark</option></select></div></div><div class="mb-5 flex flex-wrap justify-end gap-2"><button data-export="csv"><i class="fa-solid fa-file-csv" aria-hidden="true"></i> Export CSV</button><button data-export="pdf"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Export PDF</button><button data-export="print"><i class="fa-solid fa-print" aria-hidden="true"></i> Print</button></div><div id="reportMetrics" class="staff-metrics"></div><div id="reportCharts" class="report-charts"></div>`;
  const paint = () => {
    const data = getData(),
      r = monthlyReport(
        data,
        $("#reportMonth").value,
        $("#reportCinema").value,
      );
    $("#reportMetrics").innerHTML = [
      ["Orders", r.count],
      ["Seats", r.seats],
      ["Tickets", money(r.tickets)],
      ["Food", money(r.food)],
      ["Total", money(r.total)],
    ]
      .map(
        ([l, v]) =>
          `<article class="staff-card"><p>${l}</p><strong>${v}</strong></article>`,
      )
      .join("");
    adminCharts($("#reportCharts"), r, data, $("#reportMonth").value);
  };
  enhanceSelect($("#reportCinema"), "fa-location-dot");
  enhanceSelect($("#paper"), "fa-file-lines");
  initMonthPicker($("#reportMonth"), paint);
  $("#reportCinema").onchange = paint;
  paint();
  document.querySelectorAll("[data-export]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (!guard()) return;
        b.disabled = true;
        try {
          const month = $("#reportMonth").value,
            cinema = $("#reportCinema").selectedOptions[0].textContent,
            style = $("#paper").value,
            r = monthlyReport(getData(), month, $("#reportCinema").value);
          if (b.dataset.export === "csv")
            download(
              new Blob(["\uFEFF" + reportCsv(r)], {
                type: "text/csv;charset=utf-8",
              }),
              `NironCinema-${month}.csv`,
            );
          else if (b.dataset.export === "pdf")
            download(
              await reportPdf(r, month, cinema, style, "Admin"),
              `NironCinema-${month}.pdf`,
            );
          else {
            const root = document.createElement("div");
            root.id = "ticketPrintRoot";
            const img = new Image();
            img.className = "staff-report-print";
            img.src = reportCanvas(
              r,
              month,
              cinema,
              style,
              "Admin",
            ).toDataURL();
            root.append(img);
            document.getElementById("ticketPrintRoot")?.remove();
            document.body.append(root);
            await img.decode();
            window.addEventListener("afterprint", () => root.remove(), {
              once: true,
            });
            window.print();
            return;
          }
          void bookingAlert(
            "Report prepared successfully",
            "Your download has started.",
            { success: true },
          );
        } catch (e) {
          await error(e.message);
        } finally {
          b.disabled = false;
        }
      }),
  );
}
function eventRows(events) {
  return (
    events
      .map(
        (e) =>
          `<article class="border-b border-white/10 py-3"><strong class="text-sm text-nironBlue">${esc(e.action)}</strong><p class="text-xs text-gray-400">${esc(e.actorName)} / ${esc(new Date(e.at).toLocaleString())}</p><p class="wrap-break-word text-xs text-gray-400">${esc(e.entity || "")} ${esc(e.recordId || "")} ${esc(e.detail || "")}</p></article>`,
      )
      .join("") || '<p class="staff-note">No activity recorded yet.</p>'
  );
}
function activity() {
  const data = getData();
  const events = [
    ...(data.adminActivity || []),
    ...data.bookings.flatMap((b) =>
      bookingActivities(b, data)
        .filter(
          (e) =>
            !["Cancellation approved", "Cancellation rejected"].includes(
              e.action,
            ),
        )
        .map((e) => ({ ...e, entity: "bookings", recordId: b.id })),
    ),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const pages = Math.max(1, Math.ceil(events.length / 20));
  page = Math.min(page, pages);
  $("#adminContent").innerHTML =
    header(
      "Activity history",
      "Recorded changes, staff actions, and cancellation decisions.",
    ) +
    `<section class="staff-card">${eventRows(events.slice((page - 1) * 20, page * 20))}</section><div class="staff-pagination"><button id="activityPrev" ${page === 1 ? "disabled" : ""}>Previous</button>${pageJump(page, pages, "activity")}<button id="activityNext" ${page === pages ? "disabled" : ""}>Next</button></div>`;
  $("#activityPrev").onclick = () => {
    page--;
    activity();
  };
  $("#activityNext").onclick = () => {
    page++;
    activity();
  };
}

function adminCharts(root, report, data, month) {
  root.classList.remove("report-charts");
  let metric = root.dataset.metric || "sales";
  root.innerHTML =
    '<div class="chart-switch mb-4 flex flex-wrap gap-2" role="group" aria-label="Daily graph metric">' +
    ["sales", "food", "bookings", "seats"]
      .map(
        (value) =>
          `<button type="button" data-chart-metric="${value}" aria-pressed="${metric === value}">${value === "food" ? "Food & drinks" : value === "bookings" ? "Orders" : value[0].toUpperCase() + value.slice(1)}</button>`,
      )
      .join("") +
    '</div><div class="report-charts" data-chart-content></div>';
  const paint = () => {
    root.dataset.metric = metric;
    renderCharts(
      root.querySelector("[data-chart-content]"),
      report,
      data,
      month,
      metric,
    );
    root
      .querySelectorAll("[data-chart-metric]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.chartMetric === metric),
        ),
      );
  };
  root.querySelectorAll("[data-chart-metric]").forEach(
    (b) =>
      (b.onclick = () => {
        metric = b.dataset.chartMetric;
        paint();
      }),
  );
  paint();
}

function openAdminSeats(id) {
  const data = getData(),
    show = data.showtimes.find((s) => s.id === id);
  if (!show) return;
  const layout = layoutFor(show),
    movie = data.movies.find((m) => m.id === show.movieId);
  const cinema = data.locations.find((l) => l.id === show.locationId);
  const bookings = data.bookings.filter(
    (b) => b.showtimeId === id && ["Confirmed", "Pending"].includes(b.status),
  );
  const state = (seat) => {
    const booking = bookings.find((b) => (b.seats || []).includes(seat));
    return !booking
      ? "available"
      : booking.checkedInAt
        ? "admitted"
        : booking.status === "Pending"
          ? "pending"
          : "booked";
  };
  const dialog = modal("Hall seat availability");
  dialog.classList.add("staff-seat-dialog");
  dialog.insertAdjacentHTML(
    "beforeend",
    movieHeading(movie) +
      `<p class="staff-note">${esc(cinema?.name)} / ${esc(show.hall)} / ${esc(show.date)} / ${esc(formatTime(show.time))}</p>${screeningFormat(show)}<p class="staff-note">${esc(layout.label)} / ${layout.ids.filter((s) => state(s) === "available").length} of ${layout.ids.length} seats available</p><div class="cinema-screen">SCREEN</div><div class="staff-hall-map" style="--seat-columns:${layout.columns}">${layout.rows.map((row) => `<div class="staff-hall-row"><b>${row}</b>${Array.from({ length: layout.columns }, (_, i) => `<span class="staff-hall-seat ${state(row + (i + 1))}" title="${row}${i + 1}: ${state(row + (i + 1))}"><i class="fa-solid fa-couch" aria-hidden="true"></i><small>${i + 1}</small></span>`).join("")}<b>${row}</b></div>`).join("")}</div><div class="staff-seat-legend mt-4 flex flex-wrap gap-2">${[
        ["available", "Available"],
        ["booked", "Confirmed"],
        ["pending", "Pending"],
        ["admitted", "Checked in"],
      ]
        .map(
          ([tone, label]) =>
            `<span class="inline-flex items-center gap-1 ${tone}"><i class="fa-solid fa-couch" aria-hidden="true"></i>${label}</span>`,
        )
        .join("")}</div>`,
  );
  if (
    new Date(show.date + "T" + show.time) > new Date() &&
    cinema?.active === "Yes" &&
    layout.ids.some((s) => state(s) === "available")
  )
    dialog.insertAdjacentHTML(
      "beforeend",
      `<a href="../movie.html?id=${encodeURIComponent(show.movieId)}&showtime=${encodeURIComponent(id)}" class="mt-5 inline-flex rounded-xl bg-nironBlue/15 px-4 py-3 text-sm font-semibold text-nironBlue">Book this screening</a>`,
    );
  dialog.showModal();
}
