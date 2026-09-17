# Stadium & Tournament Operations — Design System & UI Architecture

This document specifies the design philosophy, visual design language, design tokens, component primitives, layout architecture, and accessibility standards for the **Smart Stadium & Tournament Operations Platform**.

---

## 1. Design Philosophy & Vision

The platform is purpose-built for **stadium event control rooms**, **on-site operations staff**, and **tournament directors**. The UI prioritizes situational awareness, high-density data ingestion, sub-second decision making, and optical comfort during long operational shifts.

```
+-------------------------------------------------------------------------------+
|                      STADIUM OPERATIONS CONTROL CONSOLE                       |
|                                                                               |
|  [HIGH DENSITY]       [TACTICAL DARK]        [DETERMINISTIC]   [SUB-SECOND]   |
|  Dense telemetry      Pure dark canvas       Color + Icon      Real-time HUD  |
|  without clutter      avoids eye fatigue     never ambiguous   at 60 FPS      |
+-------------------------------------------------------------------------------+
```

### Core Design Tenets:
1. **Tactical Dark Mode as Default**: Control rooms operate in dim or variable ambient lighting. Deep blacks (`#0A0E12`) and muted carbon surfaces (`#12181F`, `#1C242D`) minimize glare and visual fatigue.
2. **Deterministic Status & Redundancy (WCAG AA)**: Color is never used as the sole conveyor of information. Every critical indicator combines a distinctive color, an alphanumeric status label, and a recognizable geometric/Lucide icon.
3. **Cyber-Industrial HUD Aesthetic**: High-contrast vector borders (`border-cyan/20`), technical scanlines (`.bg-scanlines`), subtle isometric grid textures (`.bg-grid`), and monospace metadata evoke mission-control aerospace telemetry.
4. **Sharp, Constrained Radii**: Corner rounding is strictly clamped between `0px` (sharp architectural lines) and `4px` (subtle edge softening on major panels), avoiding oversized "toy-like" bubbles.
5. **Decoupled Telemetry & AI Layers**: Deterministic telemetry metrics and rule evaluations remain primary and instantly visible; Gen AI summaries and interactive LLM chat sit in dedicated secondary panels.

---

## 2. Color Palette & Design Tokens

The system utilizes Tailwind CSS tokens mapped to explicit semantic roles. The color scheme is calibrated against a `#0A0E12` canvas to guarantee contrast ratios exceeding **4.5:1** for body text and **3:1** for UI components.

### 2.1 Base Surface Tokens

| Token | Hex Value | Opacity Variants | Role & Description |
| :--- | :--- | :--- | :--- |
| `base` | `#0A0E12` | `100%`, `50%`, `20%` | Deepest background layer, page root canvas, terminal sinks |
| `surface` | `#12181F` | `100%`, `85%`, `50%`, `40%` | Standard card and module backdrops, navigation rail, toolbars |
| `elevated` | `#1C242D` | `100%`, `60%`, `40%`, `30%` | Hover states, table headers, drawer interiors, popover modals |

### 2.2 Semantic & Accent Tokens

| Token | Hex Value | Tailwind Class | Contrast (on Base) | Operational Context |
| :--- | :--- | :--- | :--- | :--- |
| **Cyan (Live)** | `#00D9FF` | `text-cyan`, `bg-cyan` | **11.2:1** | Active matches, live sockets, primary actions, selected 3D sectors |
| **Amber (Score/Warning)** | `#FFB020` | `text-amber`, `bg-amber` | **9.1:1** | Match scores, delayed kickoffs, warning alerts, elevated capacity (80–90%) |
| **Success** | `#2ECC71` | `text-success`, `bg-success` | **8.4:1** | Completed matches, nominal capacity (<80%), gates unlocked, healthy nodes |
| **Danger** | `#FF5A6B` | `text-danger`, `bg-danger` | **5.8:1** | Critical alerts, gate lockdown, critical occupancy (>90%), match delay risks |
| **Text Primary** | `#E8EDF2` | `text-text-primary` | **13.4:1** | High-importance metrics, headers, team names, primary data values |
| **Text Muted** | `#8B98A5` | `text-text-muted` | **6.1:1** | Data labels, timestamps, stadium metadata, inactive tab items |

### 2.3 Opacity Tier Conventions for Cyan Wireframes

