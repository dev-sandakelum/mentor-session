# UI / UX Reference — ICTSC Mentor Session

> Covers every route, what renders on it, which components are used, and how the user interacts with it.

---

## Global Shell

Every page is wrapped by `app/layout.tsx` (root layout):

- Applies the **Inter** typeface globally
- Mounts `ToastProvider` — a single auto-dismiss notification bar (2.8 s) that any screen can trigger via `useToast()`
- The `<footer>` is rendered inside each route-group layout, not the root

The topbar on every page is `SiteHeader` → holds `Brand` (logo + site name linking back to `/`) and a nav slot filled by the layout of the active route group.

---

## Routes

### `/` — Home

| Layer | Component |
|---|---|
| Layout | `app/page.tsx` (inline — no route-group layout) |
| Nav | `SiteHeader` + `HomeNav` |
| Screen | `HomeScreen` |
| UI pieces | `LifecycleStepper` |

**HomeNav** links: Home · Mentee · Mentors · Admin (admin link has a distinct visual style)

**HomeScreen** is a marketing / orientation page with three sections:

1. **Hero** — headline, one-paragraph description of the programme, two CTA buttons:
   - *Browse Mentors* → `/mentor`
   - *Register as Mentee* → `/mentee`

2. **How it works** — four numbered cards explaining the FCFS rules (pick 3, submission order, 2-mentee cap, random fallback)

3. **Mentor Session Lifecycle** — `LifecycleStepper` showing 8 ordered steps (Create Session → Configure Batches → Open Registration → **Collect Preferences** ← current → FCFS Allocation → Random Fallback → Publish Results → Session & Feedback). Steps render as `done ✓ / current (highlighted) / pending (dimmed)` with arrows between them.

No data fetching. Fully static.

---

### `/mentor` — Senior Mentor Directory

| Layer | Component |
|---|---|
| Layout | `app/mentor/layout.tsx` |
| Nav | `SiteHeader` + `MentorNav` |
| Screen | `MentorGridScreen` |

**MentorNav** has a single link: *Mentor Directory*

**MentorGridScreen** — public, read-only browse page:

- Fetches `GET /api/mentors` on mount
- Renders a responsive CSS grid of mentor cards
- Each card (`mentor-card` class, not the interactive `MentorCard` component) shows:
  - **Photo area** — real photo or a gradient-avatar (initials, colour cycles through 6 gradients per index)
  - **Index badge** — 1-based number overlay on the photo corner
  - **"Full" overlay** — semi-transparent badge if `allocatedCount >= capacity`
  - **Info area** — name + batch
- No click/selection — `cursor: default`
- A `form-note` banner above the grid links unregistered visitors to `/mentee`
- Loading / empty states handled with `<p className="muted">` messages

---

### `/mentee` — Mentee Registration

| Layer | Component |
|---|---|
| Layout | `app/mentee/layout.tsx` |
| Nav | `SiteHeader` + `MenteeNav` |
| Screen | `MenteeRegScreen` |

**MenteeNav** tab strip: *Mentee Registration* · *Preference Selection* · *Mentee Dashboard* (highlights active route)

**MenteeRegScreen** — step-1 onboarding form:

- Info banner explaining the FCFS rule and 2-mentee cap
- **Form fields** (inside a `form-grid` card):
  | Field | Input type | Notes |
  |---|---|---|
  | Full Name | text | required |
  | Student ID | text | required |
  | Phone Number | tel | required; hint text below |
- Submit → `POST /api/registrations/mentee` → on success stores `mentee-session-mentee-id` in `localStorage`, shows toast, and pushes to `/mentee/prefs`
- *Cancel* button navigates back to `/`
- Button label changes to "Submitting…" while the request is in flight

---

### `/mentee/prefs` — Preference Selection

| Layer | Component |
|---|---|
| Layout | `app/mentee/layout.tsx` (inherited) |
| Nav | `SiteHeader` + `MenteeNav` |
| Screen | `PrefsScreen` |
| UI pieces | `MentorCard`, `ToastProvider` (useToast) |

This is the **core user interaction** for mentees.

**Layout** — two-column (`pref-layout`):
- Left: `mentor-grid` (scrollable card list)
- Right: `pref-summary` sticky sidebar

**Left — MentorCard grid:**

Fetches `GET /api/mentors` on mount. Each `MentorCard` is an interactive button-like card:

