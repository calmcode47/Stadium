# Stadium & Tournament Operations — Animation & Motion Architecture

This document outlines the animation philosophy, orchestration patterns, transition specifications, real-time telemetry effects, and accessibility compliance rules implemented in the **Smart Stadium & Tournament Operations Platform**.

---

## 1. Motion Philosophy & Control-Room Standards

Animations in a mission-critical control room are **functional telemetry tools**, not decorative flourishes. Every motion serves one of four operational purposes:
1. **Immediate Attention Direction**: Signaling high-severity incidents, goals, or critical crowd bottlenecks.
2. **State Transition Clarity**: Showing data continuity during page navigation, drawer expansion, and sector drill-down.
3. **Data Refresh Confirmation**: Confirming live WebSocket packet ingest via unobtrusive pulses and flashes.
4. **Spatial Comprehension**: Smoothing 3D camera transitions between pitch-level, stand-level, and stadium overview perspectives.

```
+-----------------------------------------------------------------------------------------+
|                               CONTROL ROOM MOTION BUDGET                                |
|                                                                                         |
|  [TARGET: 60 FPS]     [LATENCY: < 200MS]     [GPU COMPOSITED]    [REDUCED MOTION]       |
|  No dropped frames     Short, crisp curves    transform &         100% compliant via    |
|  on 1080p HUDs         for fast reactions     opacity only        useReducedMotion()    |
+-----------------------------------------------------------------------------------------+
```

### Performance Constraints:
- **Zero Layout Thrashing**: Animations are strictly restricted to GPU-composited properties (`transform`, `opacity`, `filter`, and `text-shadow`). No layout-inducing properties (`width`, `margin`, `top`, `left`) are animated in continuous loops.
- **Strict Duration Limits**: Interface transitions are capped at **180ms – 250ms**. Telemetry flash decays are capped at **1.2s**.
- **Frame Budget**: Transitions must execute within a 16.6ms frame budget (60 FPS) on dual-monitor control room setups.

---

## 2. Animation Technology Stack

The platform employs a layered animation engine:
- **Framer Motion v12**: Orchestrates complex layout transitions, page routing, accordion disclosures, slide-over panels, and dynamic entry feeds.
- **Tailwind CSS & CSS3 Keyframes**: Powers low-overhead infinite telemetry loops (`animate-pulse`, `animate-ping`, `animate-spin`).
- **Three.js (`useFrame`) Vector Interpolation**: Manages procedural 3D camera lerping, damping, and continuous pitch rotations.

---

## 3. Key Framer Motion Orchestrations

### 3.1 Route Transitions (`AppShell.tsx`)
When operators switch routes (e.g., from Live Operations to 3D Stadium View), the viewport executes an instant cross-fade with a subtle 8px vertical offset to maintain orientation without causing disorientation:

```typescript
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={location.pathname}
    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
    transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
    className="w-full flex-grow flex flex-col min-h-0"
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```
- **Mode**: `mode="wait"` prevents content overlap between exiting and entering dashboards.
- **Duration**: `180ms` with `easeOut` ensures rapid page readiness.

---

### 3.2 Neon Scoreboard Flash (`ScoreDigit.tsx`)
Live football scores remount using their integer value as a React key (`key={value}`). This triggers a rapid neon burst that decays cleanly over 350ms, confirming the telemetry packet to the operator:

```typescript
// Neon glow definitions mapped to tokens
const glowColors = {
  primary: 'rgba(232, 237, 242, 0.8)', // Primary text glow
  cyan: 'rgba(0, 233, 255, 0.8)',       // Cyan live glow
  amber: 'rgba(255, 176, 32, 0.8)'      // Amber warning/score glow
}

<motion.span
  key={value}
  aria-live="polite"
  initial={shouldReduceMotion ? { opacity: 1 } : { 
    opacity: 0.6,
    textShadow: `0 0 20px ${glowColors[colorVariant]}`,
    scale: 0.98
  }}
  animate={shouldReduceMotion ? { opacity: 1 } : { 
    opacity: 1,
    textShadow: '0 0 0px rgba(0, 0, 0, 0)',
    scale: 1
  }}
  transition={shouldReduceMotion ? { duration: 0 } : { 
    duration: 0.35, 
    ease: 'easeOut' 
  }}
  className={`font-display inline-block leading-none select-none ${colorMap[colorVariant]}`}
>
  {value}
</motion.span>
```
- **Scale**: Subtle expansion from `0.98` to `1.0` avoids layout jitter.
- **Glow**: Intense radial halo (`textShadow: 0 0 20px`) that smoothly settles to zero.