Cyan is the signature accent color of the Stadium HUD. It is layered using standardized Tailwind opacity stops:
- `cyan/5` (`rgba(0, 217, 255, 0.05)`): Background tints for secondary buttons and subtle hover highlights.
- `cyan/10` (`rgba(0, 217, 255, 0.10)`): Status badge backgrounds, divider lines, disabled wireframes.
- `cyan/15` (`rgba(0, 217, 255, 0.15)`): Module sub-borders, vector pitch markings, 3D structural floodlight poles.
- `cyan/20` (`rgba(0, 217, 255, 0.20)`): Standard panel border lines (`border-cyan/20`), default interactive boundaries.
- `cyan/35` – `cyan/50` (`rgba(0, 217, 255, 0.35 - 0.50)`): Active tab indicators, hovering card borders, 3D pillar mesh overlays.
- `cyan/70` – `cyan/100` (`rgba(0, 217, 255, 0.70 - 1.0)`): Live pings, focused interactive elements, selected sector outlines.

---

## 3. Typography & Text Hierarchy

Three distinct font families form the typographic hierarchy, each dedicated to a functional cognitive layer:

```
+---------------------------------------------------------------------------------------+
|  BEBAS NEUE        MATCH SCORES, LARGE HERO HEADERS, HIGH-IMPACT METRICS             |
|  DM MONO           TELEMETRY, GATES, TIMESTAMPS, JSON IDS, COORDINATES, LABELS       |
|  BARLOW            OPERATOR REASONING, ASSISTANT CHAT, DESCRIPTIONS, INPUTS          |
+---------------------------------------------------------------------------------------+
```

### 3.1 Font Families

1. **`font-display` — Bebas Neue (`sans-serif`)**
   - **Characteristics**: Condensed, tall, geometric grotesque, uppercase-only.
   - **Usage**: Live match scoreboard scores (`ScoreDigit`), section hero titles, major metric values.
   - **Weights**: Regular 400 (all caps).

2. **`font-mono` — DM Mono (`monospace`)**
   - **Characteristics**: Clean, proportional monospace with distinct digit distinctions (slashed zero, distinct 1/I/l).
   - **Usage**: Telemetry readouts, clock display (`05:58:41 UTC`), gate codes (`SECTOR GATE B (WEST)`), status pills, button labels, coordinate feeds.
   - **Weights**: 300 Light, 400 Regular, 500 Medium.

3. **`font-body` — Barlow (`sans-serif`)**
   - **Characteristics**: Highly legible DIN-style humanist grotesk optimized for screen density.
   - **Usage**: Operator dispatch descriptions, AI explanations, rule reasoning dialogs, form inputs, assistant chat messages.
   - **Weights**: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.

### 3.2 Typographic Scale

| Class / Size | Family | Tracking | Leading | Target Elements |
| :--- | :--- | :--- | :--- | :--- |
| `text-3xl` / `text-4xl` (30–36px) | `font-display` | `tracking-wide` | `leading-none` | Scoreboard counters, live score digits |
| `text-xl` / `text-2xl` (20–24px) | `font-display` | `tracking-wider` | `leading-tight` | Sector detail headers, view hero titles |
| `text-sm` / `text-base` (14–16px) | `font-body` | `tracking-normal` | `leading-snug` | Assistant responses, match summaries |
| `text-xs` (12px) | `font-mono` | `tracking-wider` | `leading-relaxed` | Button text, telemetry tables, gate logs |
| `text-[10px]` (10px) | `font-mono` | `tracking-widest` | `leading-normal` | Status pill badges, category tags, clock |
| `text-[8px]` – `text-[9px]` | `font-mono` | `tracking-[0.2em]` | `leading-none` | 3D canvas HUD overlays, micro metadata |

---

## 4. Textures, Shaders & Background Utilities

The control room atmosphere is established using custom CSS background classes declared in `frontend/src/styles/globals.css`:

### 4.1 `.bg-grid` (Technical Matrix Overlay)
Creates a 30px x 30px vector grid with subtle 1px cyan lines at 3% opacity:
```css
.bg-grid {
  background-size: 30px 30px;
  background-image: 
    linear-gradient(to right, rgba(0, 217, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
}
```

