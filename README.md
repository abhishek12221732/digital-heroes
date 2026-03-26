# Digital Heroes: Golf Charity Subscription Platform

## Overview
This is a full-stack Next.js web application built for the Digital Heroes trainee assignment. It serves as a subscription-based platform that combines:

- Golf performance tracking  
- Charitable fundraising  
- A monthly algorithmic prize draw  

The aesthetic strictly adheres to the PRD’s mandate: an emotion-driven, modern, high-contrast UI that avoids traditional golf clichés (no fairways, greens, or plaid).

---

## Live Deployment
**URL:** [Insert your Vercel URL here]

---

## Testing Credentials

### Admin Access (Full Control)
- Email: admin@example.com  
- Password: admin123  

### Standard Subscriber (User Dashboard)
- Email: test1@gmail.com  
- Password: 123456  

---

## Tech Stack

- Framework: Next.js 15 (App Router, Server Actions)  
- Styling: Tailwind CSS  
- Database & Auth: Supabase (PostgreSQL, Row Level Security)  
- Deployment: Vercel  

---

## Core Features Implemented

### Rolling Score Logic
- Users input scores (1–45)  
- Database maintains only the 5 most recent scores per user  
- Older entries are automatically removed  

### Dual-Engine Algorithm
- Admin panel supports:
  - Pure Random generator  
  - Algorithmic generator (weighted by submission frequency)  

### Automated Prize Calculation
- Calculates total prize pool based on active subscribers  
- Distribution:
  - 40% → 5-number matches  
  - 35% → 4-number matches  
  - 25% → 3-number matches  

### Jackpot Rollovers
- Detects when no 5-number match exists  
- Rolls jackpot forward to the next simulated month  

### Role-Based Dashboards
- Separation between:
  - Public users  
  - Subscribers  
  - Admins  
- Implemented using:
  - Supabase Row Level Security (RLS)  
  - Server-side verification  

---

## Engineering Decisions & Problem Solving

### 1. Stripe Gateway Pivot (Regional Restrictions)

**The Issue:**  
Stripe restricts new developer accounts in India (invite-only due to RBI regulations), preventing access to test API keys.

**The Solution:**  
Implemented a Mock Payment Gateway that:
- Simulates webhook lifecycle  
- Handles state transitions (pending → active)  
- Maps charity percentage selections  
- Mimics real Stripe checkout + webhook flow  

---

### 2. Winner Verification File Uploads

**The Issue:**  
PRD requires users to upload a screenshot of their scores for verification.

**The Solution:**  
- External storage (AWS S3 / Supabase Storage) skipped for MVP scope  
- Backend workflow fully implemented:
  - Winner Pending → Admin Review → Mark as Paid  
- Fully functional inside Admin Control Center  

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-project-folder>
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Environment Variables

Create a .env.local file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```
### 4. Run the Development Server
```bash
npm run dev
```