- **Photo area** — real photo or gradient-avatar with initials; index number badge always visible
- **Priority badge** — appears when selected: `★ 1st` (amber) / `2nd` (indigo) / `3rd` (gray)
- **"Full" overlay** — shown when `allocatedCount >= capacity`; card becomes non-clickable
- **Accent bar** — coloured bottom strip matching priority colour when selected
- Click or `Enter / Space` toggles selection (up to 3 picks)
- Clicking a full card shows a toast "This mentor is full…"
- Clicking a 4th mentor shows a toast "You already picked 3 mentors…"
- `aria-pressed` and `aria-disabled` for accessibility

**Right — Preference sidebar:**

Three labelled slots: `⭐ 1st Priority` / `2nd Priority` / `3rd Priority`

- Each slot shows the picked mentor name or "Not selected yet"
- Each filled slot has a `✕ remove` button (removes from picks, deselects the card)
- `Confirm & Submit` button disabled until exactly 3 mentors are picked; shows "Submitting…" in flight
- `Clear all` button resets all picks
- On submit → `POST /api/preferences` with `{ menteeId, mentorIds }`

**Post-submit confirmation state** (replaces the whole screen):

- Green `✓` checkmark
- "Preferences Submitted ✓" heading
- Submission timestamp
- Locked preferences list (1st / 2nd / 3rd with mentor names)
- Text explaining FCFS processing

---

### `/mentee/dashboard` — Mentee Dashboard

| Layer | Component |
|---|---|
| Layout | `app/mentee/layout.tsx` (inherited) |
| Nav | `SiteHeader` + `MenteeNav` |
| Screen | `MenteeDashScreen` |
| UI pieces | `Pill`, `StarRating`, `ToastProvider` |

Reads `mentee-session-mentee-id` from `localStorage`. If missing, shows a prompt to register first.

Fetches `GET /api/dashboard/mentee?menteeId=...`

**If allocation is pending:** single card "Allocation pending" with explanation.

**If allocation is published** (`dash-grid` two-column layout):

Left column:
- **Assign hero card** — mentor name large, batch + interests, assignment method pill ("1st Choice" / "2nd Choice" / "3rd Choice" / "Fallback")
- **Mentor Contact card** — Email row, preferred communication method + phone
- **Mentor Group card** — other mentees sharing the same mentor; each shown with initials avatar, name, batch, interests, and a "Other mentee" `Pill`

Right column:
- **Session Details card** — event date/time and venue (or "To be announced")
- **Session Feedback card** — `StarRating` (5-star, accessible fieldset), comments textarea, "Submit Feedback" button → `POST /api/feedback`

---

### `/admin` — Admin Dashboard

| Layer | Component |
|---|---|
| Layout | `app/admin/layout.tsx` |
| Nav | `SiteHeader` + `AdminNav` |
| Screen | `AdminScreen` |
| UI pieces | `Pill`, `MentorFormModal`, `ResetModal`, `MultiSelect`, `ToastProvider` |

**AdminNav** has a single link styled as an admin tab.

The entire screen is gated behind a session cookie. Two states:

**Not authenticated** — login card with:
- Email + password inputs
- `Sign in` button → `POST /api/admin/login`
- `Use existing session` button → attempts to load data with the current cookie (for page refreshes)

**Authenticated** — shows a "Refresh data" + "Sign out" row, then the full 5-tab panel.

---

#### Tab: Overview

- **Stats grid** (12 `StatCard` tiles, colour-coded):
  - Indigo: Total mentors, Total mentees
  - Green: Assigned, Preference satisfaction %
  - Amber: 1st choice count
  - Default: Total capacity, Unassigned, Available capacity, 2nd/3rd choice, Fallback, Manual
- **Session Details card** — title, date/time, venue, status `Pill`
- **Mentor Load card** — one row per mentor: name, animated fill bar (assigned / capacity ratio), count label

#### Tab: Mentors

- Scrollable table: Mentor name + student ID · Contact (email/phone/comm method) · Batch · Interests (comma list) · Capacity · Edit/Delete buttons
- `+ Add mentor` button (top-right) → opens `MentorFormModal` in create mode
- Edit button → opens `MentorFormModal` pre-filled
- Delete button → opens `ResetModal` with "Delete mentor?" copy → `DELETE /api/admin/mentors/:id`
- `Pill` counter shows total mentor count

#### Tab: Mentees

- Scrollable table: Mentee name + ID · Contact · Batch · Interests + guidance needed · Preference status (`Pill` green=submitted / amber=pending) · Assigned mentor + method `Pill`
- Read-only, no actions

#### Tab: Allocation