### 4.2 `.bg-scanlines` (Cathode Ray Tube Telemetry Emulation)
Adds 4px horizontal scanlines simulating industrial surveillance CRTs:
```css
.bg-scanlines {
  background-image: linear-gradient(
    rgba(10, 14, 18, 0) 50%, 
    rgba(0, 0, 0, 0.25) 50%
  );
  background-size: 100% 4px;
}
```

### 4.3 `.bg-control-room` (Master Viewport Canvas)
Combines radial vignette lighting centered in the control console with matrix grid and scanline patterns:
```css
.bg-control-room {
  background-color: #0A0E12;
  background-image: 
    radial-gradient(circle at 50% 50%, rgba(18, 24, 31, 0.6), #0A0E12),
    linear-gradient(to right, rgba(0, 217, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 217, 255, 0.03) 1px, transparent 1px),
    linear-gradient(rgba(10, 14, 18, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
  background-size: 100% 100%, 30px 30px, 30px 30px, 100% 4px;
}
```

---

## 5. Component Primitives (Design System)

The core UI components live under `frontend/src/components/design-system/`.

### 5.1 `Panel` (`Panel.tsx`)
The foundational structural building block for all dashboard cards, HUD windows, and toolbars.
- **Visuals**: Dark `#12181F` background, `border border-cyan/20`, `rounded-[4px]`, padding `p-4`.
- **Live Mode**: When `live={true}`, renders a pulsing cyan beacon (`animate-ping`) in the top-right corner to denote an active WebSocket telemetry stream.
- **Props**:
  ```typescript
  interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
    live?: boolean
    children?: React.ReactNode
  }
  ```

### 5.2 `ScoreDigit` (`ScoreDigit.tsx`)
High-visibility sports score digit with animated neon pulse on value update.
- **Visuals**: Rendered in `font-display` (Bebas Neue) with an initial text shadow flash `0 0 20px <glowColor>`.
- **Color Variants**: `primary` (`#E8EDF2`), `cyan` (`#00D9FF`), `amber` (`#FFB020`).
- **Accessibility**: Enclosed in `aria-live="polite"` so screen readers announce score changes.

### 5.3 `StatusPill` (`StatusPill.tsx`)
Deterministic multi-state indicator badge. Implements **dual-channel encoding** (color + text label + unique Lucide icon) to comply with accessibility standards.
- **Border**: Sharp `rounded-none`, border width 1px, uppercase monospace text.
- **Variants**:
  | Variant | Border Class | Background | Icon Component | Semantics |
  | :--- | :--- | :--- | :--- | :--- |
  | `live` | `border-cyan` | `bg-cyan/10` | `Radio` | Match currently playing, gate actively streaming |
  | `scheduled` | `border-text-muted/40` | `bg-text-muted/5` | `CalendarClock` | Future event, idle gate |
  | `completed` | `border-success` | `bg-success/10` | `CircleCheck` | Full time, gate nominal/unlocked |
  | `delayed` | `border-amber` | `bg-amber/10` | `ClockAlert` | Kickoff delayed, bottleneck risk |
  | `cancelled` | `border-danger` | `bg-danger/10` | `Ban` | Cancelled fixture, emergency lockdown |

### 5.4 `Button` (`Button.tsx`)
Tactical control button calibrated for control room touchscreens and desktop mice alike.
- **Touch Target Rules**: Explicitly enforces `min-h-11 min-w-11` (44px x 44px) to satisfy WCAG 2.5.5 Touch Target guidelines while preserving compact internal padding.
- **Styling**: `font-mono`, `uppercase`, `tracking-wider`, `rounded-[2px]`.
- **Variants**:
  - `primary`: Solid cyan background (`bg-cyan text-base`), inverted on hover (`hover:bg-transparent hover:text-cyan`).
  - `secondary`: Cyan wireframe (`border border-cyan/40 text-cyan/80`), highlights on hover (`hover:border-cyan hover:bg-cyan/5`).
  - `ghost`: Transparent frame (`text-text-muted hover:text-cyan hover:bg-cyan/5`).

### 5.5 `DataLabel` (`DataLabel.tsx`)
Monospace metadata tag used for panel titles, category indicators, and field keys.
- **Visuals**: `font-mono text-xs tracking-wider text-text-muted uppercase select-none`.

### 5.6 `WindowedList` (`WindowedList.tsx`)
High-performance virtualized list primitive capable of handling thousands of telemetry log entries, alert rows, and incident logs with continuous 60fps scrolling and a fixed DOM footprint.

