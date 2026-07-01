# Shop Dashboard

A CSV-driven dashboard for coffee shop managers to track weekly net sales, labor hours vs. a target, and task completion.

## Getting started locally

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`.

1. Push this project to a GitHub repo.
2. In the repo, go to **Settings → Pages** and set **Source** to "GitHub Actions".
3. Push to `main` — the site will build and publish to `https://<your-username>.github.io/<repo-name>/`.

Manual alternative: `npm run deploy` (uses `gh-pages` to push `dist/` to a `gh-pages` branch) if you'd rather not use the Action — just point Pages at that branch instead.

## How manager logins map to shops

There's no per-file "which shop is this" picker. Instead, each manager has their own login, and everything they upload that session is tagged as their shop automatically. This is configured in `src/lib/shops.js`:

```js
midtown: {
  username: 'midtown_manager',
  password: 'CHANGE-ME-midtown',
  laborCode: 'MID',
  laborTargetHours: 130,
}
```

- `laborCode` — the bracket-prefix your labor export uses for this shop's roles (e.g. `[EAS]Barista` → `EAS`). It's only used to warn a manager if they accidentally upload another shop's file — it does **not** determine which shop the data is filed under.
- `laborTargetHours` — the hardcoded weekly labor-hour target for this shop. Labor deviation = `(actual timesheet hours - target) / target`.

**Add/edit shops by editing this file.** Currently configured: Midtown, Downtown, Uptown, Eastside — update the roster, codes, and targets to match your real shops, and replace every placeholder password.

## How CSV parsing works now

Rewritten to match your actual exports (see `src/lib/csv.js`), not a generic flat-table guess:

| File | Real format | What's extracted |
|---|---|---|
| Sales Summary | Square weekly export — metric-name/value pairs, not a row-per-record table | `Net sales` (used on the dashboard), plus gross sales, discounts, taxes, tips, transaction count for reference |
| Schedule vs. Timesheet vs. Sales | Hierarchical — role-header rows, one row per employee, per-role subtotal rows, ending in a `Grand Total` row | `Timesheet Hour` from the Grand Total row, compared against that shop's hardcoded `laborTargetHours` |
| Task Submissions | Flat table with a real `Location` column | Average `% Completed` across all submissions, and a count of submissions under 90% |

The `Flags` column in task submissions is intentionally ignored — you noted it's unused.

**Mismatch warnings:** if a manager uploads a labor file whose bracket code doesn't match their shop's `laborCode`, or a task-submissions file whose `Location` column doesn't match their shop's name, the upload still succeeds but shows a yellow warning banner so they can double check they grabbed the right file.

## About the login screen

The login is a **UI convenience, not real security**. Because this is a static site (no server), the whole app — including every password in `src/lib/shops.js` — ships to the browser as plain JavaScript. Anyone who opens dev tools can read the credentials or bypass the check entirely. Fine for keeping the dashboard off casual view, not fine for protecting anything sensitive.

If you need real access control on GitHub Pages, options include:
- A managed auth provider (Firebase Auth, Auth0, Clerk) issuing real tokens
- GitHub's private-repo Pages (requires GitHub Enterprise or a paid plan)
- Moving off static hosting to something with a real backend (Vercel/Netlify functions, a small server)

## Data storage

Uploaded CSVs are parsed in the browser; the computed results are cached in `localStorage`, keyed per shop, so a manager's dashboard remembers last week's numbers on reload. Nothing is uploaded anywhere or synced across devices/browsers — if you want managers or corporate to see the same numbers from different devices, that needs a real backend (e.g. Firebase Firestore).
