# Allocation Load Scene — Self-Assembly Spec

## What the user wants

Replace `AllocationLoadScene` (the separate "boot console" UI that was created) with a version that **renders the exact same interface as `AllocationScene`** (running state), but makes every panel and element **assemble itself onto the screen** one by one with staggered entrance animations before any allocation data arrives.

The user does **not** want a new UI. They want the original allocation dashboard — header, queue node, connectors, FCFS engine, fallback engine, latest-matches node, sidebar stats card, and mentor-load constellation — to visually build itself piece by piece when the scene first appears, as if the system is wiring itself up live.

---

## Desired behaviour

1. **Scene mounts** (`allocation-load` type pushed to display).
2. **Background** (orbs, grid, gradient) appears immediately — same as the running scene.
3. **Header** slides in from the top (MentorFlow logo + "Engine Ready" pill).
4. **Main card shell** fades/scales in.
5. **Queue node** slides in from the left with a short delay.
6. **Left connector wire** draws itself left-to-right (stroke-dashoffset animation).
7. **FCFS engine panel** slides in from below.
8. **Fallback engine panel** slides in from below with a slightly longer delay.
9. **Right connector wire** draws itself.
10. **Latest-matches node** slides in from the right — shows "Waiting for first match…" placeholder.
11. **Sidebar stats card** slides in from the right.
12. **Mentor-load grid** fades in — tiles appear with a staggered wave (index × 30ms delay).
13. **Status pill** in header says **"Engine Ready"** (amber/indigo colour) not "Allocation Live".
14. **Queue stack** shows real mentor names loaded from `/api/display/mentors` in the placeholder cards (or synthetic names). The "waiting" counter shows the real mentee total if available, otherwise `—`.
15. **No ticker runs**, no chips fly, no progress bar fills — everything is at rest (0% progress).
16. **Connector dot** pulses but does not move (animation paused or removed).
17. Once fully assembled, the layout idles — engine core rings spin slowly, mentor tiles twinkle gently.

---

## Exactly one file to edit

### `components/screens/display/AllocationScene.tsx`

**Replace the entire `AllocationLoadScene` function** (lines ~23–222, the one with the boot console, scan bar, and separate layout) with a new implementation that:

1. **Reuses `AllocationScene`'s JSX structure** almost verbatim.
2. Adds a `useEffect` that sets an `assembled` boolean after ~200ms (one RAF after mount) to trigger CSS transitions.
3. Wraps each major section in a `<div>` with:
   - `opacity: assembled ? 1 : 0`
   - `transform: assembled ? "none" : "<enter direction>"`
   - `transition: "opacity Xs ease, transform Xs cubic-bezier(.16,1,.3,1) <delay>s"`
4. The assembly delays (all relative to mount):
   - Header: 0ms
   - Main card shell: 80ms
   - Queue node: 180ms
   - Left connector: 280ms (wire draws via `strokeDashoffset` from `CIRC → 0`)
   - FCFS engine: 360ms
   - Fallback engine: 460ms
   - Right connector: 540ms
   - Latest-matches node: 620ms
   - Sidebar stats card: 320ms
   - Mentor-load grid: 700ms
   - Mentor tiles: each tile gets `animationDelay: index * 30ms` via `alloc-tile-in` keyframe
5. Loads mentors from `/api/display/mentors` to seed the constellation grid (all allocated = 0).
6. Shows a dummy queue of 4 placeholder cards using `rand(FIRST) + rand(LAST)` names.
7. Status pill reads **"Engine Ready"** in amber (`#fbbf24` / `rgba(251,191,36,…)`).
8. All counts are 0, progress bars are empty, connectors show but the travelling dot is paused.

### What NOT to change

- `AllocationScene` (the running state) — touch nothing.
- `index.tsx` — already wired correctly (`allocation-load` → `AllocationLoadScene`).
- `AdminScreen.tsx` — buttons already correct.
- `lib/display-state.ts` — type already exists.

---

## New keyframes needed (add to the `<style>` block inside `AllocationLoadScene`)

```css
/* Tile staggered wave-in */
@keyframes ald-tile-in {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 1; transform: scale(1);   }
}

/* Wire draw (for SVG stroke-dashoffset if you add SVG connectors) */
/* Not strictly needed if you use CSS transition on opacity/transform for the connector divs */
```

---

## Implementation steps (in order)

1. Delete the existing `AllocationLoadScene` function body (keep the export name).
2. Add state: `const [assembled, setAssembled] = useState(false)` and `const [mentors, setMentors] = useState<MentorLoadEntry[]>([])`.
3. Add `useEffect` that calls `requestAnimationFrame(() => requestAnimationFrame(() => setAssembled(true)))` on mount (double-RAF ensures layout is done before transitions start).
4. Add `useEffect` to fetch `/api/display/mentors` and populate `mentors`.
5. Copy the full JSX from `AllocationScene`'s `return (...)` block.
6. Replace all live data refs (`revealedCount`, `fcfsCount`, `fbCount`, `masterPct`, `fcfsPct`, `fbPct`, `displayed`, `queueItems`, `mentorLoad`, `hitMentorName`, `isComplete`) with static zero-state values:
   - `revealedCount → 0`
   - `fcfsCount → 0`, `fbCount → 0`
   - `masterPct → 0`, `fcfsPct → 0`, `fbPct → 0`
   - `displayed → []`
   - `queueItems → 4 dummy entries` (generated once with `rand(FIRST)+rand(LAST)`)
   - `mentorLoad → mentors` (from the fetch)
   - `hitMentorName → null`
   - `isComplete → false`
   - `total → real mentee total from /api/display/registrations if available, else 0`
   - `activeEngine → null`
7. Wrap each structural region in a transition `<div>`:

   ```tsx
   <div style={{
     opacity: assembled ? 1 : 0,
     transform: assembled ? "none" : "translateY(-16px)",
     transition: `opacity .45s ease 0s, transform .55s cubic-bezier(.16,1,.3,1) 0s`,
   }}>
     {/* header */}
   </div>
   ```

   Use the delays from the table above.
8. For the mentor tiles, pass `hitName={null}` and add `animationDelay: \`${index * 30}ms\`` to each tile's `alloc-tile-in` animation inside `MentorLoadGrid` (or use a prop like `assembling={true}` to trigger the stagger).
9. Change the status pill label to **"Engine Ready"** and colour to amber.
10. Change the `processing/complete` badge to say **"Standby"** in a neutral blue.
11. Remove `alloc-travel` animation from connector dots (set `animationPlayState: "paused"`).
