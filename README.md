# SchoolFood — Validation MVP

Interactive frontend prototype for a **school canteen food pre-ordering** platform.

This is **not** the full product. It validates the core workflows with schools using two roles only:

1. **Food Provider Admin** — manage canteens, create menus, assign menus  
2. **Canteen Manager** — run daily menu availability and the order floor  

Parent, Student, School Admin, and Super Admin are intentionally out of scope.

---

## Quick start

Open `index.html` in a browser, or serve the folder locally:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then visit `http://localhost:8080`.

Use the role switcher in the top bar to move between Food Provider and Canteen Manager.

---

## Demo flows

### Food Provider

Dashboard → Canteens → Add Canteen → Menus → Create Menu → Add Items → Assign Menu

### Canteen Manager

Dashboard → Today’s Menu → Mark Item Unavailable → Orders → Order Details → New → Preparing → Ready → Completed

---

## Tech stack

- HTML5, CSS3, JavaScript, jQuery  
- Bootstrap 5, Bootstrap Icons (CDN)  
- Select2, AOS, GSAP, SweetAlert2, CountUp.js (CDN)  
- No React/Vue/Angular, no build step, no backend  

State is kept in `localStorage` under the key `schoolFoodMVP`. Reset anytime from the user menu → **Reset demo data**.

---

## Project structure

```text
├── index.html                 # Public landing (SEO-friendly)
├── food-provider/             # Food Provider screens
├── canteen-manager/           # Canteen Manager screens
├── assets/css/                # style, dashboard, components, responsive
├── assets/js/                 # mock data, app state, role logic
└── partials/                  # Reference markup snippets
```

---

## Notes for stakeholders

- All data is mock / client-side.  
- Designed as a polished clickable prototype for school validation meetings.  
- Later phases may add parent/student wallets, payments, allergens, reporting, etc.
