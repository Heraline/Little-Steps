# 👣 Little Steps — Habit Tracker

A simple, elderly-friendly habit tracker you can share with family and friends. Big buttons,
few steps, bilingual (中文 / English), and everyone can see their own progress — plus
optionally each other's, once they add each other as friends.

- **Home** — big tiles, one tap marks a habit done for today.
- **Analysis** — every habit's progress by Week / Month / Year / Calendar.
- **Friends** — add family/friends by username to view (read-only) how they're doing.
- **Profile** — switch language and text size, sign out.

No app-store install needed — it runs in any web browser, and works well on a phone home
screen too.

---

## How it works (the short version)

This app is a static website (built with React) that talks directly to a free **Firebase**
project, which is where everyone's accounts and habit data are stored securely. You will:

1. Create a free Firebase project (a few minutes) — this gives you Authentication + a
   Firestore database.
2. Put this code on GitHub.
3. Let GitHub build and host the website for free, using **GitHub Pages**.
4. Share the website link with family/friends. Each person creates their own account
   (just an email + password) directly in the app.

You never need to touch a terminal after the first setup — GitHub does the building for you
automatically every time you update the code.

---

## Step 1 — Create your Firebase project (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with
   a Google account.
2. Click **Add project**, give it a name (e.g. "little-steps"), and finish the setup wizard
   (you can leave Google Analytics off — it isn't needed).
3. In the left sidebar, go to **Build → Authentication → Get started**. Under **Sign-in
   method**, enable **Email/Password**.
4. In the left sidebar, go to **Build → Firestore Database → Create database**. Choose
   **Start in production mode** (we'll add the correct security rules ourselves in Step 2)
   and pick a location close to you.
5. Once the database is created, open the **Rules** tab and replace the contents with the
   file [`firebase/firestore.rules`](./firebase/firestore.rules) from this repo (copy the
   whole file, paste it in, click **Publish**). This is what keeps everyone's data private
   except with friends who've accepted a request.
6. Still in Firestore, open the **Indexes** tab → **Composite** and add the three indexes
   listed in [`firebase/firestore.indexes.json`](./firebase/firestore.indexes.json) (collection
   name, fields, and order). If you skip this, the app will still work, but the very first
   time each type of query runs, the browser's developer console will show an error with a
   direct link that creates the missing index for you in one click — either approach works.
7. In the left sidebar, go to **Build → Storage → Get started**, and accept the default
   settings. This is needed for the "upload your own habit icon" feature — habit icons that
   aren't one of the built-in emoji get uploaded here.
8. Open Storage's **Rules** tab and replace the contents with the file
   [`firebase/storage.rules`](./firebase/storage.rules) from this repo, then **Publish**.
   This keeps uploads limited to small images (under 2MB) and to the signed-in user's own
   folder.
9. Now register a **web app**: click the gear icon next to "Project Overview" → **Project
   settings** → scroll to **Your apps** → click the **</>** (web) icon → give it a nickname →
   **Register app**. Firebase will show you a `firebaseConfig` object — keep this tab open,
   you'll need those values in Step 3.
10. Go to **Authentication → Settings → Authorized domains** and add
   `yourusername.github.io` (once you know your GitHub Pages URL from Step 4, come back and
   add the exact domain — Firebase Auth only works from domains on this list).

---

## Step 2 — Put the code on GitHub

If you downloaded this project as a folder:

1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g.
   `habit-tracker`). Keep it **Public** (required for free GitHub Pages) or **Private**
   with GitHub Pages enabled on a paid plan.
2. Follow GitHub's instructions on that page under "…or push an existing repository from
   the command line", using the folder you downloaded. If you're not comfortable with the
   command line, you can also use **GitHub Desktop** (a free app) — open the folder there,
   and click "Publish repository".

---

## Step 3 — Add your Firebase keys as GitHub Secrets

Your Firebase config values are safe to expose in a deployed site (Firebase's security comes
from the Firestore rules, not from hiding these keys) — but we still keep them out of the
repo itself, as good practice and so you can change them without editing code.

In your GitHub repository, go to **Settings → Secrets and variables → Actions**, and add
each of these as a **New repository secret**, using the matching value from the
`firebaseConfig` object in Step 1.7:

| Secret name                         | From `firebaseConfig` key |
| ------------------------------------ | -------------------------- |
| `VITE_FIREBASE_API_KEY`             | `apiKey`                   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `authDomain`                |
| `VITE_FIREBASE_PROJECT_ID`          | `projectId`                 |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `storageBucket`             |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId`         |
| `VITE_FIREBASE_APP_ID`              | `appId`                     |

---

## Step 4 — Turn on GitHub Pages

1. In your repository, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Go to the **Actions** tab of your repo. You should see a workflow called
   "Deploy to GitHub Pages" running (it runs automatically every time you push to `main`).
   Wait for it to finish (a green checkmark).
4. Back in **Settings → Pages**, you'll now see your live site URL, something like:
   `https://yourusername.github.io/habit-tracker/`
5. Copy that domain (just the `yourusername.github.io` part) and add it to Firebase under
   **Authentication → Settings → Authorized domains** (Step 1.8) if you haven't already —
   otherwise sign-in will fail with a "domain not authorized" error.

That's it — the site URL is what you share with friends and family.

---

## Step 5 — Share it

Send the link to whoever you'd like to use it. Each person:

1. Opens the link.
2. Taps "Don't have an account? Create one", picks a username, name, email, and password.
3. Starts tapping habits on the Home screen.

To see each other's progress, one person goes to **Friends → Add Friend**, types the other
person's **username**, and sends a request. The other person accepts it from their own
**Friends** tab. After that, either of you can tap the friend's name to see their habits
(read-only) — your own data always stays under your control, and you can remove a friend
connection at any time.

---

## Running it on your own computer (optional, for making changes)

You'll need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
npm install
cp .env.example .env
# open .env and paste in your Firebase config values from Step 1.7
npm run dev
```

Then open the address it prints (usually `http://localhost:5173`). Firebase Auth will need
`localhost` on the Authorized domains list too — it's included there by default.

To build the production version yourself: `npm run build` (output goes to `dist/`).

### Optional: managing Firestore rules/indexes with the Firebase CLI

If you'd rather deploy rules and indexes from your computer instead of pasting them into the
console (Step 1.5–1.6), you can use the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
cd firebase
firebase deploy --only firestore:rules,firestore:indexes --project your-project-id
```

---

## Project structure

```
src/
  pages/            Home, Analysis, HabitDetail, Friends, FriendDashboard, Profile, Login
  components/       Reusable UI: HabitTile, HabitGrid, AnalysisView, PeriodTabs, etc.
  contexts/         Auth session + language/text-size preferences
  lib/              Firestore data-access helpers, date math
  firebaseClient.js Firebase app/auth/Firestore initialization
  i18n.js           All English/Chinese text in one place — edit here to change wording
firebase/
  firestore.rules      Security rules (who can read/write what)
  firestore.indexes.json  Composite indexes the app's queries need
.github/workflows/deploy.yml   Auto-builds and publishes to GitHub Pages
```

## Data model (Firestore)

- `users/{uid}` — profile: `username`, `displayName`, `emoji`, `createdAt`
- `usernames/{lowercaseUsername}` — `{ uid }`, used to enforce unique usernames and to look
  someone up when adding a friend
- `users/{uid}/friends/{otherUid}` — a friendship edge; a request/accept writes a mirrored
  doc on both users' subcollections at once, so no one ever needs to read someone else's
  private subcollection to know the status
- `habits/{habitId}` — `userId`, `nameZh`, `nameEn`, `icon`, `color`, `frequency`,
  `timesPerPeriod`, `archived`, `sortOrder`, `createdAt`
- `habitLogs/{habitId_logDate}` — `habitId`, `userId`, `logDate` (e.g. `2026-08-16`),
  `completed`, `createdAt`

## Making it more elderly-friendly if needed

- Text size can already be changed per-person in **Profile → Text Size**.
- To change colors, fonts, or button sizes for everyone, edit `src/styles.css` — all
  spacing/typography flows from the `:root` variables at the top of the file.
- To simplify wording, edit `src/i18n.js`.

## Privacy note

Everyone's habit data is private by default. A friend can only see your habits and daily
check-ins after you both accept a friend request — never before. This is enforced by
Firestore's own security rules (`firebase/firestore.rules`), not just hidden in the app.
