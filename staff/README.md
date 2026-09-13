# Staff workspace

Open `staff/login.html` through the same local web server as the cinema site, or choose **Staff workspace** from a signed-in staff/admin account menu.

Use a staff account created in the admin workspace.

- Ticket desk: filter by cinema, screening date and status; search reference, guest or movie; inspect, print and download tickets.
- Check-in: confirmed bookings on the screening date only; admits the entire booking and records `checkedInAt` and `checkedInBy`. Duplicate check-ins are rejected. Booking status remains Confirmed so seat inventory and sales remain accurate.
- Screenings: booked seats and admitted guests for each show.
- Monthly report: confirmed bookings grouped by booking date and cinema, including demo data. Totals use stored booking prices; legacy bookings derive food totals from their saved food lines. CSV export contains the matching booking records.
- Profile: reuse the site's password-verified profile editor.
- Food-only orders: the ticket desk includes a separate pickup list with customer/reference search, status filters, page entry, and activity history. Admin has the same list in Overview. Confirmed food orders are included in monthly sales and exports; cancelled orders are excluded.

This workspace uses the project's existing browser storage. Role checks are frontend checks, not server-enforced authorization, and data is not shared between separate devices. Real staff deployment needs a backend for access control and atomic ticket check-in.

Run `npm.cmd test` for regression and staff operations checks. `node tests/workspaceBrowser.mjs` runs an optional isolated Chrome/Edge check for login, responsive workspaces, food ordering and pickup, and date entry.
