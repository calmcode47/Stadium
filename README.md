# Smart Stadium & Tournament Operations

## 1. Chosen Vertical
This application is designed for stadium/venue operations and tournament management. The solution is built around the persona of on-site operations staff and event control-room operators. These users require rapid situational awareness, high-density telemetry, and prioritized, explainable recommendations during live events to manage crowd congestion, security incidents, match delays, and tournament progression.

## 2. Approach & Logic
The platform architecture utilizes a strict two-layer design for its Smart Operations Assistant:

1. **Deterministic Decision Engine (`src/lib/assistantEngine.ts`)**: A pure, framework-free TypeScript engine. It evaluates the operations state (matches, zones, alerts, stand sections, rounds) against defined threshold rules to generate prioritized and explainable recommendations. This layer contains no React dependencies, no side effects, and is fully unit-testable in isolation.
2. **AI Explanation Layer (Optional)**: If a Gemini API key is configured, an optional LLM request is made to synthesize the deterministic reasoning factors into a natural language operational briefing. If the API key is absent or the request fails, the system automatically falls back to local structured template generation.

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
To demonstrate the natural language briefing summaries:
1. Set `GEMINI_API_KEY` in `backend/.env` for backend-generated recommendation explanations.
2. `VITE_GEMINI_API_KEY` in `frontend/.env` remains supported for local frontend explanation fallback.
3. Restart the relevant dev server after changing env vars.

### Environment Variables
Backend variables are documented in `backend/.env.example`:
- `PORT`
- `DATABASE_FILE`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_ORIGIN`
- `GEMINI_API_KEY`
- `ENABLE_SIMULATOR`

Frontend variables are documented in `frontend/.env.example`:
- `VITE_GEMINI_API_KEY`
- `VITE_API_BASE_URL`
- `VITE_WS_URL`

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
