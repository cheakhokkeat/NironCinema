# NironCinema

A responsive cinema booking demo built by a two-person student team using HTML, vanilla JavaScript, and Tailwind CSS.

> **Movie data attribution:** Movie information and poster URLs are copied from [Legend Cinema](https://legend.com.kh/) for educational and demo use. Rights belong to Legend Cinema and/or the respective rights holders. NironCinema is not affiliated with Legend Cinema; attribution does not grant reuse permission. Screening schedules, prices, locations, and transactions are fictional test data.

## Features

- **Customers:** Browse movies, book seats, order food and drinks, and save or share digital tickets.
- **Staff:** Book for customers, check tickets, manage food pickup, and view sales reports.
- **Admins:** Manage the catalogue, screenings, accounts(real project don't have), bookings, cancellation requests, and reports.

## Run locally

With Node.js installed, run:

```bash
npm install
npm run tailwind
```

Serve the project with a local web server, such as VS Code Live Server, and open `index.html`. Keep the Tailwind command running while editing styles.

## Demo accounts

| Role | Email | Password | Page |
| --- | --- | --- | --- |
| Admin | `admin@niron.com` | `admin123` | `https://cheakhokkeat.github.io/NironCinema/admin/index.html` |
| Staff | `staff001support@niron.com` | `staff001` | `https://cheakhokkeat.github.io/NironCinema/staff/index.html` |
| Customer | `cheakhokkeat@niron.com` | `cheakhokkeat` | `https://cheakhokkeat.github.io/NironCinema/index.html` |

These are initial credentials; changes saved in your browser take precedence.

## Data storage

Default test data lives in `src/js/data/storage.js` and initializes fresh browser storage. Saved accounts, movies, cinemas, screenings, food, ads, and orders live in **localStorage** under `nironCinema_data`. Existing saved data is preserved and is not shared between browsers or devices.

This is a frontend demo: authentication and payments are simulated. A production version needs a backend for secure authentication, permissions, bookings, and payments.

## Project folders

- `src/js/` - Customer pages, authentication, booking, tickets, shared components, and storage.
- `src/dist/` - Tailwind source and generated styles.
- `staff/` - Staff workspace.
- `admin/` - Admin workspace.
