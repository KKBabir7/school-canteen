# SchoolFood — Frontend Prototype

School canteen food pre-ordering platform (HTML/CSS/JS/jQuery + Bootstrap).

## Roles (all demoable)

| Role | Entry |
|------|--------|
| **Parent** (most polished ordering UX) | `parent/home.html` |
| **Student** | `student/home.html` |
| **Food Provider** | `food-provider/dashboard.html` |
| **Canteen Manager** | `canteen-manager/dashboard.html` |
| **School Admin** | `school-admin/dashboard.html` |
| **Super Admin** | `super-admin/schools.html` |

Use the top-bar **role switcher** or the landing page links. Language: **EN | العربية** (RTL).

## Run

```bash
python -m http.server 8080
```

Open `http://localhost:8080` — prefer a local server (not `file://`) for PWA/service worker.

## Architecture

- **Services** (`assets/js/services/`) — mock now; swap to Java/Spring Boot when `APP_CONFIG.mode = 'api'`
- **Storage** — `localStorage` prefix `schoolFood_v3_`
- **I18n** — curated EN/AR UI + bilingual `{ en, ar }` content fields
- **PWA** — `manifest.webmanifest` + `sw.js`

Reset demo data from the user menu anytime (clears LocalStorage seed).

## Intentionally later (per requirements)

Real payments, allergens/nutrition, QR activation, Parent/Student cancel-order rules polish, Java backend, WebSockets.

## Tech

HTML5, CSS3, JavaScript, jQuery, Bootstrap 5, Select2, AOS, SweetAlert2, Flatpickr, CountUp (CDN). No React/Vue/build step.
