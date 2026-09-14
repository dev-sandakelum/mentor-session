# Allocation Seamless Load → Run Transition Spec

## What the user wants

When the admin presses **Engine Ready** and then **Run Allocation**, the two states
(`allocation-load` → `allocation`) must feel like a **single continuous experience** with
no loading screen, no blank flash, and no jarring break between them.

Additionally, the **4-second delay with the large robot face** (currently cut from
`AllocationScene`) must come back — but only inside `AllocationLoadScene`, as the very
first thing the user sees before the dashboard assembles itself.

---

## Current problems

### Problem 1 — `AllocationScene` shows a blank spinner on transition

In `AllocationScene` (running state), there is a loading guard:

```tsx
// components/screens/display/AllocationScene.tsx  ~line 651
if (!hasData) {
  return (
    <div ...>   {/* 3-dot spinner on dark background */}
    </div>
  );
}
```

When the scene switches from `allocation-load` → `allocation`, this guard fires because
`allDataRef` is empty and the first `/api/display/allocations` fetch hasn't returned yet.
The user sees the spinner for ~300–800ms — a visible blank state between the two screens.

### Problem 2 — the robot face / 4s delay was removed

The original `AllocationScene` had a `minDelayDone` state that showed a large robot face
for at least 4 seconds before revealing the dashboard. That was removed when the two states
were split. The user wants this **restored inside `AllocationLoadScene`** as the opening
sequence before the self-assembly animation runs.

---

## Desired flow (in order)

```
Admin presses "Engine Ready"
  └─ allocation-load mounts
       └─ [0 – 4s]  Large robot face + "Initialising MentorFlow engine…" (full screen)
       └─ [4s]       minDelayDone = true  →  self-assembly animation begins
       └─ [4s – ~6s] Dashboard panels slide in one by one
       └─ [~6s+]     Idle state: mentor tiles loaded, zero counts, "Engine Ready" pill

Admin presses "Run Allocation"  (while allocation-load is still showing OR after it assembled)
  └─ allocation mounts
       └─ NO loading spinner — show the allocation dashboard immediately
       └─ data arrives within ~300ms, drip-feed ticker starts
```

---

## Changes needed

### File 1 — `components/screens/display/AllocationScene.tsx`

#### Change A — Add the robot-face / 4s opening back to `AllocationLoadScene`

Inside `AllocationLoadScene`, add back the minimum-delay logic that was in the old
monolithic `AllocationScene`:

```tsx
const [minDelayDone, setMinDelayDone] = useState(false);

useEffect(() => {
  const t = setTimeout(() => setMinDelayDone(true), 4000);
  return () => clearTimeout(t);
}, []);
```

Before the `assembled` / self-assembly JSX renders, gate everything on `minDelayDone`:

```tsx
if (!minDelayDone) {
  return (
    <div style={{ /* dark full-screen */ }}>
      {/* Background grid + orbs (same as running scene) */}
      <RobotLogoMark size="clamp(120px,16vw,200px)" glow />
      <div>MentorFlow branding + "Allocation Engine" subtitle</div>
      <div>{/* 3 bouncing dots */}</div>
      <div style={{ /* "Initialising MentorFlow engine…" text */ }} />
      <RoboStyles />
      <style>{/* rf-dot, rf-drift1, rf-drift2 keyframes */}</style>
    </div>
  );
}
// then: self-assembly animation below
```

This is identical to what the old monolith showed. Exact JSX is in the old
`AllocationScene` loading block — just move it here.

#### Change B — Remove the loading spinner from `AllocationScene` entirely

Delete the `if (!hasData) { return <spinner> }` block at ~line 651.

Instead, render the **full dashboard JSX unconditionally**, but with all counts at zero
until data arrives. The existing React state already handles this naturally:
- `revealedCount` starts at `0`
- `displayed` starts as `[]`
- `queueItems` starts as `[]`
- `masterPct` starts at `0`

The only difference is the queue stack will be empty and the "waiting" counter will show
`total - 0 = total`. This is acceptable — it looks like the system is just about to start.
Data arrives within ~300–600ms and the drip-feed begins immediately.

If `total` is `0` on first render (before `menteeTotalRef` is set), show `—` or `0` as
the waiting count — both are fine for the sub-second window before data arrives.

---

### File 2 — `components/screens/AdminScreen.tsx`

#### Change C — `handleRunAllocation` should NOT push `allocation-load` first

Currently:
```tsx
const handleRunAllocation = async () => {
  await push({ type: "allocation-load" });   // ← REMOVE THIS LINE
  const assigned = await onRunAllocation();
  void push({ type: "allocation", count: assigned, total: overview.stats.totalMentees });
};
```

Remove the `allocation-load` push. The "Run Allocation" button should push directly to
`allocation`. The admin is expected to press "Engine Ready" first as a separate step — the
two buttons are independent scene switches, not a sequence.

---

## Summary of changes

| File | Line(s) | What to do |
|------|---------|-----------|
| `AllocationScene.tsx` | top of `AllocationLoadScene` | Add `minDelayDone` state + 4s timeout + full-screen robot face gate |
| `AllocationScene.tsx` | ~line 651 | Delete `if (!hasData) { return <spinner> }` block entirely |
| `AdminScreen.tsx` | `handleRunAllocation` | Remove the `await push({ type: "allocation-load" })` line |

---

## Why this works

- **No blank screen on transition**: `AllocationScene` now renders the dashboard shell
  immediately. The empty state (zero counts, empty queue) is visually indistinguishable
  from "just started" because data arrives within a few hundred milliseconds.

- **Robot face only on first load**: The 4s robot-face screen lives in
  `AllocationLoadScene`. When the admin later switches to `allocation`, no loading screen
  is shown at all.

- **Seamless feel**: `SceneTransition` crossfades between the two scenes. Both scenes
  share the same background, same card layout, same colours — so the crossfade feels like
  the same screen transitioning from "ready" to "live" rather than two separate screens.

- **Admin control is clean**: "Engine Ready" and "Run Allocation" are independent buttons.
  Pressing "Run Allocation" directly (without going through "Engine Ready") also works
  fine — the user just skips the loading ceremony.
