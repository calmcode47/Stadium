# Smart Stadium & Tournament Operations

Built for stadium operations staff and control-room operators who need fast, explainable decisions during live events.

## Live Deployment
- Frontend: [https://stadium-frontend.netlify.app/](https://stadium-frontend.netlify.app/)
- Backend API health: [https://stadium-backend-production.up.railway.app/api/health](https://stadium-backend-production.up.railway.app/api/health)
- Backend API base URL: `https://stadium-backend-production.up.railway.app/api`
- Backend WebSocket URL: `wss://stadium-backend-production.up.railway.app/ws`

## 1. Chosen Vertical
This application is designed for stadium/venue operations and tournament management. The solution is built around the persona of on-site operations staff and event control-room operators. These users require rapid situational awareness, high-density telemetry, and prioritized, explainable recommendations during live events to manage crowd congestion, security incidents, match delays, and tournament progression.

## 2. Approach & Logic
The platform architecture uses a strict two-layer design for its Smart Operations Assistant:

1. **Deterministic Decision Engine (`src/lib/assistantEngine.ts`)**: A pure, framework-free TypeScript engine. It evaluates the operations state (matches, zones, alerts, stand sections, rounds) against defined threshold rules to generate prioritized and explainable recommendations. This layer contains no React dependencies, no side effects, and is fully unit-testable in isolation.
2. **Google Gemini Explanation and Chat Layer**: If a Gemini API key is configured, the product uses Gemini to synthesize already-generated deterministic reasoning into a short natural-language "AI Summary" and to power the assistant chat panel. If the API key is absent or a request fails, recommendation explanations fall back to local structured template generation.

The deterministic engine decides **what** recommendation appears, its priority, and the reasoning trail. Gemini only explains those decisions in operator-friendly language and answers chat questions using the current operations state. This separation is deliberate: the system demonstrates Gen AI usage without making operational decisions a black box.

The four rule families use current context rather than isolated static checks:
- **Gate congestion** weighs high occupancy against live match timing and locked stand exits.
- **Match delay risk** compares delayed matches with the next same-venue scheduled kickoff, so tight turnaround windows are treated as more urgent.
- **Incident escalation** combines unresolved alert count, highest severity, and recency.
- **Tournament bottlenecks** raise urgency when a delayed match directly blocks next-round TBD slots.

### Rationale for the Split:
- **Testability**: The core recommendation logic is written as pure mathematical functions, allowing 100% test coverage of boundary conditions and trigger thresholds without mocking React or browser environments.
- **Transparency**: Recommendation criteria are inspectable, predictable, and deterministic. Control-room staff can audit the exact telemetry rules that triggered any dispatch recommendation.
- **Reliability**: Core operational decisions do not depend on external network availability or LLM API latency. Recommendations generate gauge-level telemetry immediately even in offline scenarios.

---

## 3. How the Solution Works

### Key Views and Features:
- **App Shell & Navigation**: A persistent side navigation rail for desktop viewports that collapses into a bottom tab bar on mobile screens. It incorporates a live UTC/local digital clock.
- **Live Operations Dashboard**: High-density dashboard displaying active match stats, concourse and gate occupancy meters, real-time telemetry alert logs with manual acknowledgement triggers, and bracket completion progress.
- **Interactive Stadium View**: A procedural 3D model of the arena partitioned into four clickable stand sectors. Includes camera viewport presets ("Overview", "Pitch Level", "North Stand") and click-to-focus details. It automatically falls back to a 2D vector blueprint on low-spec systems or when deliberately toggled.
- **Tournament Bracket**: A single-elimination tournament tree showing matches in Quarterfinals, Semifinals, and Finals. Advancing winners dynamically change connecting branch line colors. Supports stage and venue filtering.
- **Live Match Feed**: Real-time channel tickers and single-match focused scoreboards displaying live score updates and a chronological match timeline.
- **Smart Operations Assistant Panel**: A collapsible drawer on the right containing active operational recommendations ranked by priority (critical, high, medium, low). Users can expand reasoning logs, accept dispatches, or dismiss items.

### Repository Directory Structure:
```
Stadium/
├── README.md                  # Root documentation and project guidelines
├── PROJECT_STATUS_REPORT.md   # Architectural status and phase logs
├── backend/                   # TypeScript Express + SQLite backend
│   ├── src/
│   │   ├── db/                # Drizzle schema, SQLite client, seed data
│   │   ├── modules/           # REST modules for auth, matches, venues, alerts, tournaments, assistant
│   │   ├── realtime/          # ws WebSocket server, broadcaster, demo simulator
│   │   ├── middleware/        # Auth, rate limits, error handling
│   │   └── lib/               # Deterministic assistant decision engine
│   ├── tests/                 # Vitest + Supertest backend coverage
│   └── package.json
└── frontend/                  # React Frontend Project Folder
    ├── public/                # Static assets (favicons, SVGs)
    ├── src/
    │   ├── assets/            # Application media
    │   ├── components/
    │   │   ├── assistant/     # Collapsible assistant panel, AI configurations
    │   │   ├── dashboard/     # Dashboard panels (matches, alerts, occupancy)
    │   │   ├── design-system/ # Reusable UI components (Panel, ScoreDigit, StatusPill)
    │   │   ├── layout/        # AppShell layout framework, TopBar, Sidebar
    │   │   ├── live/          # Match tickers and focused scoreboards
    │   │   ├── stadium/       # 3D canvas viewport and 2D vector blueprints
    │   │   └── tournaments/   # Single-elimination bracket visualizers
    │   ├── hooks/             # useLiveMatchSimulator hook and context providers
    │   ├── mocks/             # Mock data templates
    │   ├── routes/            # Route page containers
    │   ├── styles/            # Tailwind and global CSS declarations
    │   ├── types/             # TypeScript type definitions
    │   ├── App.tsx            # Application routing
    │   └── main.tsx           # Entry point
    ├── package.json           # Scripts and dependency versions
    ├── tailwind.config.ts     # Theme configurations
    ├── vite.config.ts         # Vite bundler options
    ├── vitest.config.ts       # Vitest test configurations
    └── tsconfig.json          # TypeScript compilation settings
```

---

## 4. Backend
The backend is a local-first TypeScript Node.js service under `backend/`. It uses Express, Zod validation, Drizzle ORM, SQLite through `better-sqlite3`, JWT authentication, bcrypt password hashes, `ws` WebSockets, pino logging, helmet, CORS restrictions, rate limiting, and compression.

Core data is persisted in a generated SQLite database file. The database is not committed; it is created by the seed script so the project remains cloneable and offline-evaluable without hosted services.

### Backend API Summary
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/matches`, `GET /api/matches/:id`, `PATCH /api/matches/:id`, `POST /api/matches/:id/events`
- `GET /api/venues`, `GET /api/venues/:id`, `PATCH /api/venues/:id/occupancy`, `PATCH /api/venues/:id/gate-lock`
- `GET /api/alerts`, `POST /api/alerts`, `PATCH /api/alerts/:id/acknowledge`
- `GET /api/tournaments`, `GET /api/tournaments/:id`, `GET /api/tournaments/:id/bracket`, `GET /api/tournaments/:id/schedule`
- `GET /api/assistant/recommendations`, `POST /api/assistant/recommendations/:id/decision`, `GET /api/assistant/decision-log`
- `GET /api/health`

All mutating routes except login require a JWT. Match, venue, gate, and alert mutations require `admin` or `operator`; `viewer` can read but cannot mutate.

### Smart Operations Assistant
The assistant decision engine exists in both frontend and backend, with the backend as the live source once connected. It is deterministic and side-effect free: recommendations are generated from current matches, venue zones, alerts, stand sections, and bracket rounds. The four rule families are gate congestion, match delay risk, incident escalation, and tournament bottlenecks.

The optional Gemini layer only explains already-generated deterministic recommendations. It never changes which recommendation appears or its priority. If `GEMINI_API_KEY` is absent or the request fails, the backend returns a local template explanation.

### Demo Logins
All demo users use password `Stadium123!`.

- `admin@stadium.local` - admin
- `operator@stadium.local` - operator
- `viewer@stadium.local` - viewer

## 5. Assumptions Made
- **Offline evaluability**: SQLite is used by design. No external database, Firebase, hosted API, or paid service is required for core functionality.
- **Simulator mode**: `ENABLE_SIMULATOR=true` makes the backend advance live match state and occasionally create events/alerts for demo convenience. Disable it in a real deployment.
- **Authentication scope**: JWT auth is intentionally minimal for the challenge. It demonstrates role authorization but is not a full identity-management system.
- **Configured thresholds**: Recommendation triggers are clear named constants tuned for demo operations data, not calibrated limits for a physical venue.

---

## 6. Setup & Run Instructions

Ensure Node.js (v20.19+ or v22.12+ is recommended) is installed on the host system.

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

The backend listens on [http://localhost:4000](http://localhost:4000) by default and exposes WebSockets at `ws://localhost:4000/ws`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Run both backend and frontend in separate terminals for the full real-time application.

### Optional Gemini AI Configuration
The assistant uses **Gemini Flash-Lite** by default (`gemini-3.1-flash-lite-preview`) because it offers significantly higher free-tier daily request limits than `gemini-2.5-flash`, while remaining fast enough for operational chat and briefing summaries. The client also paces requests (~15 per minute) and retries once on rate-limit responses.

To enable natural language briefings and chat:
1. Set `GEMINI_API_KEY` in `backend/.env` for backend-generated recommendation explanations.
2. Set `VITE_GEMINI_API_KEY` in `frontend/.env` for the in-browser assistant chat panel.
3. Optionally override the model with `GEMINI_MODEL` / `VITE_GEMINI_MODEL` if your Google AI Studio project has access to a different model.
4. Restart the relevant dev server after changing env vars.
5. In the Assistant panel, click **RESET** under Settings if a stale browser-saved key overrides your `.env` key.

### Environment Variables
Backend variables are documented in `backend/.env.example`:
- `PORT`
- `DATABASE_FILE`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_ORIGIN` (set to the exact Netlify production origin in Railway; do not use `*`)
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `ENABLE_SIMULATOR`
- `SEED_ON_START`

Frontend variables are documented in `frontend/.env.example`:
- `VITE_GEMINI_API_KEY`
- `VITE_GEMINI_MODEL`
- `VITE_API_BASE_URL` (Netlify production value should point at the Railway API URL ending in `/api`)
- `VITE_WS_URL` (Netlify production value should use `wss://.../ws`, not `ws://`)

### Deployment Notes
- Netlify is configured with `base = "frontend"`, `command = "npm run build"`, and `publish = "frontend/dist"` in `netlify.toml`.
- Railway is configured for the backend service with Nixpacks and starts `node dist/src/server.js`.
- The backend CORS origin is read from `FRONTEND_ORIGIN`; production uses the exact deployed Netlify URL: `https://stadium-frontend.netlify.app`.
- The frontend API client reads `VITE_API_BASE_URL`; production uses `https://stadium-backend-production.up.railway.app/api`.
- The frontend WebSocket client reads `VITE_WS_URL`; production uses `wss://stadium-backend-production.up.railway.app/ws`.
- If Railway cold-starts the backend, the frontend shows loading/error states and then falls back to last-known demo data instead of rendering a blank screen.

### Execute Test Suites
```bash
cd backend
npm run test

cd ../frontend
npm run test
```

### Production Compilation
```bash
cd backend
npm run build

cd ../frontend
npm run build
```

### Security Audit
```bash
cd backend
npm audit
```

---

## 7. Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Three.js, React Three Fiber, Lucide React
- **Backend**: Node.js, Express, TypeScript, Zod, Drizzle ORM, SQLite, better-sqlite3, ws, JWT, bcryptjs, pino
- **Language**: TypeScript
- **Testing**: Vitest, React Testing Library, Supertest

---

## 8. Submission Checklist (Challenge Rules)
Before submitting, verify these repository requirements:

| Rule | Status | Notes |
| --- | --- | --- |
| Public GitHub repository | **Action required** | Remote is currently **private**. Set the repo to public before submission. |
| Repository size under 10 MB | Pass | Tracked source is under 1 MB (`node_modules` and `.env` are gitignored). |
| Single branch only | Pass | `main` is the only branch. |
| Complete README | Pass | Vertical, approach, setup, assumptions, and architecture are documented above. |
| Tests included | Pass | Run `npm run test` in both `backend/` and `frontend/`. |