Three cards:

1. **Allocation Controls** — four action buttons:
   - `Preview FCFS` — dry-run, shows toast with counts, does not save
   - `Commit FCFS` — saves allocation, reloads data
   - `Commit with Fallback` — FCFS + fills remaining capacity randomly
   - `Reset Allocation` (red) → opens `ResetModal`

2. **Allocation Results** table — Student · Submitted time · Mentor · Method `Pill` (1st/2nd/3rd/Fallback/Manual)

3. **Unmatched Pool** table — Student · Preferences (arrow-separated list)

#### Tab: Logs

- Chronological audit table: Timestamp · Action (bold) · Detail
- Read-only

---

## Modals

### `MentorFormModal` (Add / Edit Mentor)

Triggered from the Mentors tab. Full-screen backdrop with a centred 640px card.

Fields (`form-grid` two-column layout):

| Field | Type | Notes |
|---|---|---|
| Full Name | text | required |
| Student ID | text | required |
| University Email | email | required |
| Contact Number | tel | required |
| Batch | select | 11th / 12th / 13th |
| Communication | select | WhatsApp / Email / Phone Call / In-Person |
| Capacity | number | 1–10 |
| Academic Interests | `MultiSelect` | 9 predefined options |
| Technical Interests | `MultiSelect` | 10 predefined options |
| Profile Photo | file upload | preview thumbnail, Remove button |

- Edit mode pre-fills all fields from the existing record
- Photo: upload replaces, Remove deletes via `DELETE /api/admin/mentors/:id/avatar`
- `Save changes` / `Add mentor` → `PATCH` or `POST` to `/api/admin/mentors`
- Error shown inline in red above the action buttons
- Backdrop click closes; `Cancel` button closes

### `ResetModal` (Destructive Confirm)

Re-used for both "Reset Allocation" and "Delete mentor?" actions.

- Warning triangle SVG icon
- Configurable title, body copy, confirm button label
- Default: "Reset Allocation?" with permanent-delete copy
- Two buttons: `Cancel` (ghost) · confirm action (red)
- Backdrop click outside the card closes the modal

---

## Shared UI Components Summary

| Component | File | What it does |
|---|---|---|
| `Brand` | `nav/Brand.tsx` | Logo (`SC` block) + site name + subtitle, links to `/` |
| `SiteHeader` | `nav/SiteHeader.tsx` | Sticky `topbar`: Brand left + nav slot right |
| `HomeNav` | `nav/HomeNav.tsx` | 4-link main nav; admin link styled separately |
| `MenteeNav` | `nav/MenteeNav.tsx` | 3-tab strip for mentee flow |
| `MentorNav` | `nav/MentorNav.tsx` | Single "Mentor Directory" link |
| `AdminNav` | `nav/AdminNav.tsx` | Single "Admin Dashboard" link with admin styling |
| `ToastProvider` | `ToastProvider.tsx` | Context + `aria-live` toast bar, auto-hides after 2.8 s |
| `MentorCard` | `ui/MentorCard.tsx` | Interactive selectable card with gradient avatar, priority badge, full overlay |
| `Pill` | `ui/Pill.tsx` | Inline status badge — variants: green / indigo / amber / gray / red; optional dot |
| `StarRating` | `ui/StarRating.tsx` | Accessible 5-star button group (`fieldset/legend`), controlled or uncontrolled |
| `MultiSelect` | `ui/MultiSelect.tsx` | Chip-style multi-select with dropdown, keyboard nav, outside-click close |
| `LifecycleStepper` | `ui/LifecycleStepper.tsx` | Horizontal step list with `done ✓ / current / pending` states and `→` separators |
| `ResetModal` | `ui/ResetModal.tsx` | Generic destructive-action confirm dialog (backdrop + modal card) |
| `MentorFormModal` | `admin/MentorFormModal.tsx` | Full add/edit mentor form in a modal |

---

## User Flow Summary

```
/ (Home)
 ├── /mentor          Browse mentor cards (read-only)
 └── /mentee          Register (Full Name, ID, Phone)
      └── /mentee/prefs     Pick 3 mentors → submit → locked confirmation
           └── /mentee/dashboard  View assignment + contact + group + submit feedback

/admin               Sign in → 5-tab dashboard
                      ├── Overview  (stats + mentor load)
                      ├── Mentors   (CRUD + photo upload)
                      ├── Mentees   (read-only table)
                      ├── Allocation (run/reset FCFS + results)
                      └── Logs      (audit trail)
```
