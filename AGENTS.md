# Project Guidelines for AI Agents

Welcome, AI coding assistant! This document outlines the critical information, rules, and architecture of the **Enrollment Queuing System** to help you effectively write code, debug, and maintain this project.

## 1. Project Overview
The **Enrollment Queuing System** is a digital queue management application designed to streamline student registration during enrollment periods. It prevents bot spam using Cloudflare Turnstile and restricts queue registration based on GPS location (geofencing).

**Tech Stack:**
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Backend & Database:** Supabase (PostgreSQL, Realtime WebSockets, Authentication)
- **Data Validation:** Zod
- **Anti-Bot Protection:** Cloudflare Turnstile

**Architecture (MVC-Inspired):**
- `src/app/`: Next.js App Router endpoints, pages, and layouts.
- `src/components/`: Reusable React components (e.g., UI, Navbar, Turnstile widget).
- `src/controllers/`: Business logic and data validation before interacting with the database.
- `src/models/`: Database operations encapsulating all Supabase queries.
- `src/lib/`: Utility functions (e.g., Supabase clients, math/geofencing helpers).

## 2. Build and Test Commands
This is a Node.js project using npm. 

- **Install dependencies:** `npm install`
- **Development server:** `npm run dev`
- **Production build:** `npm run build`
- **Start production server:** `npm run start`

*(Note: There are currently no automated test scripts configured in `package.json`, but future tests should integrate easily into this structure.)*

## 3. Code Style Guidelines
- **Use Server Components by Default:** Given Next.js App Router, prioritize React Server Components (RSC) to reduce client JavaScript. Add `"use client"` only for interactive components (e.g., Turnstile, Realtime listeners, forms).
- **Separation of Concerns:** Never write raw Supabase database queries directly in the UI components or Next.js API routes (`src/app/`). All queries must go into `src/models/`, and business logic/validation in `src/controllers/`.
- **Validation:** Always use **Zod** to validate input data (e.g., student IDs, geographic coordinates) in controllers or API routes before processing.

## 4. Testing Instructions
- Because there is no automated test runner configured yet, any new features should be verified manually by running `npm run dev` and testing the functionality in a local browser environment.
- Use the provided `.env.local.example` to set up your local environment variables for Supabase and Cloudflare Turnstile.
- Test geofencing and Turnstile protections manually when creating/modifying the queue join workflow.

## 5. Security Considerations & Gotchas
- **Secret Keys:** `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` must **never** be exposed to the client. Keep them exclusively in server-side functions/API routes.
- **Client Keys:** Only variables prefixed with `NEXT_PUBLIC_` (like `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and geofencing coordinates) can be exposed in client code.
- **Anti-Bot Logic:** Ensure all public-facing queue registration endpoints validate the Cloudflare Turnstile token on the server-side before processing the request.
- **Location Spoofing:** Geofencing relies on coordinates sent by the client. Always validate the distance on the backend using the variables `NEXT_PUBLIC_CAMPUS_LAT`, `NEXT_PUBLIC_CAMPUS_LNG`, and `NEXT_PUBLIC_CAMPUS_RADIUS_METERS`.

## 6. Extra Instructions
- **Commit Messages:** Follow standard Conventional Commits formatting (e.g., `feat:`, `fix:`, `refactor:`, `docs:`). Make commits small and focused.
- **Deployment Steps:** The application is built for standard Next.js hosting environments (like Vercel). Deployment requires ensuring that all environment variables listed in `.env.local.example` are configured in the production environment.
- **Database Migrations:** Any updates to the database schema or RPC functions (like those in `migration_rpc_join_queue.sql` or `supabase_setup.sql`) must be thoroughly reviewed and executed in the Supabase SQL Editor. Update the respective SQL migration files in the repository.
