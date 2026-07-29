# GarageOS v2

A professional B2B garage management system built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication & Onboarding**: Secure email/password auth with garage profile creation
- **Form Persistence**: Signup form auto-saves to localStorage as you type
- **Subscription Gate**: Promo code system (try `MARCO_FREE` for lifetime access)
- **Dashboard**: Kanban board with "In Garage", "Ready for Pickup", and "Paid & Closed" columns
- **Job CRUD**: Create, view (detail modal), edit, and delete job tickets with confirmation
- **Itemized Estimates**: Dynamic parts & labor rows with auto-calculating totals
- **WhatsApp Integration**: Zero-cost notifications via wa.me links
- **Smart Invoices**: Professional receipts pulling your garage name, address, and phone dynamically
- **Print-Ready**: Tailwind `print:` modifiers strip all UI chrome — only the clean invoice prints
- **Mobile-First**: Fully responsive design with touch-friendly targets for mechanics on the go

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Lucide React (icons)
- Netlify-ready

## Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

1. Open Supabase SQL Editor
2. Paste the contents of `supabase/schema_v2.sql`
3. Run the script

### 4. Authentication Setup (CRITICAL)

1. Go to **Authentication → Providers** in Supabase
2. Enable **Email** provider
3. Go to **Authentication → URL Configuration**
4. Set **Site URL** to `http://localhost:5173` (for local dev)
5. Add `http://localhost:5173` to **Redirect URLs**
6. For production, add your Netlify URL too

> **Note**: Turn off "Confirm email" in Auth → Providers → Email if you want instant sign-up without verification.

### 5. Run Locally

```bash
npm run dev
```

### 6. Deploy to Netlify

1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Update Supabase Auth URL Configuration with your Netlify domain

## File Structure

```
garage-os/
├── supabase/
│   ├── schema.sql              # Original schema (v1)
│   └── schema_v2.sql           # Updated schema with garages table + garage_id
├── src/
│   ├── hooks/
│   │   ├── useLocalStorage.ts  # Persist form state to browser cache
│   │   └── useGarage.ts        # Fetch & manage garage profile
│   ├── types/
│   │   └── database.ts         # TypeScript types (updated for v2)
│   ├── lib/
│   │   ├── supabaseClient.ts   # Type-safe Supabase client
│   │   └── utils.ts            # Tailwind merge helper
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives
│   │   ├── AuthContext.tsx     # Global auth state
│   │   ├── Login.tsx           # Simple email/password login
│   │   ├── Signup.tsx          # Advanced signup with garage details + localStorage
│   │   ├── SubscriptionGate.tsx # Promo code / paywall screen
│   │   ├── Layout.tsx          # Page wrapper
│   │   ├── Navbar.tsx          # Top nav with garage name
│   │   ├── Dashboard.tsx       # Kanban board + search + stats + CRUD
│   │   ├── JobCard.tsx         # Job card with actions
│   │   ├── JobDetailModal.tsx  # Full job detail view modal
│   │   ├── JobTicketForm.tsx   # Create / Edit job form
│   │   ├── ItemizedEstimator.tsx # Dynamic parts/labor rows
│   │   ├── WhatsAppButton.tsx  # wa.me link generator
│   │   ├── InvoiceView.tsx     # Print-ready invoice (garage-aware)
│   │   ├── SearchBar.tsx       # Filter input
│   │   └── ConfirmDialog.tsx   # Reusable delete confirmation
│   ├── App.tsx                 # Root app with routing logic
│   └── main.tsx                # Entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## User Flow

1. **Signup**: Enter garage details → form auto-saves to localStorage → submit creates auth user + garage profile
2. **Subscription Gate**: Enter `MARCO_FREE` for lifetime access, or skip for trial mode
3. **Dashboard**: View jobs in Kanban columns, search by plate/client, click cards for details
4. **Job Management**: Create new tickets, edit existing ones, delete with confirmation
5. **Invoicing**: Click Print on any job → professional receipt with your garage branding
6. **WhatsApp**: Notify clients directly when jobs are ready for pickup

## License

MIT