---

## 6. Layout Architecture & Navigation

The platform uses a responsive app shell (`AppShell.tsx`) configured for 24/7 mission control monitors, desktop workstations, and field tablets:

```
+-----------------------------------------------------------------------------------------------+
| TOP BAR: [LOGO] [SYS STATUS: NOMINAL] [LATENCY: 14MS]            [05:58:41 UTC] [USER ROLE]   |
+-----------+-------------------------------------------------------------------+---------------+
| SIDEBAR   | MAIN WORKSPACE CANVAS                                             | ASSISTANT     |
| (64px /   |                                                                   | COLLAPSED     |
| 256px)    |  - Route: /overview   (Live Operations HUD)                      | RAIL (48px)   |
|           |  - Route: /stadium    (3D Arena Viewport & Sector Inspector)      | or            |
| - Ovvw    |  - Route: /matches    (Scoreboards & Match Event Timelines)       | EXPANDED      |
| - Stadium |  - Route: /brackets   (Tournament Single-Elimination Tree)        | DRAWER        |
| - Matches |  - Route: /preview    (Design System Primitive Catalog)           | (380px)       |
| - Brackets|                                                                   |               |
| - Telemetry                                                                   | [Brain Icon]  |
+-----------+-------------------------------------------------------------------+---------------+
| MOBILE: BOTTOM NAVIGATION BAR (FIXED 64PX)                                                    |
+-----------------------------------------------------------------------------------------------+
```

### 6.1 Desktop Sidebar Navigation
- **Expanded Width**: 256px (`w-64`).
- **Collapsed Mobile**: Transforms into a fixed bottom navigation bar (`h-16`) with high-contrast icon buttons and safe-area padding for notched devices (`env(safe-area-inset-bottom)`).
- **Active Route Highlighting**: Cyan left accent bar (`border-l-2 border-cyan`), cyan glowing text, elevated background.

### 6.2 Top Control Bar (`TopBar.tsx`)
- **Telemetry Clock**: Live digital clock displaying synchronized UTC and local station time, updating every 1000ms.
- **Connection Indicator**: WebSocket connectivity beacon showing current gateway latency (e.g. `14MS`) and server heartbeat.
- **Role Badge**: Visual pill displaying current JWT permission role (`ADMIN`, `OPERATOR`, or `VIEWER`).

### 6.3 Collapsible Operations Assistant Rail (`AssistantPanel.tsx`)
- **Collapsed State**: Unobtrusive 48px vertical rail on the right viewport margin featuring a vertical title (`vertical-text`), pulsing AI brain icon, and unread recommendation badge count.
- **Expanded State**: 380px slide-over HUD panel with priority-ranked recommendation cards (Critical, High, Medium, Low), one-click action dispatch buttons ("Open Overflow Gate", "Dispatch Stewards"), rule reasoning audit logs, and Gemini AI chat.

---

## 7. Accessibility (WCAG 2.1 AA Compliance)

The design system incorporates accessibility criteria into every component:

1. **Visible Cyan Focus Rings**:
   ```css
   *:focus-visible {
     outline: 2px solid #00D9FF !important;
     outline-offset: 2px !important;
   }
   ```
2. **Skip to Content Link**: An accessible skip link (`#main-content`) placed at the top of `AppShell.tsx`, visible on keyboard tab focus.
3. **Screen Reader Announcements**:
   - `ScoreDigit`: `aria-live="polite"` announces score updates.
   - `SingleMatchFocus`: `aria-live="assertive"` for critical events (Goals, Red Cards), `aria-live="polite"` for substitutions and yellow cards.
   - Stadium sector meter: `role="meter"` with explicit `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
4. **Reduced Motion**: Full compatibility with `prefers-reduced-motion: reduce` across both CSS keyframes and Framer Motion hooks (see `animations.md`).
5. **Color Deficit Protection**: No status is communicated solely by hue; icons and explicit text strings accompany all warning levels.

---

## 8. Design System Route & Catalog

To audit and visually inspect all design primitives in real-time, the application provides an interactive **Design System Preview** route at `/preview` (`DesignSystemPreview.tsx`). Operations engineers can test:
- Live radar telemetry ping toggles.
- Scoreboard key-remount animation updates.
- Complete `StatusPill` variant catalogs.
- High-density alert queue rendering with simulated WebSocket ingest.

