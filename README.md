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

## 4. Assumptions Made
- **Simulated Telemetry**: No real-time backend connection or WebSocket API is active in this phase. Data is generated dynamically via a custom simulation hook (`useLiveMatchSimulator`) designed to mimic active telemetry.
- **No Authentication**: Role-based access control (e.g., separating gate override permissions for administrators) is simulated and not locked down behind a real user authentication wall.
- **Configured Thresholds**: Recommendation triggers (e.g., 85% zone occupancy or 2 active security alerts) are illustrative defaults tuned to the mock data for demonstration purposes, rather than limits calibrated for a physical venue.

---

## 5. Setup & Run Instructions

Ensure Node.js (v20.19+ or v22.12+ is recommended) is installed on the host system.

### Install Dependencies
Run the following command from the `frontend/` directory to download packages and configure version locks:
```bash
cd frontend
npm install
```

### Start Development Server
To launch the hot-reloading development server locally:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Optional Gemini AI Configuration
To demonstrate the natural language briefing summaries:
1. Copy the example file: `cp .env.example .env`
2. Open `.env` and assign your Google AI Studio API key to `VITE_GEMINI_API_KEY`.
3. Restart the development server.

### Execute Test Suite
To run the Vitest unit, component, and hook tests:
```bash
npm run test
```

To run tests with code coverage metrics:
```bash
npx vitest run --coverage
```

### Production Compilation
To compile optimized production assets:
```bash
npm run build
```
The compiled files will be output to the `dist/` directory with source maps disabled.

---

## 6. Tech Stack
- **Framework**: React 18
- **Language**: TypeScript
- **Bundler**: Vite 6.4.3
- **Test Runner**: Vitest 4.1.10
- **DOM Test Utilities**: React Testing Library & JSDOM
- **Styling**: Tailwind CSS 3.4.4 & Framer Motion (reduced motion compliant)
- **3D Render Engine**: Three.js & React Three Fiber (R3F)
- **Icon Set**: Lucide React
