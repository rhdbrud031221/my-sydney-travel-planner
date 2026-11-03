# My Sydney — Travel Dashboard

A responsive family travel planner for Sydney, Australia, built with HTML, CSS, JavaScript and Leaflet.

## Features
- **Trip Overview:** live summary cards, first-day itinerary, packing progress, saved-place estimated spend and actual expenses.
- **Flights:** departure/arrival, airline, flight number, passengers, seats.
- **Hotels:** check-in/out, amenities and notes.
- **Itinerary:** dated activities and notes.
- **Places & interactive map:** searchable Sydney map with pins for hotels, airports and saved places, plus estimated spend per saved place.
- **Expenses:** track actual spending separately from planned budgets.
- **Packing:** essential and personal checklists.
- **Demo workspace:** fictional sample data stored separately from the personal workspace.

## Run locally
Open the folder in VS Code and select **Go Live** using Live Server. Map tiles and geocoding require network access. You can edit and browse without installing a JavaScript build tool.

## Data and privacy
The personal workspace is currently stored in the browser's `localStorage` (`my-sydney-v1`). The demo workspace uses a separate key (`my-sydney-demo-v1`). These browser-only modes **do not** provide authentication, family-wide sync or security against other people using the same browser profile. Do not enter sensitive booking references or personal data on a shared computer. Family authentication and cloud persistence are planned, **not implemented yet**.

A backup action exports the active workspace's JSON. Opening this project under a different origin (e.g., `file://` vs Live Server) uses a different `localStorage` area.

## Stack
HTML5 · CSS3 · Vanilla JavaScript · Leaflet 1.9.4 · OpenStreetMap tiles

## Development
- v1.4.2 — Leaflet tile layout fixes
- v1.5 — Premium responsive dashboard; data-driven overview and left-side navigation; removed developer-only copy from the app UI.

## Notes
- The main dashboard's map teaser is decorative. Use **저장 장소** to view the actual interactive map.
- The dashboard reflects saved data, not hard-coded preview values.
- All changes are tracked through GitHub Desktop; Supabase integration is a future milestone.
