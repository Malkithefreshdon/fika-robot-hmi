# Fika Robot — HMI

Human-machine interface (Nuxt 4) for the collaborative coffee-serving system built with two UR10/UR10e robots. The project matches the development plan in [`docs/`](./docs).

Two screens, one app:

- **Customer screen (kiosk)** — a warm, simple order flow, designed tablet-first and readable on desktop too. Translated into Swedish (default), English, Spanish, German, and French.
- **Technician mode (`/dev`)** — dashboard, manual commands, fine tuning, and logs to precisely calibrate the robot/vision/communication sequence. English-only UI (no i18n on the technician side).

## The two serving scenarios

The customer picks a glass (size + optional milk) and then a brewing experience:

- **Precision Brew** (*Default*, recommended) — Robot A weighs the coffee pot then clears it, Robot B sets the glass on the scale, and Robot A pours in a closed loop until the target mass is reached. Accurate — the glass sits alone on the scale while pouring.
- **Stylish Pour** (*Stylish*) — both robots grab their item at the same time, Robot B holds the glass mid-air while Robot A pours for a fixed (timed, not weighed) duration. Faster and more of a show, presented to the customer with a commercial disclaimer that the result can be a little less precise.

Robot A always handles the coffee pot (weigh / pour / return home); Robot B always handles the customer's glass (pick up / place on scale / hold / deliver).

## Backend: simulated today, ready for the real supervisor

The HMI never talks to robots directly — it talks to a `SupervisorBackend` interface (`app/services/backend/types.ts`). Two implementations exist behind it:

- `mockBackend.ts` — runs entirely in the browser, simulating both scenarios' timing so the HMI is fully demoable today.
- `liveBackend.ts` — a thin WebSocket bridge to the real Python supervisory controller (WP3), with auto-reconnect. It speaks the exact same JSON protocol documented at the top of that file.

**To switch off the simulated backend and point the HMI at the real supervisor**, set one environment variable — no code changes needed (see [Environment variables](#environment-variables) below). **A full field-by-field integration guide for whoever implements the Python supervisor is in [`docs/backend-integration-guide.docx`](./docs/backend-integration-guide.docx)** — protocol messages, every shared type, the two scenario sequences step by step, and how to debug against the real thing using the manual command panel in `/dev`.

## Why these choices

- **Nuxt 4** in SPA mode (`ssr: false`): this is a local kiosk app (tablet next to the robots), not a public site — no need for SSR, and it avoids hydration mismatches with the WebSocket/localStorage-backed state.
- **Pinia** for shared state (current order, robot states, tunable parameters).
- **Tailwind CSS v4** with "warm coffeehouse" design tokens defined in `app/assets/css/main.css`.
- **@nuxtjs/i18n** for the customer kiosk screens only — translation files in `i18n/locales/*.json`, Swedish by default, deliberately no cross-session persistence (a public kiosk shouldn't inherit the previous customer's language).
- **Swappable supervisor layer** (`app/services/backend`) — see above.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the customer screen, and `http://localhost:3000/dev` for technician mode (default PIN: `1234`, see `.env.example`).

## Environment variables

Copy `.env.example` to `.env` to adjust:

- `NUXT_PUBLIC_BACKEND_MODE` — `mock` (default, simulated) or `live` to connect to the real Python supervisor and disable the simulation.
- `NUXT_PUBLIC_BACKEND_WS_URL` — the supervisor's WebSocket address, used only when `BACKEND_MODE=live`.
- `NUXT_PUBLIC_DEV_PIN` — access code for technician mode.

To debug the real supervisor: set `NUXT_PUBLIC_BACKEND_MODE=live`, point `NUXT_PUBLIC_BACKEND_WS_URL` at it, restart `npm run dev`, then open `/dev` — the top bar shows "Supervisor: live (connected/disconnected)" (hover it for the target URL), and the **Manual commands** panel on the dashboard lets you fire individual commands (`PICK_GLASS`, `WEIGH_POT`, `POUR_COFFEE`, …) at either robot to test the connection step by step without going through a full customer order.

## Structure

```
app/
  assets/css/       design tokens (warm coffeehouse palette)
  components/kiosk/ customer-screen components (incl. LanguageSwitcher)
  components/dev/   technician-mode components
  composables/       useDevAuth (PIN lock for technician mode)
  layouts/           kiosk.vue (customer) / dev.vue (technician)
  pages/             /, /order, /order/status, /dev, /dev/tuning, /dev/logs
  services/backend/  supervisor contract + mock/live implementations
  stores/            system (robots, params, logs) and order (current order, mode)
  types/             shared vocabulary (commands, robot states, scenarios, parameters)
i18n/
  i18n.config.ts     vue-i18n config (Swedish default, English fallback)
  locales/*.json     customer-screen translations (sv, en, es, de, fr)
docs/                original project plan + backend integration guide
```

## Connecting the real Python supervisor

1. Set `NUXT_PUBLIC_BACKEND_MODE=live` and point `NUXT_PUBLIC_BACKEND_WS_URL` at the service.
2. Implement the JSON protocol described in `app/services/backend/liveBackend.ts` on the Python side — command/state vocabulary lives in `app/types/index.ts`: `PICK_GLASS`, `WEIGH_POT`, `PLACE_ON_SCALE`, `HOLD_GLASS`, `POUR_COFFEE`, `POUR_MILK`, `DELIVER`, `HOME` / `READY`, `BUSY`, `DONE`, `FAULT`.
3. See `docs/backend-integration-guide.docx` for the full reference.

No other HMI changes are needed — pages and stores only know the `SupervisorBackend` interface, never its implementation.
