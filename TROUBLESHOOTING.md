# Platform troubleshooting

If the platform seems down or won’t load, use these steps.

## 1. Start the dev server

From the project root:

```bash
npm run dev
```

Wait until you see something like: **Ready on http://localhost:3000**. Then open http://localhost:3000 in your browser.

- If the terminal shows a **compile or runtime error**, fix that first (see step 3).
- If the server exits right away, check Node/npm: `node -v` (v18+), `npm -v`.

## 2. Required environment variables

Create `.env.local` in the project root (copy from `.env.example` if you have it) and set at least:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without these, the app may redirect, show a blank page, or fail when loading dashboard data.

Optional but useful:

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – for payments (if missing, Stripe Connect will show a clear error).
- `GEMINI_API_KEY` – for Clara voice assistant and AI features.

After changing `.env.local`, restart the dev server (`Ctrl+C`, then `npm run dev` again).

## 3. Check the terminal and browser

- **Terminal:** Note any red error messages when you load a page or click something (e.g. missing env, failed API call).
- **Browser:** Open DevTools (F12 or right‑click → Inspect) and check:
  - **Console** – JavaScript errors (red).
  - **Network** – failed requests (red, status 4xx/5xx). Click a failed request to see the response.

If you see “Something went wrong” in the UI, the dashboard ErrorBoundary caught an error; the exact message is shown on the card. Use **Try Again** or **Reload Page**, and check the console for the full error.

## 4. Common issues

| Symptom | What to do |
|--------|------------|
| Blank page on `/` or `/login` | Ensure `NEXT_PUBLIC_SUPABASE_*` are set and the dev server was restarted. Check browser console for errors. |
| Blank or error only on `/dashboard` | Same as above; dashboard needs Supabase. Check Network tab for failed requests to Supabase or your API routes. |
| “Stripe is not configured” on Payments | Add `STRIPE_SECRET_KEY` (and optionally `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) to `.env.local` if you use payments. |
| Build fails with “binding to a port” / “Operation not permitted” | Run `npm run build` (and `npm run dev`) outside any sandbox/restricted environment so Next.js can use the network/port. |
| 500 on `/api/*` | Check the terminal where `npm run dev` is running for the stack trace. Often due to a missing env var (e.g. Stripe, Supabase service role) or a bug in that API route. |

## 5. Production build (optional)

To confirm the app builds successfully on your machine:

```bash
npm run build
npm run start
```

Then open http://localhost:3000. If `npm run build` fails, the first error in the output usually points to the cause (e.g. TypeScript, missing module, or env in build).