---

### 3.3 Collapsible Operations Assistant (`AssistantPanel.tsx`)
The operations assistant features two interconnected animation surfaces:

1. **Collapsed Vertical Rail Entrance**:
   - Slides smoothly from screen-right margin (`x: 20 -> 0`, `opacity: 0 -> 1`) when the drawer closes.
   - Houses a continuous pulsing Brain indicator and rotating telemetry glyphs.

2. **Expanded Slide-Over Drawer**:
   - Slides from `x: 100%` to `x: 0%` using a high-performance tween.
   - Simultaneous backdrop opacity transition (`0 -> 0.3`) on mobile viewports.

```typescript
<motion.div
  initial={shouldReduceMotion ? false : { x: '100%' }}
  animate={{ x: 0 }}
  exit={shouldReduceMotion ? undefined : { x: '100%' }}
  transition={{ type: 'tween', ease: 'easeOut', duration: shouldReduceMotion ? 0 : 0.25 }}
  className="fixed right-0 top-0 bottom-0 w-full max-w-[380px] bg-surface/98 border-l border-cyan/25 backdrop-blur-lg z-40 shadow-2xl flex flex-col p-4 md:p-5 select-none"
>
```

3. **Accordion Reasoning Disclosures**:
   - Clicking "Why is this recommended?" or the Gemini API settings toggles an animated container:
   ```typescript
   <motion.div
     initial={{ height: 0, opacity: 0 }}
     animate={{ height: 'auto', opacity: 1 }}
     exit={{ height: 0, opacity: 0 }}
     transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
     className="overflow-hidden"
   >
   ```

---

### 3.4 Telemetry Feed Flash & Stagger (`AlertsFeedPanel.tsx` & `SingleMatchFocus.tsx`)
When new incidents or match events arrive over WebSocket, the newest entry triggers an attention-grabbing background flash calibrated to the event severity, which gradually decays into standard elevated surface tone:

```typescript
const flashBgColors = {
  goal: 'rgba(46, 204, 113, 0.35)',        // Green
  card_yellow: 'rgba(255, 176, 32, 0.35)', // Amber
  card_red: 'rgba(255, 71, 87, 0.35)',     // Danger Red
  substitution: 'rgba(0, 217, 255, 0.35)'  // Cyan
}

<motion.div
  initial={
    isNewest && !shouldReduceMotion
      ? { opacity: 0, y: -10, backgroundColor: currentFlashColor }
      : false
  }
  animate={{
    opacity: 1,
    y: 0,
    backgroundColor: 'rgba(28, 36, 45, 0.3)',
    transition: {
      backgroundColor: shouldReduceMotion ? { duration: 0 } : { duration: 1.2, ease: 'easeOut', delay: 0.15 },
      opacity: { duration: shouldReduceMotion ? 0 : 0.25 },
      y: { duration: shouldReduceMotion ? 0 : 0.25 }
    }
  }}
>
```
- **Entrance**: Fast vertical drop (`y: -10 -> 0`) in `250ms`.
- **Decay**: Chromatic background flash holds for `150ms`, then dissipates into muted surface color over `1.2s`.

---

## 4. CSS Keyframe Utilities & Telemetry Loops

Low-overhead CSS animations communicate persistent background activity:

| Class | Animation | Target Use Case | Visual Behavior |
| :--- | :--- | :--- | :--- |
| `animate-pulse` | Opacity oscillation (1.0 -> 0.5 -> 1.0) | Live match clock, active incidents, AI summary streaming | 2s rhythmic breathing effect |
| `animate-ping` | Scale + fade ring (1.0 -> 2.0, opacity 0.75 -> 0) | Panel live indicators, critical alerts, radar sweep | Expands outward like an active sonar pulse |
| `animate-spin` | Infinite 360° rotation | Substitution icons (`3s`), loading spinners (`Loader2`) | Smooth, constant clockwise rotation |
| `animate-bounce` | Subtle vertical hop | Attention callout on empty queue warnings | Gentle bounce highlighting actionable UI |

