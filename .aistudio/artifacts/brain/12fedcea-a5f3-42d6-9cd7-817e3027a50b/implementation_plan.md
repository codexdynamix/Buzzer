# Supabase Configuration & Live Connectivity Plan

Configure the Buzzer platform with the provided Supabase project credentials, sync both the backend service environment and client-side configuration, and verify end-to-end database connectivity and storage functionality.

### User Review & Critical Decisions

> [!IMPORTANT]
> The Supabase URL provided (`https://mfwlpgksbhxqzgznfanb.supabase.co/rest/v1/`) will be normalized to base URL `https://mfwlpgksbhxqzgznfanb.supabase.co`. The anon key provided has been confirmed for client-side authentication. For server-side document storage (`app_records`), the backend requires service role access to bypass row-level security. We will configure the credentials across `.env` and `supabaseCredentials.ts` with automatic resilient fallback to ensure neither authentication nor database operations fail.

- **Confirmed Supabase URL**: `https://mfwlpgksbhxqzgznfanb.supabase.co`
- **Confirmed Public Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md2xwZ2tzYmh4cXpnem5mYW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTA3NzcsImV4cCI6MjEwODc2Njc3N30.gGsQ_8RCA84x6Y8DcPdVER3suSQ6S1X6W-coTzInka8`
- **Backend Service Access**: Configured with full administrative privileges to persist and read data from `public.app_records`.

---

### 1. Overview & Core Concept

- **What It Does**: Establishes persistent cloud data storage and authentication via Supabase Postgres for Buzzer's users, multi-vertical listings (Marketplace, Real Estate, Jobs, Services, Transport, Events), group chats, stories, reels, and analytics.
- **Target Audience**: All community members, buyers, sellers, service providers, and administrators using Buzzer.
- **Key Value**: Replaces transient in-memory storage with durable Supabase cloud persistence and live storage for user media.

---

### 2. User Experience & Visual Design

- **Connection Health Indicator**: Ensure the existing `DatabaseStatus` component and `/health` route accurately display "Connected to Supabase Postgres" with live collection statistics.
- **Smooth Auth Experience**: Users can register and sign in seamlessly via Supabase Auth without session dropouts.
- **Media Uploads**: Reels and listing imagery upload directly to the configured `buzzer-reels` Supabase storage bucket.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Environment Configuration Layering**
  - *Chosen Approach*: Configure both `.env` (for server process environment) and `registropolis-main/src/config/supabaseCredentials.ts` (for Vite client compilation and direct fallback).
  - *Why*: Ensures zero mismatch between client bundle build time, runtime server environment, and SSR/API proxies.
- **Decision 2: URL Normalization**
  - *Chosen Approach*: Automatically sanitize URLs ending with `/rest/v1/` or trailing slashes to the standard Supabase root origin.
  - *Why*: Prevents malformed Supabase endpoint concatenation like `https://.../rest/v1//rest/v1/...`.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Client Browser                       │
│    (Vite SPA - React + Supabase JS Client)             │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
         Auth & Public Reads      API Requests (/api/*)
                │                        │
                ▼                        ▼
┌────────────────────────┐      ┌────────────────────────┐
│     Supabase Auth      │      │     Express Server     │
│   & Storage Buckets    │      │    (Node.js / tsx)     │
└────────────────────────┘      └───────────┬────────────┘
                                            │
                                  Service Role Writes
                                            │
                                            ▼
                                ┌────────────────────────┐
                                │   Supabase Postgres    │
                                │  (public.app_records)  │
                                └────────────────────────┘
```

#### Execution Steps:
1. **Configure Environment & Credentials**:
   - Created `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
   - Verified `registropolis-main/src/config/supabaseCredentials.ts` with normalized project URL and keys.
2. **Verify Live Database Connection**:
   - Confirmed live read, write, and delete operations on `app_records`.
   - Verified `buzzer-reels` storage bucket.
3. **Restart Server & Health Verification**:
   - Restarted dev server and confirmed `/health` (`status: "ok", database: "supabase", auth: "supabase"`).
   - Confirmed `/api/database/status` (`status: "online", storage: "Supabase Postgres"` with 65 users and 30 listings).
   - Application build compiled cleanly with `compile_applet`.
