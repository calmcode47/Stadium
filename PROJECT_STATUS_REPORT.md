# Smart Stadium & Tournament Operations: Comprehensive Project & Status Report

## 1. Project Overview
The **Smart Stadium & Tournament Operations** platform is designed for venue operations staff and control-room operators. It enables rapid situational awareness, crowd congestion control, security monitoring, match delay analysis, and live tournament bracket progression management. 

At the center of the system is the **Smart Operations Assistant**, which evaluates real-time telemetry logs to produce priority-ranked, actionable dispatches for staff.

---

## 2. Core Architectural Approach
The platform uses a strict **two-layer design** for the Smart Operations Assistant:
1. **Deterministic Decision Engine**: A pure, framework-free TypeScript engine. It evaluates the current operations state (venue zones, stand sections, live matches, unresolved alerts) against defined threshold boundaries (e.g., occupancy ratios, delayed statuses, alert clusters) to generate structured recommendations.
2. **Decoupled AI Explanation Layer**: Uses Google Gemini (defaulting to Gemini Flash-Lite `gemini-3.1-flash-lite-preview` for high speed and quota efficiency) to synthesize deterministic reasoning factors into a natural language sentence. If the Gemini API is offline or key is missing, it falls back to a clean string template generator.

```
+-------------------------------------------------------------+
|               Live Telemetry Data Feed                      |
| (Matches, Zone Occupancies, Section Gates, Unresolved Alerts)|
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|          Deterministic Decision Engine (Core)               |
|      (Pure mathematical evaluations of thresholds)         |
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
| (Briefing Summarization)  |   |    (Concatenated rules)   |
+---------------------------+   +---------------------------+
              |                               |
              +---------------+---------------+
                              |
                              v
+-------------------------------------------------------------+
|               Control-Room Assistant UI                     |
+-------------------------------------------------------------+
```

---

## 3. Technology Stack & Languages Used
The project is built entirely on a unified **TypeScript** stack:

| Layer | Technology / Libraries | Purpose |
| --- | --- | --- |
| **Languages** | TypeScript, SQL (SQLite Dialect) | Base development language and database queries |
| **Frontend** | React 18, Vite | Application structure and fast hot-module replacement |
| **Styling** | Tailwind CSS | Utility-first styling for high-density HUD interfaces |
| **3D Rendering** | Three.js, React Three Fiber (R3F), @react-three/drei | Interactive 3D Stadium blueprint rendering with camera tweens |
| **State & Motion** | React Context API, custom hooks, Framer Motion | Centralized operations state and smooth UI micro-animations |
| **Icons** | Lucide React | Clean, scalable operational icons |
| **Backend** | Node.js, Express (v5.x) | Lightweight API router and services |
| **Validation** | Zod | Schema validation for API payloads and configuration |
| **Database** | SQLite, Drizzle ORM, `better-sqlite3` | Local, self-contained persistence layer with zero external dependencies |
| **WebSockets** | `ws` package | Bi-directional, real-time message broadcasting |
| **Logging & Security** | Pino Http, Helmet, Express Rate Limit, CORS, Compression | High-performance JSON logging, rate limiting, and security compliance |
| **Testing** | Vitest, React Testing Library, Supertest | Unit testing, integration testing, and API routing verification |

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

---

## 5. Connectivity & Live Synchronization
The application maintains live connectivity across several layers:

1.  **Authentication & REST API**: 
    *   Protected API endpoints require JWT authorization (`Authorization: Bearer <token>`).
    *   Granular role checks restrict operations (e.g., `admin` and `operator` can toggle gates or acknowledge alerts; `viewer` is read-only).
2.  **WebSocket Broker**:
    *   Client initiates connection to `ws://localhost:4000/ws`.
    *   Type-safe subscriber system automatically maps events:
        *   `match:updated` -> Dynamic update of live scoreboard.
        *   `venue:updated` -> Real-time occupancy gauges & 3D sector highlight changes.
        *   `alert:created` / `alert:acknowledged` -> Immediate addition/resolution of incidents.
        *   `assistant:recommendations-changed` -> Re-evaluation of recommended dispatches.
    *   **Resiliency**: WebSocket connection includes auto-reconnect logic with exponential backoff capping at a maximum delay of 10 seconds.
3.  **Real-Time Simulation**: 
    *   When `ENABLE_SIMULATOR=true`, a background task generates live score ticks, clocks, and incident dispatches on the server side to simulate live venue activity.

---

## 6. System Efficiency & Optimization
The system was engineered with local-first resource optimization and rendering speed in mind:

*   **Zero External DB Latency**: By running a self-contained SQLite database with `better-sqlite3`, read/write times are sub-millisecond, eliminating external cloud dependency hazards.
*   **Deterministic Reasoning Speed**: Recommendations are calculated instantly using local O(N) pure TypeScript functions instead of queuing costly and slow API roundtrips.
*   **Three.js Geometry Re-use**: Geometries and materials for 3D elements (corner floodlights, poles, planes) are declared out-of-loop to minimize rendering draw calls and CPU garbage collection.
*   **Tween-damped Cameras**: Camera transitions between viewpoints ("Overview", "Pitch Level", "North Stand") are smoothly interpolated using linear interpolation (`lerp`) inside the `@react-three/fiber` render loop.
*   **Express Middleware Stack**:
    *   `compression()`: Compresses all JSON outputs to minimize network package sizes.
    *   `helmet()`: Applies essential HTTP security headers.
    *   `express-rate-limit`: Prevents brute force/denial of service on endpoints.
    *   `pino-http`: Redacts sensitive data like passwords and authentication tokens from JSON logs.
*   **AI API Throttling**: Frontend client restricts Gemini API calls (~15 requests/min) and contains local retry mechanisms to prevent API quota exhaustions.

---

## 7. Current Project Status

### Compilation & Build:
*   **Backend Build**: **Passes**. Successfully compiles target files into `dist/`.
*   **Frontend Build**: **Passes**. Vite production bundling and static asset compilation complete successfully.

### Testing:
*   **Frontend Tests**: **Passes (100%)**. 39 tests across 6 files pass cleanly using Vitest and jsdom.
*   **Backend Tests**: **Setup Conflict**. Complete suite is implemented (8 test files spanning auth, routes, and WS), but Vitest throws a standard ES module config warning (`ERR_REQUIRE_ESM`) related to the `std-env` package dependency inside the Node.js CommonJS environment during startup. 

### Feature Checklist:
- [x] App Shell with local/UTC clock
- [x] Live Operations Dashboard (Occupancy gauges, match metrics, alert lists)
- [x] Collapsible Operations Assistant with acceptance/dismissal tracking
- [x] 3D Interactive Stadium View (Interactive stands, tooltips, orbit control boundary limits)
- [x] 2D Vector Blueprint fallback
- [x] Interactive Tournament Bracket View with path coloring
- [x] Live Match Feed and Single Match Ticker focus
- [x] Background simulator for match events and updates
- [ ] Make Git repository public (Action Required - currently set to private)
