# Mentor Session

A Next.js application backed by Supabase for mentor/mentee registration, ordered mentor preferences, FCFS allocation and feedback.

## Supabase setup

1. Create a Supabase project.
2. In its SQL Editor, run [database/schema.sql](database/schema.sql).
3. Optional: run [database/mock-data.sql](database/mock-data.sql) to populate the app with approved mentors, mentees, preferences, allocations and feedback. Use [database/remove-mock-data.sql](database/remove-mock-data.sql) to remove only those records.
4. Copy [.env.example](.env.example) to `.env.local` and fill in the three values. Keep the service-role key server-only.
5. Start the app with `npm run dev`.

The first schema run creates an open **Mentor Session 2026**. Mentors initially have `pending` status; approve one through the Supabase Table Editor or the protected endpoint below before it appears in mentee choices.

## Backend API

- `GET /api/health` checks the configured Supabase connection and current session.
- `GET /api/mentors` returns approved mentors and live allocation capacity.
- `POST /api/registrations/mentee` and `POST /api/registrations/mentor` save validated registrations.
- `GET|POST /api/preferences` loads or locks a mentee's ordered three preferences.
- `POST /api/feedback` saves one feedback record per participant/session.
- `PATCH /api/admin/mentors/:id` approves or rejects a mentor.
- `POST /api/admin/allocations` previews or commits FCFS allocation, and `DELETE /api/admin/allocations` resets it. Send `x-admin-key: <ADMIN_API_KEY>` with `{ "mode": "preview" | "commit", "includeFallback": boolean }`.

Admin endpoints are protected by `ADMIN_API_KEY` until Supabase Auth/admin roles are added. Do not send that key to browser code.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
