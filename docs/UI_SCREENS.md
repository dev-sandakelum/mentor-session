# ICTSC Mentor Session — UI Screen Data Reference

This reference describes every currently routed UI screen in the Mentor Session application, including its visible content, data fields, actions, and empty or alternate states. Dynamic values are supplied by the application's API and Supabase data; they are not hard-coded screen content.

## Shared shell

Every routed screen has the **ICTSC Mentor Session** brand, with the subtitle `Faculty of Technology · University of Ruhuna`, linked to `/`. Each screen also has this footer:

> ICT Students' Circle · Faculty of Technology · University of Ruhuna — Mentor Session Management System (UI Prototype)

| Route area | Navigation items |
| --- | --- |
| Home | Home, Mentee, Mentors, Admin |
| Mentee | Mentee Registration, Preference Selection, Mentee Dashboard |
| Mentor | Mentor Directory |
| Admin | Admin Dashboard |

## Screen map

| Route | Screen | Main data source |
| --- | --- | --- |
| `/` | Home | Static session guidance |
| `/mentor` | Senior Mentor Directory | `GET /api/mentors` |
| `/mentee` | Mentee Registration | `POST /api/registrations/mentee` |
| `/mentee/prefs` | Preference Selection | `GET /api/mentors`, `POST /api/preferences` |
| `/mentee/dashboard` | Mentee Dashboard | `GET /api/dashboard/mentee`, `POST /api/feedback` |
| `/admin` | Admin Dashboard | Admin API endpoints |

## 1. Home (`/`)

### Content

- Kicker: `ICT Students' Circle · Mentor Session 2026`
- Heading: `Find your senior mentor. Grow together.`
- Introductory copy explaining that juniors are connected with experienced seniors for academic guidance, study advice, technical direction, and university experience.
- Primary actions:
  - **Browse Mentors** → `/mentor`
  - **Register as Mentee** → `/mentee`

### How it works cards

| # | Title | Description |
| --- | --- | --- |
| 1 | Pick 3 Ranked Mentors | A mentee chooses first, second, and third mentor priorities from the approved pool. |
| 2 | First Come, First Served | Preferences are evaluated by server-side submission time. |
| 3 | Max 2 Mentees / Mentor | The explanatory default capacity stated to users. Actual mentor capacity is data-driven. |
| 4 | Random Fallback | A mentor with remaining capacity is assigned if all three selections are full. |

### Lifecycle stepper

| Step | Display status |
| --- | --- |
| Create Session | Done |
| Configure Batches | Done |
| Open Registration | Done |
| Collect Preferences | Current |
| FCFS Allocation | Pending |
| Random Fallback | Pending |
| Publish Results | Pending |
| Session & Feedback | Pending |

## 2. Senior Mentor Directory (`/mentor`)

### Purpose and controls

- Title: `Senior Mentor Directory`
- Describes the approved pool available for mentee selections.
- Information note links **Register as a mentee** to `/mentee`.
- Mentor records are display-only here; administrators manage their profiles.

### Mentor card data

| Field | UI treatment |
| --- | --- |
| `profilePhotoUrl` | Profile image, if available; otherwise a coloured two-letter initials avatar. |
| `fullName` | Card heading. |
| `batch` | Displayed below the name; `—` when absent. |
| `academicInterests` + `technicalInterests` | Deduplicated tags; first four tags displayed. |
| `allocatedCount` / `capacity` | Capacity bar and text such as `1/2`; `Full` is appended when capacity is reached. |

### States

- Loading: `Loading mentors…`
- Empty: `No approved mentors are listed yet. Check back soon.`
- Full mentor: visually marked as full; no selection action is available on this directory screen.

## 3. Mentee Registration (`/mentee`)

### Status and guidance

- Title: `Mentee Registration`
- Session line: `Mentor Session 2026 · Junior Batch (10th) · Registration is Open`
- Note: choosing three mentors happens after registration; selections are FCFS and capacity-limited.

### Form data

| Field | Required | Input / allowed values |
| --- | --- | --- |
| Full Name | Yes | Text |
| Student ID | Yes | Text |
| University Email | Yes | Email |
| Contact Number | Yes | Telephone |
| Batch | Yes | Select; currently `10th Batch` |
| Academic Interests | No | Multi-select; see shared interest catalogue below |
| Technical Interests | No | Multi-select; see shared interest catalogue below |
| Areas Where Guidance Is Required | No | Free-text textarea |

