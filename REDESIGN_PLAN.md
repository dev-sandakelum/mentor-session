# Front Page Redesign Plan
**Mentor Session 2026 — Mentee-Focused Root Page**

---

## Context

The platform is now in the **Collect Preferences** phase. Mentor registration is closed. The only active user group coming to the root page is **mentees** (new registrations or returning mentees selecting preferences). Admin and mentor registration paths are still reachable by URL but do not belong on the public front page any more.

---

## What Gets Removed

| Element | Current location | Reason to remove |
|---|---|---|
| `HomeNav` (Home / Mentee / Mentors / **Admin** tabs) | `SiteHeader` | Too many tabs; Admin exposed publicly; Mentors tab irrelevant for mentees |
| "Browse Mentors" CTA button | Hero section | Mentors tab is admin-facing now; mentees only need to register/select prefs |
| "Register as Mentee" label on secondary CTA | Hero section | Rename to something more action-oriented (see below) |
| `HeroStats` strip (2 / 3 / FCFS) | Below hero text | System-rule trivia — not useful to a mentee arriving at the page |
| **How it works** cards grid (4 cards) | Below hero | Adds noise; preference phase is already open so onboarding copy is stale |
| `SiteFooter` in `page.tsx` | Bottom | Minimal page needs minimal chrome |

---

## What Stays / Gets Reworked

### 1. Header — slim, brand-only bar
- Keep `SiteHeader` + `Brand` logo.
- Replace `HomeNav` with a **single link**: `"Sign in / Continue →"` that resolves to:
  - `/mentee/prefs` if a mentee session cookie already exists (returning user)
  - `/mentee` if no session (new user)
  - This can be a lightweight `MenteeCTALink` client component that reads `getMenteeId()` — same pattern already used in `MenteeNav`.
- No admin link, no mentor link.

### 2. Hero — focused & concise
- Keep the headline and subtext, trimmed:
  - Headline: **"Find your senior mentor."** (drop `<em>Grow together.</em>` — keep it clean)
  - Sub-paragraph: one sentence max — *"Submit your preferences now and get matched with an experienced senior from your faculty."*
- Remove `HeroStats`.
- **Single primary CTA button** — label driven by session state:
  - No session → **"Register as Mentee"** → `/mentee`
  - Has session → **"Select Your Preferences"** → `/mentee/prefs`
- Optionally a secondary ghost/text link: `"View mentor profiles →"` → `/mentor` (kept small, not a full button)

### 3. Lifecycle stepper — keep, move up
- The `LifecycleStepper` card is genuinely useful — it tells a mentee exactly where in the process they are right now.
- Move it **directly below the hero**, before any other content.
- Remove the spinning icon decoration; keep the card title: `"Where are we now?"` or `"Session Progress"`.

### 4. Kicker / badge
- Keep the `ICT Students' Circle · Mentor Session 2026` kicker above the headline — it anchors context.

### 5. Footer
- Add a minimal inline footer text **inside the page container**, not a full `SiteFooter` component:
  - `ICT Students' Circle · Faculty of Technology · University of Ruhuna`
  - No extra links or chrome.

---

## New Page Structure (visual hierarchy)

```
┌─────────────────────────────────────────┐
│  [Brand Logo]          [Continue →]      │  ← slim topbar, single action link
├─────────────────────────────────────────┤
│                                         │
│  ICT Students' Circle · Mentor Session  │  ← kicker badge
│                                         │
│  Find your senior mentor.               │  ← h1
│                                         │
│  Submit your preferences now and get    │
│  matched with an experienced senior.    │  ← 1-sentence sub
│                                         │
│  [ Register as Mentee  / Select Prefs ] │  ← single dynamic CTA button
│  View mentor profiles →                 │  ← subtle secondary link
│                                         │
├─────────────────────────────────────────┤
│  Session Progress                       │  ← LifecycleStepper card
│  ✓ Create Session                       │
│  ✓ Configure Batches                    │
│  ✓ Open Registration                    │
│  ● Collect Preferences  ← current       │
│  ○ FCFS Allocation                      │
│  ○ ...                                  │
├─────────────────────────────────────────┤
│  ICT Students' Circle · Fac. of Tech    │  ← inline footer text
└─────────────────────────────────────────┘
```

---

## Files to Create / Modify

| File | Action | Change summary |
|---|---|---|
| `components/nav/HomeNav.tsx` | **Replace** | New `MenteeCTALink` component — single smart link using `getMenteeId()` |
| `components/screens/HomeScreen.tsx` | **Rewrite** | Remove `HeroStats`, HOW_CARDS grid, second CTA; trim copy; reorder lifecycle card |
| `app/page.tsx` | **Minimal edit** | Swap `HomeNav` → `MenteeCTALink` in header; remove `SiteFooter` |
| `components/nav/HomeNav.tsx` | Optional: rename file to `MenteeCTALink.tsx` | Keep HomeNav name for now or rename to avoid confusion |

No new dependencies. No layout.tsx changes needed — `app/layout.tsx` stays as-is.

---

## Out of Scope (do not change in this pass)

- `/mentee/*` pages and `MenteeNav` — already well-structured
- `/admin/*` routes — still reachable by direct URL, just not linked from the front page
- `/mentor` profile browser — still reachable via the subtle secondary link
- Global CSS / design tokens — no visual style changes, only structural

---

## Implementation Order

1. Create `MenteeCTALink` (header action link with session awareness)
2. Rewrite `HomeScreen` (remove noise, reorder, trim copy)
3. Update `app/page.tsx` to wire them together
4. Smoke-test both states: no session (new mentee) and existing session (returning mentee)
