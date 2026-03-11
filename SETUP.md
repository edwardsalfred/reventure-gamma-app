# Reventure AI Proposal Generator — Setup Guide

## Overview

This app connects:
- **Read.ai** → retrieves call recording transcripts
- **Anthropic Claude** → generates structured business proposals from transcripts
- **Gamma.app** → creates visual presentations from the proposals

---

## Step 1: Get Your API Keys

You need keys for all three services:

| Service | Where to get it |
|---------|----------------|
| Read.ai | `read.ai` → Settings → Developer → API Keys |
| Gamma.app | `gamma.app` → Settings → API → Generate Key (requires Pro/Team plan) |
| Anthropic | `console.anthropic.com` → API Keys |

---

## Step 2: Set Up Neon Postgres Database

### Option A: Deploy to Vercel (Recommended)

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Before deploying, go to **Storage** tab → **Create Database** → **Postgres (Neon)**
4. This automatically adds `POSTGRES_URL` and other connection vars to your project
5. Add your other environment variables in **Settings → Environment Variables**:
   ```
   READ_AI_API_KEY=<your read.ai key>
   GAMMA_API_KEY=<your gamma key>
   ANTHROPIC_API_KEY=<your anthropic key>
   JWT_SECRET=<generate a 32+ char random string>
   ```
6. Deploy the project

### Option B: Local Development

1. Create a free Neon database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Create `.env.local` in the project root:
   ```
   READ_AI_API_KEY=your_read_ai_key
   GAMMA_API_KEY=your_gamma_key
   ANTHROPIC_API_KEY=sk-ant-...
   JWT_SECRET=your-random-32-char-string
   POSTGRES_URL=postgresql://user:pass@host/dbname?sslmode=require
   POSTGRES_URL_NON_POOLING=postgresql://user:pass@host/dbname?sslmode=require
   ```

---

## Step 3: Initialize the Database

Run this once to create the database tables:

```bash
npx tsx scripts/init-db.ts
```

---

## Step 4: Create Your Admin Account

```bash
npx tsx scripts/seed-admin.ts <username> <password>
```

Example:
```bash
npx tsx scripts/seed-admin.ts admin mySecurePassword123
```

> The admin user is auto-approved and can approve/reject other registrations.

---

## Step 5: Run the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` and sign in with your admin credentials.

---

## User Flow

1. **Sign in** at `/` with your credentials
2. **Browse meetings** from your Read.ai account on the dashboard
3. **Select a meeting** to view its transcript
4. **Click "Generate Proposal"** — this will:
   - Send the transcript to Claude AI to write a business proposal
   - Send the proposal to Gamma to create a visual presentation
   - Poll for completion (takes 1–3 minutes)
5. **View the presentation** embedded in the app, or open it directly in Gamma

---

## User Registration Flow

1. New users register at `/register`
2. Accounts start as **pending** — they cannot log in yet
3. Admin goes to `/admin/users` and approves the account
4. User can now log in

---

## Notes

- The Read.ai API key may expire (tokens last 10 minutes in OAuth mode). If you see 401 errors, refresh the key in your `.env.local` or Vercel environment variables.
- Gamma generation takes 30–120 seconds. The app polls automatically.
- If the Gamma presentation won't embed in the iframe, use the "Open in Gamma" link that appears on the viewer page.