### Actions and result

- **Cancel** returns to `/`.
- **Register & Choose Mentors** creates the mentee record, saves its ID in browser local storage under `mentor-session-mentee-id`, and navigates to `/mentee/prefs`.
- Success toast: `Registration submitted! You can now select your mentor preferences.`

## 4. Preference Selection (`/mentee/prefs`)

### Main content

- Title: `Choose your top 3 mentors`
- Introductory copy explains submission order and mentor capacity.
- Uses the same mentor-card fields as the public directory.
- A selectable mentor card receives a priority badge: `★1`, `2`, or `3`.

### Preference summary

| Slot | Empty value | Filled behavior |
| --- | --- | --- |
| 1st Priority | Not selected yet | Shows mentor name and a remove control. |
| 2nd Priority | Not selected yet | Shows mentor name and a remove control. |
| 3rd Priority | Not selected yet | Shows mentor name and a remove control. |

The summary tells the mentee that three distinct mentors are required and choices become locked after submission.

### Actions and validation

- **Confirm & Submit** is enabled only after three selections. It submits the ordered mentor IDs with the locally stored mentee ID.
- **Clear all** removes the current, unsubmitted selections.
- A full mentor cannot be selected.
- Attempting a fourth mentor displays a toast.
- Submission is rejected when the user is not registered, selections are not exactly three distinct mentors, or preferences were previously locked.

### Submitted state

After a successful submission, the screen switches to a confirmation view:

- Heading: `Preferences Submitted ✓`
- Shows the server-recorded submission timestamp.
- States that preferences are locked and allocation will use FCFS.
- Shows the three locked mentor names in priority order.

### Loading and empty states

- `Loading available mentors…`
- `No approved mentors are available yet.`

## 5. Mentee Dashboard (`/mentee/dashboard`)

### Access states

- Loading: `Loading your dashboard…`
- No saved mentee ID or unavailable record: title `Mentee Dashboard` and message `Register as a mentee first to view your dashboard.`
- Registered but not allocated: `Allocation pending`, with an explanation that the mentor appears after publication.

### Allocated dashboard data

| Section | Visible data |
| --- | --- |
| Welcome | First name of the current mentee; session title and upper-case session status. |
| Your Mentor | Mentor name, batch, merged academic and technical interests, and assignment method (1st/2nd/3rd choice or Fallback). |
| Mentor Contact | Mentor email and preferred communication method with phone number. |
| Your Mentor Group | Other mentees assigned to the same mentor: initials avatar, full name, batch, and merged interests. |
| Session Details | Event date/time and venue; shows `To be announced` for missing values. |
| Session Feedback | 1–5 star rating and optional comments/suggestions. |

### Feedback action

**Submit Feedback** requires a star rating. It sends the mentee ID, rating, and comment to the feedback endpoint. A successful submission shows `Thank you! Feedback submitted ✓`.

## 6. Admin Dashboard (`/admin`)

### Unauthenticated view

- Page title uses `Mentor Session — Admin` until live session data is loaded.
- Session line says `Load live data to view session details` until the admin signs in.
- Administrator access form:
  - Email
  - Password
  - **Sign in**
  - **Use existing session**
- Below the form: `Sign in to view current registrations and allocations.`

### Authenticated overview

The heading displays the live session title, status, date/time, and venue. It includes **Refresh data** and **Sign out** controls.

#### Statistic cards

| Stat | Meaning |
| --- | --- |
| Mentors / approved | All mentor profiles and approved subset. |
| Mentees / preferences submitted | Registrations and submitted preference count. |
| Total capacity | Capacity of approved mentors. |
| Assigned / Unassigned | Saved assignments and preference-submitted mentees without assignments. |
| Available capacity | Remaining approved-mentor capacity. |
| 1st, 2nd, 3rd choice | Assignments matched at each priority. |
| Fallback | Assignments generated through fallback. |
| Manual assignment | Manually assigned records. |
| Preference satisfaction | Percentage of assignments made by a listed preference. |

#### Operational panels

| Panel | Fields / content |
| --- | --- |
| Allocation Preview | Student, submitted time, mentor, assignment method. |
| Unmatched Pool | Student and ranked preference names. |
| Mentor Load | Mentor name, assigned/capacity count, capacity bar. |
| Allocation Log | Timestamp, action, and optional detail; up to eight recent entries. |

