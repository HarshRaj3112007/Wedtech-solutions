# WedTech — Wedding Technology Innovation Suite

A comprehensive wedding technology platform consisting of two fully integrated products: a **Wedding CRM** for planners and a **Wedding RSVP Platform** for guest management. Both products communicate bidirectionally through REST APIs and real-time webhooks.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Product 1 — Wedding CRM (SaaS)](#product-1--wedding-crm-saas)
- [Product 2 — Wedding RSVP Platform](#product-2--wedding-rsvp-platform)
- [CRM ↔ RSVP Integration](#crm--rsvp-integration)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schemas](#database-schemas)
- [Project Structure](#project-structure)
- [Demo Credentials](#demo-credentials)

---

## Architecture Overview

```
┌──────────────────────────────────┐       ┌──────────────────────────────────┐
│     WEDDING CRM (P1)            │       │     RSVP PLATFORM (P2)          │
│     Port 3001                    │       │     Port 3000                    │
│     SQLite (LibSQL)              │       │     PostgreSQL                   │
│                                  │       │                                  │
│  ┌─────────────────────────┐     │       │  ┌─────────────────────────┐     │
│  │  Dashboard / Leads      │     │       │  │  Planner Dashboard      │     │
│  │  Weddings / Vendors     │     │       │  │  Guest Management       │     │
│  │  Checklists / Payments  │     │       │  │  RSVP / Analytics       │     │
│  │  Client Portal          │     │       │  │  Check-in / Seating     │     │
│  │  RSVP & Guests Tab ──────────────────────  CRM API Endpoints      │     │
│  └─────────────────────────┘     │       │  └─────────────────────────┘     │
│                                  │       │                                  │
│  API: /api/weddings/:id/rsvp/*   │◄──────│  API: /api/crm/weddings/:id/*   │
│  Webhook: /api/webhooks/rsvp     │◄──────│  Webhook: dispatchRSVPWebhook() │
└──────────────────────────────────┘       └──────────────────────────────────┘
             │                                            ▲
             │         Push guests to RSVP                │
             └────────────────────────────────────────────┘
```

**Data Flow:**

- **CRM → RSVP:** Push guest lists via `/api/crm/weddings/:id/guests/sync`
- **CRM → RSVP:** Pull headcounts via `/api/crm/weddings/:id/headcounts`
- **CRM → RSVP:** Pull guest list via `/api/crm/weddings/:id/guests`
- **CRM → RSVP:** Register webhook URL via `/api/crm/weddings/:id/webhook`
- **RSVP → CRM:** Real-time webhooks fired on every RSVP submission → CRM caches locally

---

## Tech Stack

| Layer                | CRM (Product 1)                 | RSVP Platform (Product 2)       |
| -------------------- | ------------------------------- | ------------------------------- |
| **Framework**        | Next.js 16.1.6 (App Router)     | Next.js 16.1.6 (App Router)     |
| **Language**         | TypeScript 5                    | TypeScript 5                    |
| **React**            | 19.2.3                          | 19.2.3                          |
| **Database**         | SQLite via LibSQL + Prisma 7.5  | PostgreSQL via Prisma 6.19      |
| **Authentication**   | NextAuth v4 (JWT + Credentials) | NextAuth v4 (JWT + Credentials) |
| **Styling**          | Tailwind CSS v4                 | Tailwind CSS v4 + shadcn/ui     |
| **Charts**           | Recharts v3                     | Recharts v3                     |
| **Icons**            | Lucide React                    | Lucide React                    |
| **Forms**            | —                               | React Hook Form + Zod v4        |
| **Animation**        | —                               | Framer Motion v12               |
| **Toasts**           | —                               | Sonner                          |
| **CSV Parsing**      | PapaParse                       | PapaParse                       |
| **Excel Export**     | xlsx                            | xlsx                            |
| **Password Hashing** | bcryptjs                        | bcryptjs                        |
| **Email**            | —                               | Nodemailer (SendGrid SMTP)      |
| **SMS/WhatsApp**     | —                               | Twilio + MSG91                  |
| **Image CDN**        | —                               | Cloudinary                      |
| **Job Queue**        | —                               | BullMQ + ioredis (Redis)        |
| **QR Codes**         | —                               | qrcode + HMAC-SHA256            |

---

## Product 1 — Wedding CRM (SaaS)

**Location:** `SaaS/wedding-crm/`
**Port:** 3001

A full-featured Customer Relationship Management system built for wedding planners with 7 integrated modules.

### Modules

#### Module 1: Lead Pipeline Management

- Kanban-style pipeline with 7 stages: New → Contacted → Qualified → Proposal Sent → Negotiation → Won → Lost
- Lead tracking with source attribution (Website, Instagram, Referral, Wedding Fair, etc.)
- Priority levels: Low, Medium, High, Urgent
- One-click lead-to-wedding conversion
- Bulk CSV import for leads

#### Module 2: Wedding Dashboard

- Central command center for each wedding project
- 6 tabs per wedding: **Functions**, **Vendors**, **Checklists**, **Payments**, **Timeline**, **RSVP & Guests**
- Wedding function management (Mehendi, Sangeet, Haldi, Ceremony, Reception, etc.)
- Task tracking per function with status and assignments
- Countdown timer and wedding stats overview
- Budget tracking at wedding and function level

#### Module 3: SOP & Checklist Engine

- Pre-built SOP templates: Pre-Wedding Planning (14 items), Wedding Day Execution (12 items), Vendor Management (10 items)
- Apply templates to any wedding — generates a checklist with auto-calculated due dates based on day offsets
- Item-level completion tracking with mandatory item flagging
- Category-based organization within checklists

#### Module 4: Vendor Management

- Vendor database with 16 categories: Photographer, Videographer, Caterer, Decorator, DJ, Makeup Artist, Mehendi Artist, Venue, Florist, Invitation, Transport, Lighting, Entertainment, Pandit, Choreographer, Other
- Vendor assignment to weddings and functions
- Follow-up tracking (Call, Email, Meeting, WhatsApp) with completion status
- Price range classification: Budget, Moderate, Premium, Luxury
- Portfolio and social media links (Website, Instagram)

#### Module 5: Data Library

- Centralized knowledge base with 9 categories: Venue Info, Pricing Guide, Checklist Template, Vendor Guide, Trend, FAQ, Inspiration, Contract Template, Policy
- File attachment support with searchable tags
- Public/private visibility control

#### Module 6: Client Portal

- Token-based client access (no login required for clients)
- Configurable permissions: View Timeline, View Checklist, View Vendors, View Payments
- Shareable access links with activity tracking

#### Module 7: RSVP Integration

- Direct connection to Product 2 (RSVP Platform) via API
- Real-time headcount dashboard with per-event breakdown
- Live guest list with RSVP status, dietary preferences, VIP badges
- Full sync pulls all guest data from RSVP platform into local cache
- Webhook receiver auto-updates cache when guests submit RSVPs
- Integration settings UI for configuring RSVP platform connection

### CRM Pages

| Route           | Description                                        |
| --------------- | -------------------------------------------------- |
| `/login`        | Authentication page with demo credential hints     |
| `/dashboard`    | Overview with lead stats, revenue, upcoming tasks  |
| `/leads`        | Lead pipeline with filters, search, and CSV import |
| `/leads/import` | Bulk data import for leads, vendors, weddings      |
| `/weddings`     | Wedding project list with status filters           |
| `/weddings/:id` | Wedding detail with 6 tabbed modules               |
| `/vendors`      | Vendor directory with category and city filters    |
| `/checklists`   | SOP template library and applied checklists        |
| `/library`      | Knowledge base and document library                |
| `/portal`       | Client portal access management                    |

### CRM Data Models (18 models)

`User`, `Lead`, `Activity`, `Wedding`, `WeddingFunction`, `FunctionTask`, `SOPTemplate`, `SOPTemplateItem`, `Checklist`, `ChecklistItem`, `Vendor`, `VendorAssignment`, `VendorFollowUp`, `DataLibraryItem`, `ClientPortalAccess`, `Note`, `Payment`, `RSVPGuest`

---

## Product 2 — Wedding RSVP Platform

**Location:** `RSVP/`
**Port:** 3000

A complete RSVP management platform branded as "Events by Athea" — handling everything from digital invites to event-day check-in.

### Features

#### Guest Management

- Add guests manually or bulk import from CSV
- Flexible CSV parsing — supports headers like `Name`, `Phone`, `Diet`, `Side`, `Events`, `VIP`, `Outstation`
- Automatic phone number formatting and validation (Indian +91 format)
- Guest deduplication by phone number per wedding
- Relationship side tracking: Bride / Groom / Mutual
- Group tags for organizing guests (Family, Friends, Colleagues, etc.)
- VIP and outstation flags
- Dietary preference tracking: Veg, Non-Veg, Jain, Vegan, Custom

#### RSVP Collection

- Token-based guest portal — unique URL per guest (no login required)
- Per-event RSVP (Attending / Declined) with plus-one and children counts
- Dietary preference and special notes collection
- 48-hour cutoff enforcement before event date (for changes to existing RSVPs)
- Real-time webhook dispatch to CRM on every RSVP submission

#### Digital Invitations

- 5 themes: Floral, Royal, Minimal, Boho, Traditional
- 9 languages: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Punjabi
- Customizable message and background image
- Animated invite option
- Per-event invite templates with JSON configuration

#### Event-Day Check-In

- QR code-based check-in with HMAC-SHA256 signature verification
- Manual check-in by name/phone search
- PIN-protected check-in stations per event
- Real-time check-in statistics
- Duplicate check-in prevention

#### Seating Chart

- Visual table layout with X/Y positioning
- Zone-based organization
- Drag-and-drop guest-to-table assignment
- Per-event seating configurations

#### Accommodation Management

- Hotel room tracking with room types and occupancy
- Check-in/check-out date management
- Guest-to-room assignment
- Multi-hotel support per wedding

#### Analytics Dashboard

- Per-event RSVP breakdown (Confirmed, Pending, Declined)
- Dietary preference distribution
- Outstation guest ratio
- RSVP response timeline
- Pending response tracker
- Allergy and special dietary guest lists

#### Photo Wall & Gallery

- Guest photo uploads via token-authenticated portal
- Moderation system: Pending Review → Approved / Rejected
- Public gallery at `/gallery/:weddingCode`
- Cloudinary CDN integration for image hosting

#### Reminder Engine

- Configurable reminder schedules by day offset and channel
- Multi-channel: WhatsApp, SMS, Email
- Bulk reminder blast to all pending guests
- Template variables: `{guest_name}`, `{event_name}`, `{event_date}`, `{rsvp_link}`
- Communication log with delivery status tracking (Queued, Sent, Delivered, Read, Failed)
- BullMQ + Redis for background job processing

#### Live Display

- Real-time RSVP count display for large screens
- Time-limited display tokens for security
- Public endpoint at `/display/:weddingCode`

### RSVP Pages

**Planner Dashboard (Authenticated):**

| Route                         | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `/register`                   | Planner account registration (auto-generates API key) |
| `/login`                      | Planner login                                         |
| `/dashboard`                  | Wedding overview and quick actions                    |
| `/weddings/new`               | Create a new wedding project                          |
| `/weddings/:id`               | Wedding detail and configuration                      |
| `/weddings/:id/guests`        | Guest list management + CSV import                    |
| `/weddings/:id/analytics`     | RSVP analytics dashboard                              |
| `/weddings/:id/accommodation` | Room and hotel management                             |
| `/weddings/:id/seating`       | Visual seating chart                                  |
| `/weddings/:id/reminders`     | Reminder schedule configuration                       |

**Guest-Facing (Token-Based, No Login):**

| Route                             | Description               |
| --------------------------------- | ------------------------- |
| `/guest/:guestToken`              | Personalized RSVP portal  |
| `/invite/:weddingCode/:eventSlug` | Themed digital invitation |
| `/gallery/:weddingCode`           | Public photo gallery      |

**Event-Day:**

| Route                              | Description              |
| ---------------------------------- | ------------------------ |
| `/checkin/:weddingCode/:eventSlug` | Check-in kiosk           |
| `/display/:weddingCode`            | Live RSVP display screen |

### RSVP Data Models (17 models, 10 enums)

**Models:** `Planner`, `Account`, `Session`, `VerificationToken`, `Wedding`, `WeddingEvent`, `Guest`, `GuestEventInvite`, `PlusOne`, `AccommodationRoom`, `SeatingTable`, `InviteTemplate`, `CheckIn`, `CommunicationLog`, `ReminderSchedule`, `Photo`, `DisplayToken`

**Enums:** `RelationshipSide`, `DietaryPreference`, `RSVPStatus`, `CheckInMethod`, `InviteTheme`, `InviteLanguage`, `MessageChannel`, `MessageStatus`, `PlanTier`, `PhotoStatus`

### RSVP UI Components (23 shadcn/ui components)

`Avatar`, `Badge`, `Button`, `Card`, `Checkbox`, `Command`, `Dialog`, `DropdownMenu`, `Input`, `InputGroup`, `Label`, `Popover`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Tooltip`

---

## CRM ↔ RSVP Integration

### How It Works

1. **Setup:** In the CRM, open any wedding → "RSVP & Guests" tab → "Connect RSVP Platform" → enter the RSVP Platform URL, Wedding ID, and Planner API Key.

2. **Auto Webhook Registration:** When settings are saved, the CRM automatically calls `PUT /api/crm/weddings/:id/webhook` on the RSVP platform to register its webhook URL (`http://localhost:3001/api/webhooks/rsvp`).

3. **Data Pull (CRM → RSVP):** The CRM proxies requests through its own API to the RSVP platform:
   - `GET /api/weddings/:id/rsvp/headcounts` → proxies to RSVP's `/api/crm/weddings/:id/headcounts`
   - `GET /api/weddings/:id/rsvp/guests` → proxies to RSVP's `/api/crm/weddings/:id/guests`
   - Falls back to locally cached `RSVPGuest` records if the RSVP platform is unreachable

4. **Data Push (CRM → RSVP):** The CRM can push guest lists:
   - `POST /api/weddings/:id/rsvp/sync` → proxies to RSVP's `/api/crm/weddings/:id/guests/sync`

5. **Real-Time Updates (RSVP → CRM):** When a guest submits an RSVP on the RSVP platform:
   - The RSVP submission handler fires `dispatchRSVPWebhook()` (fire-and-forget, 5s timeout)
   - The CRM's webhook receiver at `/api/webhooks/rsvp` upserts the `RSVPGuest` cache record
   - No data is lost if the CRM is down — the "Sync from RSVP" button performs a full resync

6. **Full Sync:** `POST /api/weddings/:id/rsvp/full-sync` pulls all pages of guest data from the RSVP platform and upserts the entire local `RSVPGuest` cache.

### Authentication

| Direction            | Mechanism                                                        |
| -------------------- | ---------------------------------------------------------------- |
| CRM → RSVP API calls | Bearer token (`Planner.apiKey`) in Authorization header          |
| RSVP → CRM webhooks  | No auth (localhost dev); HMAC signing recommended for production |
| Guest RSVP portal    | Unique token in URL path (`/guest/:guestToken`)                  |
| Event-day check-in   | PIN per event + HMAC-signed QR codes                             |

### Integration API Endpoints

**On RSVP Platform (consumed by CRM):**

| Method | Endpoint                            | Description                             |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/api/crm/weddings/:id/guests`      | Paginated guest list with RSVP details  |
| POST   | `/api/crm/weddings/:id/guests/sync` | Upsert guests from CRM (dedup by phone) |
| GET    | `/api/crm/weddings/:id/headcounts`  | Per-event confirmed PAX aggregates      |
| GET    | `/api/crm/weddings/:id/webhook`     | Get current webhook URL                 |
| PUT    | `/api/crm/weddings/:id/webhook`     | Set/update webhook URL                  |

**On CRM (proxy + webhook receiver):**

| Method | Endpoint                            | Description                              |
| ------ | ----------------------------------- | ---------------------------------------- |
| GET    | `/api/weddings/:id/rsvp/settings`   | Get integration config                   |
| PUT    | `/api/weddings/:id/rsvp/settings`   | Save config + auto-register webhook      |
| GET    | `/api/weddings/:id/rsvp/guests`     | Proxy to RSVP guest API (cache fallback) |
| GET    | `/api/weddings/:id/rsvp/headcounts` | Proxy to RSVP headcount API              |
| POST   | `/api/weddings/:id/rsvp/sync`       | Push guests to RSVP platform             |
| POST   | `/api/weddings/:id/rsvp/full-sync`  | Pull all guests, rebuild local cache     |
| POST   | `/api/webhooks/rsvp`                | Receive real-time RSVP updates           |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** 14+ (for the RSVP platform)
- **Homebrew** (macOS) for installing PostgreSQL

### Step 1: Install PostgreSQL (if not installed)

```bash
brew install postgresql@17
brew services start postgresql@17

# Create the postgres role and database
psql -h localhost -U $(whoami) -d postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
createdb -U postgres wedding_rsvp
```

### Step 2: Start the CRM (Terminal 1)

```bash
cd SaaS/wedding-crm

# Install dependencies (if first time)
npm install

# Apply database migrations (creates SQLite dev.db)
npx prisma migrate deploy

# Seed with demo data
npm run seed

# Start dev server
npm run dev
```

CRM runs at **http://localhost:3001**

### Step 3: Start the RSVP Platform (Terminal 2)

```bash
cd RSVP

# Install dependencies (if first time)
npm install

# Push schema to PostgreSQL
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

RSVP runs at **http://localhost:3000**

### Step 4: Create a Planner Account

1. Go to **http://localhost:3000/register**
2. Register with name, email, and password
3. An API key is auto-generated (find it via `npx prisma studio`)

### Step 5: Connect CRM to RSVP

1. Go to **http://localhost:3001** → login with `admin@wedcrm.com` / `admin123`
2. Open any wedding → **RSVP & Guests** tab
3. Click **Connect RSVP Platform**
4. Enter: RSVP URL (`http://localhost:3000`), Wedding ID (from RSVP database), API Key (from planner record)
5. Click **Test Connection** → should show green success
6. Click **Save & Connect**
7. Click **Sync from RSVP** to pull guest data

---

## Environment Variables

### RSVP Platform (`RSVP/.env`)

| Variable                | Required | Default                  | Description                    |
| ----------------------- | -------- | ------------------------ | ------------------------------ |
| `DATABASE_URL`          | Yes      | —                        | PostgreSQL connection string   |
| `NEXTAUTH_URL`          | Yes      | `http://localhost:3000`  | NextAuth base URL              |
| `NEXTAUTH_SECRET`       | Yes      | —                        | JWT signing secret             |
| `HMAC_SECRET`           | Yes      | —                        | QR code HMAC signing secret    |
| `REDIS_URL`             | No       | —                        | Redis URL for BullMQ job queue |
| `TWILIO_ACCOUNT_SID`    | No       | —                        | Twilio SMS/WhatsApp            |
| `TWILIO_AUTH_TOKEN`     | No       | —                        | Twilio auth                    |
| `TWILIO_PHONE_NUMBER`   | No       | —                        | Twilio sender number           |
| `MSG91_AUTH_KEY`        | No       | —                        | MSG91 Indian SMS gateway       |
| `MSG91_SENDER_ID`       | No       | —                        | MSG91 sender ID                |
| `SMTP_HOST`             | No       | `smtp.sendgrid.net`      | Email SMTP host                |
| `SMTP_PORT`             | No       | `587`                    | Email SMTP port                |
| `SMTP_USER`             | No       | —                        | SMTP username                  |
| `SMTP_PASS`             | No       | —                        | SMTP password                  |
| `EMAIL_FROM`            | No       | `noreply@wedtech.events` | Sender email address           |
| `CLOUDINARY_CLOUD_NAME` | No       | —                        | Cloudinary cloud name          |
| `CLOUDINARY_API_KEY`    | No       | —                        | Cloudinary API key             |
| `CLOUDINARY_API_SECRET` | No       | —                        | Cloudinary secret              |
| `NEXT_PUBLIC_APP_URL`   | No       | `http://localhost:3000`  | Public-facing app URL          |

### CRM (`SaaS/wedding-crm/.env`)

| Variable          | Required | Default                 | Description                              |
| ----------------- | -------- | ----------------------- | ---------------------------------------- |
| `DATABASE_URL`    | Yes      | `file:./dev.db`         | SQLite database path                     |
| `NEXTAUTH_SECRET` | Yes      | —                       | JWT signing secret                       |
| `NEXTAUTH_URL`    | Yes      | `http://localhost:3001` | NextAuth base URL                        |
| `CRM_BASE_URL`    | Yes      | `http://localhost:3001` | CRM's own URL (for webhook registration) |

---

## API Reference

### RSVP Platform API (37 route files)

<details>
<summary><strong>Authentication</strong></summary>

| Method     | Endpoint                  | Auth   | Description                               |
| ---------- | ------------------------- | ------ | ----------------------------------------- |
| `POST`     | `/api/auth/register`      | Public | Register planner (auto-generates API key) |
| `GET/POST` | `/api/auth/[...nextauth]` | Public | NextAuth login/logout/session             |

</details>

<details>
<summary><strong>Weddings</strong></summary>

| Method   | Endpoint            | Auth    | Description                     |
| -------- | ------------------- | ------- | ------------------------------- |
| `GET`    | `/api/weddings`     | Planner | List all weddings               |
| `POST`   | `/api/weddings`     | Planner | Create wedding                  |
| `GET`    | `/api/weddings/:id` | Planner | Wedding detail with RSVP counts |
| `PATCH`  | `/api/weddings/:id` | Planner | Update wedding                  |
| `DELETE` | `/api/weddings/:id` | Planner | Delete wedding (cascade)        |

</details>

<details>
<summary><strong>Events</strong></summary>

| Method   | Endpoint                            | Auth    | Description  |
| -------- | ----------------------------------- | ------- | ------------ |
| `GET`    | `/api/weddings/:id/events`          | Planner | List events  |
| `POST`   | `/api/weddings/:id/events`          | Planner | Create event |
| `PATCH`  | `/api/weddings/:id/events/:eventId` | Planner | Update event |
| `DELETE` | `/api/weddings/:id/events/:eventId` | Planner | Delete event |

</details>

<details>
<summary><strong>Guests</strong></summary>

| Method   | Endpoint                                   | Auth    | Description                     |
| -------- | ------------------------------------------ | ------- | ------------------------------- |
| `GET`    | `/api/weddings/:id/guests`                 | Planner | Paginated + filtered guest list |
| `POST`   | `/api/weddings/:id/guests`                 | Planner | Add single guest                |
| `GET`    | `/api/weddings/:id/guests/:guestId`        | Planner | Full guest profile              |
| `PATCH`  | `/api/weddings/:id/guests/:guestId`        | Planner | Update guest                    |
| `DELETE` | `/api/weddings/:id/guests/:guestId`        | Planner | Delete guest                    |
| `PUT`    | `/api/weddings/:id/guests/:guestId/events` | Planner | Replace event assignments       |
| `POST`   | `/api/weddings/:id/guests/import`          | Planner | CSV bulk import                 |

</details>

<details>
<summary><strong>Guest Self-Service</strong></summary>

| Method | Endpoint                       | Auth  | Description                        |
| ------ | ------------------------------ | ----- | ---------------------------------- |
| `GET`  | `/api/guests/:guestToken`      | Token | Guest portal data                  |
| `POST` | `/api/guests/:guestToken/rsvp` | Token | Submit RSVP (fires webhook to CRM) |

</details>

<details>
<summary><strong>Check-In</strong></summary>

| Method | Endpoint                   | Auth | Description                   |
| ------ | -------------------------- | ---- | ----------------------------- |
| `GET`  | `/api/checkin/:code/:slug` | PIN  | Check-in stats + guest search |
| `POST` | `/api/checkin/:code/:slug` | PIN  | Check in guest (QR/manual)    |

</details>

<details>
<summary><strong>Analytics, Accommodation, Seating, Reminders, Photos, Display</strong></summary>

| Method     | Endpoint                           | Description                   |
| ---------- | ---------------------------------- | ----------------------------- |
| `GET`      | `/api/weddings/:id/analytics`      | Full analytics dashboard data |
| `GET/POST` | `/api/weddings/:id/accommodation`  | Room CRUD                     |
| `GET/POST` | `/api/weddings/:id/seating`        | Table CRUD                    |
| `GET/POST` | `/api/weddings/:id/reminders`      | Reminder schedule CRUD        |
| `POST`     | `/api/weddings/:id/reminders/send` | Blast reminders               |
| `GET/POST` | `/api/weddings/:id/photos`         | Photo wall management         |
| `POST`     | `/api/weddings/:id/display-tokens` | Generate display token        |
| `GET`      | `/api/display/:code`               | Live display data             |
| `GET`      | `/api/gallery/:code`               | Public photo gallery          |

</details>

<details>
<summary><strong>CRM Integration Endpoints</strong></summary>

| Method | Endpoint                            | Auth   | Description             |
| ------ | ----------------------------------- | ------ | ----------------------- |
| `GET`  | `/api/crm/weddings/:id/guests`      | Bearer | Full guest list for CRM |
| `POST` | `/api/crm/weddings/:id/guests/sync` | Bearer | CRM pushes guest list   |
| `GET`  | `/api/crm/weddings/:id/headcounts`  | Bearer | Per-event PAX counts    |
| `GET`  | `/api/crm/weddings/:id/webhook`     | Bearer | Get webhook URL         |
| `PUT`  | `/api/crm/weddings/:id/webhook`     | Bearer | Set webhook URL         |

</details>

### CRM API (24 route files)

<details>
<summary><strong>All CRM Endpoints</strong></summary>

| Method           | Endpoint                            | Description               |
| ---------------- | ----------------------------------- | ------------------------- |
| `GET/POST`       | `/api/auth/[...nextauth]`           | NextAuth handler          |
| `GET`            | `/api/dashboard`                    | Dashboard stats           |
| `GET/POST`       | `/api/leads`                        | Lead CRUD                 |
| `GET/PUT/DELETE` | `/api/leads/:id`                    | Single lead               |
| `POST`           | `/api/leads/convert`                | Lead → Wedding conversion |
| `GET/POST`       | `/api/weddings`                     | Wedding CRUD              |
| `GET/PUT/DELETE` | `/api/weddings/:id`                 | Single wedding            |
| `POST`           | `/api/weddings/:id/functions`       | Add wedding function      |
| `GET/POST`       | `/api/checklists`                   | Checklist + SOP templates |
| `PUT/DELETE`     | `/api/checklists/:id`               | Single checklist          |
| `GET/POST`       | `/api/vendors`                      | Vendor CRUD               |
| `GET/PUT/DELETE` | `/api/vendors/:id`                  | Single vendor             |
| `POST`           | `/api/vendors/:id/followups`        | Vendor follow-up          |
| `GET/POST`       | `/api/library`                      | Data library              |
| `PUT/DELETE`     | `/api/library/:id`                  | Single library item       |
| `GET/POST`       | `/api/portal`                       | Client portal             |
| `GET`            | `/api/portal/:token`                | Portal access by token    |
| `POST`           | `/api/import`                       | Bulk CSV import           |
| `GET/PUT`        | `/api/weddings/:id/rsvp/settings`   | RSVP integration config   |
| `GET`            | `/api/weddings/:id/rsvp/guests`     | Proxy: RSVP guest list    |
| `GET`            | `/api/weddings/:id/rsvp/headcounts` | Proxy: RSVP headcounts    |
| `POST`           | `/api/weddings/:id/rsvp/sync`       | Push guests to RSVP       |
| `POST`           | `/api/weddings/:id/rsvp/full-sync`  | Full data pull + cache    |
| `POST`           | `/api/webhooks/rsvp`                | Receive RSVP webhooks     |

</details>

---

## Database Schemas

### RSVP Platform — PostgreSQL (17 models, 10 enums)

```
planners ──────────────── 1:N ──── weddings
weddings ──────────────── 1:N ──── wedding_events
weddings ──────────────── 1:N ──── guests
weddings ──────────────── 1:N ──── accommodation_rooms
weddings ──────────────── 1:N ──── invite_templates
weddings ──────────────── 1:N ──── photos
weddings ──────────────── 1:N ──── display_tokens
weddings ──────────────── 1:N ──── reminder_schedules
guests ────────────────── 1:N ──── guest_event_invites
guests ────────────────── 1:N ──── plus_ones
guests ────────────────── 1:N ──── check_ins
guests ────────────────── 1:N ──── communication_logs
guest_event_invites ──── N:1 ──── wedding_events
guest_event_invites ──── N:1 ──── seating_tables
accommodation_rooms ──── 1:N ──── guests
seating_tables ────────── N:1 ──── wedding_events
```

### CRM — SQLite (18 models)

```
users ─────────────────── 1:N ──── leads (assigned + created)
users ─────────────────── 1:N ──── weddings (assigned RM)
users ─────────────────── 1:N ──── activities
users ─────────────────── 1:N ──── notes
leads ─────────────────── 1:1 ──── weddings (conversion)
leads ─────────────────── 1:N ──── activities
weddings ──────────────── 1:N ──── wedding_functions
weddings ──────────────── 1:N ──── vendor_assignments
weddings ──────────────── 1:N ──── checklists
weddings ──────────────── 1:N ──── activities
weddings ──────────────── 1:N ──── notes
weddings ──────────────── 1:N ──── payments
weddings ──────────────── 1:N ──── client_portal_access
weddings ──────────────── 1:N ──── rsvp_guests (integration cache)
wedding_functions ─────── 1:N ──── function_tasks
wedding_functions ─────── 1:N ──── vendor_assignments
vendors ───────────────── 1:N ──── vendor_assignments
vendors ───────────────── 1:N ──── vendor_follow_ups
sop_templates ─────────── 1:N ──── sop_template_items
sop_templates ─────────── 1:N ──── checklists
checklists ────────────── 1:N ──── checklist_items
```

---

## Project Structure

```
Wedtech/
├── RSVP/                              # Product 2: Wedding RSVP Platform
│   ├── prisma/
│   │   └── schema.prisma             # PostgreSQL schema (17 models, 10 enums)
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── (planner)/            # Authenticated planner pages (8 pages)
│   │   │   ├── (guest)/              # Token-based guest pages (3 pages)
│   │   │   ├── checkin/              # Event-day check-in kiosk
│   │   │   ├── display/              # Live RSVP display screen
│   │   │   ├── login/               # Planner login
│   │   │   ├── register/            # Planner registration
│   │   │   └── api/                  # 37 API route directories
│   │   │       ├── auth/            # NextAuth + registration
│   │   │       ├── crm/             # CRM-facing integration APIs
│   │   │       ├── guests/          # Guest self-service (RSVP)
│   │   │       ├── weddings/        # Full wedding CRUD + sub-resources
│   │   │       ├── checkin/         # Check-in operations
│   │   │       ├── display/         # Display screen data
│   │   │       ├── gallery/         # Public gallery
│   │   │       └── webhooks/        # Webhook endpoints
│   │   ├── components/
│   │   │   ├── providers.tsx         # NextAuth + theme + toast providers
│   │   │   └── ui/                   # 23 shadcn/ui components
│   │   ├── lib/
│   │   │   ├── auth/
│   │   │   │   ├── index.ts         # getCurrentPlanner(), requirePlanner()
│   │   │   │   ├── options.ts       # NextAuth config
│   │   │   │   └── crm.ts          # authenticateCRM() — shared bearer token auth
│   │   │   ├── db/
│   │   │   │   ├── index.ts         # Re-exports prisma
│   │   │   │   └── prisma.ts        # Singleton PrismaClient
│   │   │   ├── services/
│   │   │   │   ├── reminders.ts     # Bulk + single reminder dispatch
│   │   │   │   └── webhook.ts       # dispatchRSVPWebhook() — outbound CRM webhook
│   │   │   ├── constants.ts          # Themes, languages, dietary labels, presets
│   │   │   ├── hooks/index.ts       # useApi(), useDebounce()
│   │   │   ├── types.ts             # Re-exported Prisma types
│   │   │   ├── utils.ts             # cn(), formatIndianPhone(), slugify(), HMAC, pagination
│   │   │   └── validations/index.ts # Zod schemas for all entities
│   │   └── types/
│   │       └── next-auth.d.ts       # Session type augmentation
│   ├── .env                          # Environment variables
│   ├── package.json                  # 86 TypeScript files total
│   └── next.config.ts               # Cloudinary + Unsplash images, 10MB body limit
│
└── SaaS/
    └── wedding-crm/                   # Product 1: Wedding CRM
        ├── prisma/
        │   ├── schema.prisma          # SQLite schema (18 models)
        │   ├── seed.ts               # Demo data seeder
        │   └── migrations/           # SQLite migrations
        ├── src/
        │   ├── app/
        │   │   ├── (dashboard)/       # Authenticated dashboard pages (9 pages + layout)
        │   │   │   ├── dashboard/
        │   │   │   ├── leads/
        │   │   │   ├── weddings/
        │   │   │   ├── vendors/
        │   │   │   ├── checklists/
        │   │   │   ├── library/
        │   │   │   └── portal/
        │   │   ├── login/            # Authentication page
        │   │   └── api/              # 24 API route files
        │   │       ├── auth/         # NextAuth
        │   │       ├── dashboard/    # Stats aggregation
        │   │       ├── leads/        # Lead pipeline CRUD
        │   │       ├── weddings/     # Wedding CRUD + functions + RSVP integration
        │   │       ├── vendors/      # Vendor CRUD + follow-ups
        │   │       ├── checklists/   # SOP templates + checklists
        │   │       ├── library/      # Data library CRUD
        │   │       ├── portal/       # Client portal
        │   │       ├── import/       # Bulk CSV import
        │   │       └── webhooks/     # RSVP webhook receiver
        │   ├── components/
        │   │   ├── Providers.tsx      # NextAuth SessionProvider
        │   │   ├── Sidebar.tsx       # Dashboard navigation
        │   │   └── RSVPSettings.tsx  # RSVP integration modal
        │   ├── lib/
        │   │   ├── auth.ts           # NextAuth configuration
        │   │   ├── prisma.ts         # PrismaClient singleton (LibSQL adapter)
        │   │   ├── types.ts          # Type aliases + constants
        │   │   └── utils.ts          # cn(), formatCurrency(), formatDate()
        │   └── generated/
        │       └── prisma/           # Generated Prisma client
        ├── .env                       # Environment variables
        └── package.json               # 71 TypeScript files total
```

---

## Demo Credentials

### CRM Login (`http://localhost:3001/login`)

| Role                 | Email               | Password   |
| -------------------- | ------------------- | ---------- |
| Admin                | `admin@wedcrm.com`  | `admin123` |
| Relationship Manager | `anjali@wedcrm.com` | `admin123` |
| Relationship Manager | `rohit@wedcrm.com`  | `admin123` |
| Vendor Coordinator   | `meera@wedcrm.com`  | `admin123` |

### RSVP Platform (`http://localhost:3000/login`)

Register a new planner account at `/register`. The API key is auto-generated and stored in the `planners` table (view via `npx prisma studio`).

### Client Portal

Access the demo client portal at: `http://localhost:3001/client/demo-portal-token-kabir`

---

## Standard API Response Format

Both platforms use a consistent JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 120
  }
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Error message here"
}
```

---

## CSV Import Format (RSVP Platform)

The guest import accepts CSV files with flexible column naming (case-insensitive):

```csv
Name,Phone,Email,Side,Group,Events,VIP,Outstation,Diet,Plus One
Rajesh Sharma,9876543210,rajesh@email.com,Bride,Family,"Mehendi,Sangeet,Reception",Yes,No,Vegetarian,Yes
```

| Column              | Required | Accepted Values                                 |
| ------------------- | -------- | ----------------------------------------------- |
| Name                | Yes      | Any string                                      |
| Phone               | Yes      | 10-digit Indian mobile (starting with 6/7/8/9)  |
| Email               | No       | Valid email                                     |
| Side                | No       | Bride, Groom, Mutual                            |
| Group               | No       | Family, Friends, Colleagues, etc.               |
| Events              | No       | Comma-separated event names                     |
| VIP                 | No       | Yes/No/True/False/1/0                           |
| Outstation          | No       | Yes/No/True/False/1/0                           |
| Diet / Dietary      | No       | Vegetarian, Non-Vegetarian, Jain, Vegan, Custom |
| Plus One / Plus_One | No       | Yes/No/True/False/1/0                           |

---

## License

This project was developed for the WedTech Innovation Challenge.
