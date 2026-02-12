# QR Asset Scanner — Team Brief

## What Is This App?

A mobile app for managing materials in a laydown yard. The full lifecycle:

**Receive → Inspect → Store → Transfer → Issue to Jobs → Ship Out**

Two user roles:
- **Field Workers** — scan QR codes on arriving material, fill inspection forms, take photos, flag exceptions, transfer/issue materials
- **Office Staff / Admins** — review exceptions, manage inventory and locations, generate QR labels, view dashboards and reports, plus everything field workers can do

---

## What We Need to Test

### Field Worker Flow
- [ ] Login as a field worker
- [ ] Scan a QR code (use one of the demo codes: QR-AVAIL001 through QR-AVAIL005)
- [ ] Complete all 6 steps of the receiving wizard (material details, PO info, inspection, photos, location, decision)
- [ ] Submit with "Accept", "Partial Accept", and "Reject" to see different behaviors
- [ ] Flag an exception (damaged or wrong count) and verify it appears in office exceptions queue
- [ ] Browse inventory and tap a material to see detail
- [ ] Transfer a material to a different location
- [ ] Issue material to a job number
- [ ] Ship out material (destination, carrier, tracking)
- [ ] Check the activity feed shows recent actions
- [ ] Test pull-to-refresh on all screens

### Office Staff Flow
- [ ] Login as office staff
- [ ] Dashboard shows KPI numbers, inventory chart, yard overview
- [ ] Materials screen — search, filter by status, edit a material
- [ ] Exceptions screen — expand an exception, resolve it (Hold or Return to Vendor)
- [ ] Locations screen — view locations, add a new location
- [ ] QR Codes screen — generate a batch of QR codes, print labels
- [ ] Reports screen — switch between Inventory and Aging reports, export CSV
- [ ] Scan tab — scan a QR code as admin and complete receiving wizard
- [ ] Activity tab — view recent activity feed

### Offline
- [ ] Turn on airplane mode
- [ ] Try a transfer or issue — should show "Queued" message
- [ ] Yellow "offline" banner appears at top
- [ ] Turn airplane mode off — queued actions sync and alert appears
- [ ] Inventory screen shows cached data when offline

### General
- [ ] Sign-out confirmation dialog appears (not instant logout)
- [ ] Filter buttons scroll horizontally on narrow screens
- [ ] App handles errors gracefully (try submitting empty forms)
- [ ] Photos compress before upload (large iPhone photos should work)

---

## Branding Assets Needed

| Asset | Size | Format | Notes |
|---|---|---|---|
| **App Icon** | 1024 x 1024 px | PNG, no transparency | Shown on home screen. OS adds rounded corners. |
| **Adaptive Icon** (Android) | 1024 x 1024 px | PNG with padding | Just the foreground element — OS crops it into circles/shapes. Leave ~30% padding around the logo. |
| **Splash Screen** | Any size, centered | PNG | Shown briefly on app launch. Usually just the logo on white. |
| **Favicon** | 48 x 48 px | PNG | Only for web version (low priority). |

**Where to put them:** Replace the files in `assets/images/` — same filenames:
- `icon.png`
- `adaptive-icon.png`
- `splash-icon.png`
- `favicon.png`

**Optional but nice:**
- App name (currently "QR_Asset_Scanner" — should be something client-friendly)
- Brand color (currently blue #2563EB — can be changed globally)
- Client logo for splash screen

---

## Rollout Plan

### Phase 1: Internal Testing (Now — Free)
- Team members install **Expo Go** on their phones
- One person runs the dev server: `npm run dev`
- Everyone else scans the terminal QR code to load the app
- No cost. Server must be running for app to work.

### Phase 2: Internal Build (When ready — ~$99)
- Create an Apple Developer account ($99/year)
- Run EAS build to create standalone apps
- Distribute via **TestFlight** (iOS) and **direct install link** (Android)
- App has its own icon on their home screen
- No dependency on anyone's laptop running

### Phase 3: Client Deployment
- Each client gets their own Supabase project (separate database)
- Same app code, different environment variables
- Build the app with client's Supabase credentials
- Distribute via TestFlight + direct Android link
- Client never touches code or servers

---

## Cost Breakdown

### One-Time Costs
| Item | Cost | Notes |
|---|---|---|
| Apple Developer Account | $99/year | Required for iOS builds. Shared across all clients. |
| Google Play Developer | $25 one-time | Only if publishing to Play Store (not required for direct distribution). |

### Per-Client Costs (Monthly)

**Option A: Free Tier (Limited)**
| Item | Cost | Limits |
|---|---|---|
| Supabase Free | $0 | 500 MB database, 1 GB file storage, 50K monthly active users, 2 projects per account |
| EAS Build | $0 | 30 builds/month shared across all projects |
| **Total** | **$0/month** | Must create separate Supabase account per client to stay free. Limited storage for photos. |

**Option B: Production (Recommended)**
| Item | Cost | Limits |
|---|---|---|
| Supabase Pro | $25/month | 8 GB database, 100 GB file storage, unlimited auth users |
| EAS Build | $0 | Free tier still sufficient |
| **Total** | **$25/month per client** | Professional, reliable, one account manages all clients. |

### Per-User Costs
- **$0** — Supabase doesn't charge per user. A client can have 5 or 500 users on the same project with no additional cost.

### Storage Considerations
- Each inspection photo is compressed to ~200-500 KB
- Supabase Free: 1 GB storage = ~2,000-5,000 photos
- Supabase Pro: 100 GB storage = ~200,000-500,000 photos
- For active yards, Pro tier is recommended

---

## Supabase Strategy

**Current setup:** Your Supabase project is linked to your GitHub via your email. This is your development/demo project.

**For clients, recommended approach:**
1. Keep one Supabase account (your email)
2. Upgrade to Pro when you have paying clients ($25/month per project)
3. Create a new Supabase **project** for each client (not a new account)
4. Each project gets its own database, auth, and storage — fully isolated
5. Run the 5 SQL migrations on each new project
6. Optionally run the seed data script for demos

**Alternative (free but messier):**
- Create a separate Supabase account (new email) for each client
- Each gets 2 free projects
- Harder to manage but costs $0

---

## Client Onboarding Checklist

For each new client:
1. [ ] Create Supabase project (new project in your account)
2. [ ] Run all 5 SQL migrations in their SQL Editor
3. [ ] Create storage bucket: `inspection-photos` (public bucket, with RLS)
4. [ ] Add storage RLS policies for authenticated users
5. [ ] Create auth users for their team (email + password per person)
6. [ ] Insert matching rows in `users` table (with correct roles)
7. [ ] Build the app with their Supabase URL and anon key
8. [ ] Distribute via TestFlight (iOS) / install link (Android)
9. [ ] Optionally run seed data for initial demo

---

## Tech Stack (For Reference)

| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo SDK 54 |
| Navigation | Expo Router v6 (file-based) |
| Backend / Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| File Storage | Supabase Storage (inspection photos) |
| State Management | Zustand |
| Form Validation | React Hook Form + Zod |
| Offline | AsyncStorage write queue + NetInfo |
| QR Generation | qrcode library + expo-print (PDF) |
| Photo Handling | expo-camera, expo-image-picker, expo-image-manipulator |

---

## Questions? Issues?

- App bugs or feature requests: file in the GitHub repo
- Supabase dashboard: ask the project lead for access
- Can't connect: make sure you have the correct `.env` values