#### All Mentors table

| Column | Visible data / controls |
| --- | --- |
| Mentor | Name and student ID |
| Contact | Email, phone, preferred communication method |
| Batch | Mentor batch |
| Interests | Combined academic and technical interests |
| Capacity | Numeric capacity |
| Approval | Pending / approved / rejected status and appropriate Approve, Reject, or Reset controls |
| Actions | **Edit** and **Delete** |

**+ Add mentor** opens the mentor form described below. Approved mentor records appear in the public directory; pending and rejected profiles do not.

#### All Mentees table

| Column | Visible data |
| --- | --- |
| Mentee | Name and student ID |
| Contact | Email and phone |
| Batch | Mentee batch |
| Interests & guidance | Combined interests and optional guidance request |
| Preferences | Submitted or Pending status |
| Assigned mentor | Mentor name plus assignment method/priority, or Unassigned |

#### Allocation controls

- **Preview FCFS** calculates a first-come, first-served result without saving it.
- **Commit FCFS** saves the FCFS allocation.
- **Commit with Fallback** saves an FCFS allocation and assigns unmatched mentees where capacity remains.
- **Reset Allocation** opens a confirmation dialog and permanently removes current assignments while retaining registrations and preference timestamps.

## 7. Admin dialogs

### Add / Edit Mentor dialog

| Field | Required | Values / behavior |
| --- | --- | --- |
| Full Name | Yes | Text |
| Student ID | Yes | Text |
| University Email | Yes | Email |
| Contact Number | Yes | Telephone |
| Batch | Yes | 11th, 12th, or 13th Batch |
| Communication | Yes | WhatsApp, Email, Phone Call, or In-Person |
| Capacity | Yes | Number from 1 to 10; default 2 |
| Approval Status | No | Approved, Pending, or Rejected; default Approved for a new mentor |
| Academic Interests | No | Multi-select |
| Technical Interests | No | Multi-select |
| Profile Photo | No | JPEG, PNG, WebP, or GIF upload; preview and remove controls |

Actions: **Cancel**, **Add mentor** for new records, or **Save changes** for edits. The dialog shows an error message if saving or photo upload fails.

### Reset allocation confirmation

- Title: `Reset Allocation?`
- Explains that FCFS, fallback, and manual assignment records are permanently removed, while registration data and FCFS timestamps are retained.
- Actions: **Cancel** and **Yes, Reset Allocation**.

### Delete mentor confirmation

- Title: `Delete mentor?`
- Explains that the mentor profile is permanently removed and mentors with assignments cannot be deleted.
- Actions: **Cancel** and **Delete mentor**.

## Shared interest catalogue

The registration and mentor-management forms use these multi-select options.

| Academic interests | Technical interests |
| --- | --- |
| Programming & Algorithms | Web Development |
| Databases | Mobile Development |
| Networking | AI / Machine Learning |
| Software Engineering | Cyber Security |
| Data Science | Cloud Computing |
| Mathematics | DevOps |
| Computer Architecture | UI / UX Design |
| Operating Systems | Embedded Systems / IoT |
| Research Methods | Game Development |
|  | Open Source |

## Dynamic UI data model

| UI object | Fields presented to the UI |
| --- | --- |
| Session | `title`, `status`, `event_starts_at`, `venue` |
| Mentor directory card | `id`, `fullName`, `batch`, `academicInterests`, `technicalInterests`, `profilePhotoUrl`, `capacity`, `allocatedCount` |
| Mentee | `id`, `full_name`, `student_id`, `email`, `phone`, `batch`, `academic_interests`, `technical_interests`, `guidance_needed`, `preference_submitted_at` |
| Preference | `menteeId`, ordered `mentorIds`, server `submittedAt` |
| Allocation | Mentee, mentor, method (`preference`, `fallback`, or `manual`), and optional matched priority (1–3) |
| Feedback | Participant type, participant ID, integer rating (1–5), optional comment |

## Notes for content updates

- The homepage lifecycle and explanatory copy are static UI content.
- Session title, status, event time, venue, mentor capacity, mentor availability, registrations, allocations, and dashboard data are live records.
- The public mentor APIs return approved mentors only.
- The currently active session is configured in the database; the seeded 2026 session uses the title `Mentor Session 2026`, status `registration`, and venue `Main Auditorium, Faculty of Technology`.
