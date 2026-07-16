# Smart Stadium & Tournament Operations: Comprehensive Project & Status Report

**Last updated:** 16 July 2026  
**Latest main:** Gemini model migration and assistant reliability pass.

---

## 1. Project Overview
The **Smart Stadium & Tournament Operations** platform is designed for venue operations staff and control-room operators. It enables rapid situational awareness, crowd congestion control, security monitoring, match delay analysis, and live tournament bracket progression management.

At the center of the system is the **Smart Operations Assistant**, which evaluates real-time telemetry to produce priority-ranked, actionable dispatches for staff. Recommendations are computed by four named deterministic rules (`evaluateGateCongestion`, `evaluateMatchDelayRisk`, `evaluateIncidentEscalation`, `evaluateTournamentBottleneck`); an optional Gemini layer explains those decisions and powers assistant chat.

**Vertical / persona (opening claim):** stadium / venue and tournament operations; on-site operations staff and event control-room operators.

**Live deployment:**
- Frontend: [https://stadium-frontend.netlify.app/](https://stadium-frontend.netlify.app/)
- Backend health: [https://stadium-backend-production.up.railway.app/api/health](https://stadium-backend-production.up.railway.app/api/health)
- API base: `https://stadium-backend-production.up.railway.app/api`
- WebSocket: `wss://stadium-backend-production.up.railway.app/ws`

Challenge-alignment notes and a concrete match-day walkthrough live in [`README.md`](./README.md) and [`SCENARIO.md`](./SCENARIO.md).

---

## 2. Core Architectural Approach
The platform uses a strict **two-layer design** for the Smart Operations Assistant:
1. **Deterministic Decision Engine**: A pure, framework-free TypeScript engine (mirrored in `frontend/src/lib/assistantEngine.ts` and `backend/src/lib/assistantEngine.ts`). It evaluates the current operations state (venue zones, stand sections, live matches, unresolved alerts, bracket rounds) against defined thresholds to generate structured recommendations.
2. **Decoupled AI Explanation Layer**: Uses Google Gemini (default `gemini-3.1-flash-lite`) to synthesize deterministic reasoning into a natural-language “AI Summary” and to power chat. Retired preview model values are normalized to the supported Flash-Lite model. If the API is offline or the key is missing, explanations fall back to a local template generator.

```
+-------------------------------------------------------------+
|               Live Telemetry Data Feed                      |
| (Matches, Zone Occupancies, Section Gates, Unresolved Alerts)|
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|          Deterministic Decision Engine (Core)               |
|      (Pure evaluations of thresholds + context)            |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|            Priority-Ranked Recommendations                  |
+-------------------------------------------------------------+
                              |
              +---------------+---------------+
              |                               |
        [Gemini Key OK]              [No Gemini Key]
              |                               |
              v                               v
+---------------------------+   +---------------------------+
|    AI Explanation Layer   |   |  Local Template Fallback  |
| (Briefing + Chat)         |   |    (Concatenated rules)   |
+---------------------------+   +---------------------------+
              |                               |
              +---------------+---------------+
                              |
                              v
+-------------------------------------------------------------+
|               Control-Room Assistant UI                     |
|        (Accept / Dismiss → Decision Log audit trail)        |
+-------------------------------------------------------------+
```

**Gen AI usage (both required forms):**
- **Development tool:** prompt-driven work across frontend, backend, tests, and documentation.
- **Runtime feature:** optional Gemini “AI Summary” and assistant chat over deterministic recommendations.

---

## 3. Technology Stack & Languages Used
The project is built entirely on a unified **TypeScript** stack:

| Layer | Technology / Libraries | Purpose |
| --- | --- | --- |
| **Languages** | TypeScript, SQL (SQLite Dialect) | Base development language and database queries |
| **Frontend** | React 18, Vite | Application structure and fast hot-module replacement |
| **Styling** | Tailwind CSS | Utility-first styling for high-density HUD interfaces |
| **3D Rendering** | Three.js, React Three Fiber (R3F), @react-three/drei | Interactive 3D Stadium blueprint rendering with camera tweens |
| **State & Motion** | React Context API, custom hooks, Framer Motion | Centralized operations state and UI motion (respects `prefers-reduced-motion`) |
| **Icons** | Lucide React | Clean, scalable operational icons (also used for non-color status cues) |
| **Backend** | Node.js, Express (v5.x) | Lightweight API router and services |
| **Validation** | Zod | Schema validation for API payloads and configuration |
| **Database** | SQLite, Drizzle ORM, `better-sqlite3` | Local, self-contained persistence layer with zero external dependencies |
| **WebSockets** | `ws` package | Bi-directional, real-time message broadcasting |
| **Logging & Security** | Pino Http, Helmet, Express Rate Limit, CORS, Compression | High-performance JSON logging, rate limiting, and security compliance |
| **Testing** | Vitest, React Testing Library, Supertest | Unit testing, integration testing, and API routing verification |
| **Deploy** | Netlify (frontend), Railway (backend) | Production SPA + API/WebSocket hosting |

---

## 4. Database Schema & Data Models
The database utilizes a local SQLite database file generated dynamically using **Drizzle ORM**. Below is the table layout:

### Table Structure Detail:
*   **`venues`**: Stores zones (e.g., Main Concourse, Sector Gate A) and stand sections. Fields: `id`, `name`, `zoneCode`, `capacity`, `currentOccupancy`, `gateLocked` (boolean), `incidents`, `kind` ('zone' | 'section').
*   **`tournaments`**: Tracks active tournaments. Fields: `id`, `name`, `status`, `currentRound`, `totalRounds`.
*   **`rounds`**: Single-elimination stages. Fields: `id`, `tournamentId` (foreign key), `name`, `orderIndex`, `startDate`, `endDate`.
*   **`matches`**: Live, scheduled, or completed matches. Fields: `id`, `tournamentId`, `roundId`, `venueId`, `teamHomeName`, `teamAwayName`, `teamHomeScore`, `teamAwayScore`, `status` ('scheduled' | 'live' | 'delayed' | 'completed' | 'cancelled'), `clockSeconds`, `period`, `scheduledStart`, `statusLabel`, `nextMatchId`, `winner` ('home' | 'away').
*   **`match_events`**: Incremental updates. Fields: `id`, `matchId`, `type` ('goal' | 'card' | 'substitution' | 'timeout'), `team`, `minute`, `description`.
*   **`alerts`**: Telemetry incidents. Fields: `id`, `venueId`, `severity` ('info' | 'warning' | 'critical'), `message`, `acknowledged` (boolean), `createdAt`, `acknowledgedAt`.
*   **`operators`**: User profiles with access credentials. Fields: `id`, `name`, `email`, `passwordHash`, `role` ('admin' | 'operator' | 'viewer').
*   **`decision_log_entries`**: History of operator decisions on recommendations. Fields: `id`, `recommendationId`, `operatorId`, `action` ('accepted' | 'dismissed'), `recommendationTitle`, `suggestedAction`, `reasoningSnapshot`, `createdAt`.

Frontend and backend keep **parallel** `types/operations` models (mirrored, not a shared package).

---

## 5. Connectivity & Live Synchronization
The application maintains live connectivity across several layers:

1.  **Authentication & REST API**:
    *   Protected API endpoints require JWT authorization (`Authorization: Bearer <token>`).
    *   Granular role checks restrict operations (e.g., `admin` and `operator` can toggle gates or acknowledge alerts; `viewer` is read-only).
2.  **WebSocket Broker**:
    *   Client connects to `ws://localhost:4000/ws` locally, or `wss://stadium-backend-production.up.railway.app/ws` in production.
    *   Type-safe subscriber system maps events:
        *   `match:updated` → live scoreboard updates.
        *   `venue:updated` → occupancy gauges & 3D sector highlight changes.
        *   `alert:created` / `alert:acknowledged` → incident list updates.
        *   `assistant:recommendations-changed` → re-evaluation of recommended dispatches.
    *   **Resiliency**: WebSocket auto-reconnect with exponential backoff (capped at 10 seconds).
3.  **Real-Time Simulation**:
    *   When `ENABLE_SIMULATOR=true`, a background task generates live score ticks, clocks, and incident dispatches on the server.

---

## 6. System Efficiency & Optimization
The system was engineered for local-first resource use and control-room density:

*   **Zero External DB Latency**: Self-contained SQLite via `better-sqlite3` — sub-millisecond reads/writes, no hosted DB required for core eval.
*   **Deterministic Reasoning Speed**: Recommendations from local pure TypeScript rules (O(N)-class passes), not LLM roundtrips.
*   **Recommendation Cache**: Backend short-TTL cache (`recommendationCache.ts`) avoids recomputing identical recommendation sets on bursty poll/WS refresh paths.
*   **Windowed Lists**: Alert feed, decision log, and live event lists use a rem-scaled `WindowedList` so long sessions keep DOM size bounded and text zoom still works.
*   **Three.js Geometry Re-use**: Shared geometries/materials for stadium primitives to cut draw calls and GC pressure.
*   **Tween-damped Cameras**: Viewpoint transitions via `lerp` in the R3F render loop.
*   **Express Middleware Stack**: `compression()`, `helmet()`, `express-rate-limit`, `pino-http` (redacts secrets).
*   **AI API Throttling**: Frontend paces Gemini (~15 req/min) with a single retry on rate-limit responses.

---

## 7. Accessibility & Usability (Recent Passes)
Conservative, additive UI hardening (no logic rewrite):

*   **Non-color status signaling**: `StatusPill` (icon + label per state); alert severity icons + text; venue occupancy icons + NOMINAL/ELEVATED/CRITICAL labels; decision-log Accept/Dismiss icons.
*   **Reduced motion**: Global CSS kills CSS animations/transitions under `prefers-reduced-motion`; Framer Motion paths (`ScoreDigit`, alerts, assistant panel, route fades) snap to final state when reduced motion is set.
*   **Touch targets**: Interactive controls target ~44×44px (`min-h-11` / `min-w-11`), including Accept/Dismiss, ACK, mobile tab bar, and assistant chrome.
*   **Zoom / text resize**: Rem-based windowed list heights; wrap-friendly dense panels; bracket cards avoid clipping scaled text; shell overflow allows scroll under zoom.
*   **Document structure**: `lang="en"` on root HTML; single page `h1` via TopBar; nested `h2`/`h3` without skipped levels in the assistant.

---

## 8. Current Project Status

### Compilation & Build:
*   **Backend Build**: **Passes**. Compiles to `dist/`; Railway start command `node dist/src/server.js`.
*   **Frontend Build**: **Passes**. Vite production bundle; Netlify SPA fallback via `netlify.toml`.

### Testing (verified locally):
*   **Frontend**: **40 / 40 passing** (6 files) — Vitest + Testing Library / jsdom.
*   **Backend**: **37 / 37 passing** (9 files) — Vitest + Supertest (auth, routes, assistant engine, Gemini config, recommendation cache, WebSocket-related coverage as implemented).
*   Assistant-engine focused cases: **19** frontend + **13** backend.

### Production Deploy:
*   **Netlify** (`stadium-frontend`): production URL live; env wires `VITE_API_BASE_URL` / `VITE_WS_URL` to Railway.
*   **Railway** (`stadium-backend`): production service online; `/api/health` returns `{ status: "ok", database: "ok" }`.

### Feature Checklist:
- [x] App Shell with local/UTC clock
- [x] Live Operations Dashboard (occupancy gauges, match metrics, alert lists)
- [x] Collapsible Operations Assistant with Accept/Dismiss + Decision Log
- [x] Deterministic four-rule recommendation engine + optional Gemini AI Summary / chat
- [x] 3D Interactive Stadium View (stands, tooltips, orbit limits)
- [x] 2D Vector Blueprint fallback
- [x] Interactive Tournament Bracket View with path coloring
- [x] Live Match Feed and Single Match Focus
- [x] Background simulator for match events and updates
- [x] JWT role-based access (`admin` / `operator` / `viewer`)
- [x] Accessibility pass (status beyond color, reduced motion, touch targets, zoom, headings)
- [x] Submission clarity docs (`README` challenge section + `SCENARIO.md`)
- [x] Frontend + backend production deploys (Netlify + Railway)
- [ ] Make Git repository public (Action Required if still private before submission)

### Demo Logins
Password for all demo users: `Stadium123!`
- `admin@stadium.local` — admin
- `operator@stadium.local` — operator
- `viewer@stadium.local` — viewer