### Panel Live Indicator Implementation:
```html
<div className="absolute top-2 right-2 flex h-2 w-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
</div>
```

---

## 5. 3D Camera & Spatial Animations

In `StadiumInteractive3D.tsx`, camera movements are decoupled from DOM re-renders and computed per-frame using vector math:

```
Camera Tweening Pipeline:
+-------------------+      useFrame(delta)      +--------------------+
| Target Preset:    | ------------------------> | Smooth Lerp:       |
| - Overview [0,7,9]|                           | camera.pos.lerp()  |
| - Pitch [0,.4,3.2]|                           | target.lookAt.lerp |
| - North [0,3.5,-6]|                           +--------------------+
+-------------------+                                      |
                                                           v
                                                Render 60 FPS Viewport
```

### Camera Interpolation Math (`CameraTween`):
```typescript
useFrame((state, delta) => {
  const target = presets[preset]
  const speed = 5.0 * delta // Damped smoothing factor

  // Smoothly interpolate camera position
  camera.position.lerp(target.position, speed)

  // Smoothly interpolate lookAt focal target
  if (controls) {
    const currentTarget = new THREE.Vector3().copy(controls.target)
    currentTarget.lerp(target.lookAt, speed)
    controls.target.copy(currentTarget)
    controls.update()
  }
})
```
- **Damping Factor**: `5.0 * delta` ensures frame-rate independent easing regardless of screen refresh rate (60Hz, 120Hz, or 144Hz displays).
- **Subterranean Clamping**: OrbitControls clamp polar angle at `Math.PI / 2 - 0.05` to prevent cameras from clipping beneath the pitch floor.

---

## 6. Micro-Interactions & State Transitions

### 6.1 Tactical Button Inversion
Buttons feature a high-contrast inverse color shift on hover:
- **Primary**: Solid cyan background flips to transparent with cyan text and crisp cyan outline in `200ms`.
- **Secondary**: Transparent cyan border fills with `rgba(0, 217, 255, 0.05)` subtle glowing tint.

### 6.2 Tournament Bracket Route Lighting
In `BracketView.tsx`, winning teams light up connecting bracket branch lines. Advancing winners switch connecting lines from faint `cyan/10` to active `cyan` borders, giving operators an instant trace of tournament lineage.

### 6.3 3D Sector Highlight & Wireframe Emission
Hovering or selecting stadium sectors dynamically transitions mesh opacity (`0.08 -> 0.35`) and edge line brightness (`0.28 -> 1.0`), providing instant tactical feedback on hover without requiring heavy texture reloads.

---

## 7. Accessibility & Reduced Motion Handling

The platform implements a comprehensive **dual-layer reduced-motion architecture**:

### 7.1 Universal CSS Kill-Switch (`globals.css`)
When `prefers-reduced-motion: reduce` is enabled in system settings, every CSS transition and keyframe animation across the entire DOM is forcibly snapped to zero duration:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    transition: none !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
    background-attachment: initial !important;
    scroll-behavior: auto !important;
  }
}
```

### 7.2 Framer Motion `useReducedMotion()` Hook
Every Framer Motion component subscribes to the `useReducedMotion()` React hook. When active:
- Slide offsets (`x: 20`, `y: 8`, `x: '100%'`) are stripped.
- Opacity transitions jump directly to `1.0`.
- Durations are evaluated to `0s`.
- Flash effects are disabled, rendering the item immediately in its resting state.

```typescript
const shouldReduceMotion = useReducedMotion()

// Example from ScoreDigit.tsx:
initial={shouldReduceMotion ? { opacity: 1 } : { 
  opacity: 0.6,
  textShadow: `0 0 20px ${glowColors[colorVariant]}`,
  scale: 0.98
}}
animate={shouldReduceMotion ? { opacity: 1 } : { 
  opacity: 1,
  textShadow: '0 0 0px rgba(0, 0, 0, 0)',
  scale: 1
}}
transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
```

This ensures full compliance with **WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions)**, guaranteeing a safe operating environment for users with vestibular disorders.

