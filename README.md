# Prototypes

## Fission Point (Browser FPS)

- Path: `fps/`
- Stack: HTML5 Canvas, vanilla JavaScript, procedural raycast renderer
- Features: pointer-lock main menu, AWSDY controls with Hyper Dash, procedural map generator, three enemy archetypes, minimap HUD
- Run locally by serving the folder (for example `cd fps && npx serve`) or by opening `fps/index.html` directly in a modern browser

## Shared Design + Libraries

- Path: `design/`
  - `html/layout.html` – canonical markup with slot markers used by every framework.
  - `css/app.css` – neon-glass theme plus utility classes (also imported by the Svelte bundle).
  - `data/seed.json` – sample project/task graph.
- Path: `lib/`
  - `Auth.php` – plaintext credential validator for PHP stacks (admin/1234).
  - `Storage.php` – JSON persistence helper with sane defaults.

## Nette Console

- Path: `nette/`
- Highlights: Sign/Dashboard presenters, Latte layout mirroring `design/html/layout.html`, JSON-backed repository (`app/data/data.json`), custom authenticator wired to `SharedLib\Auth`.
- Run: `cd nette && composer install && php -S localhost:8080 -t www`.

## Laravel Console

- Path: `laravel/`
- Highlights: Blade layout slot injector around shared design file, session-backed login, `storage/app/data.json` persistor, CRUD routes (`/projects`, `/tasks`), middleware `console.auth`.
- Run: `cd laravel && composer install && php artisan serve`.

## Vanilla SPA

- Path: `js-vanilla/`
- Description: Single-file SPA that consumes the shared HTML, persists state in `localStorage` (`todoAppData`), and renders via slot hooks.
- Run: `cd js-vanilla && npx serve` (or any static server).

## Alpine SPA

- Path: `alpine/`
- Description: Shared layout enhanced with Alpine stores (`$store.app`) handling auth, filters, CRUD, and persistence.
- Run: `cd alpine && npx serve`.

## Svelte SPA

- Path: `svelte/`
- Highlights: Vite + Svelte 4 setup, components (`Login`, `Filters`, `ProjectList`, `TaskList`, `TaskForm`), writable stores syncing to `localStorage`, shared CSS via `/design`.
- Run: `cd svelte && npm install && npm run dev`.