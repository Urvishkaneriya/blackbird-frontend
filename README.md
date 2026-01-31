# Blackbird Tattoo Management System

Next.js frontend for the Blackbird Tattoo backend API.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL=http://localhost:5000` in `.env.local` if the backend runs elsewhere.

## Backend

Run the backend (Node + Express + MongoDB) separately. See the backend repo for setup. Login: `admin@blackbird.com` / `123456` (or whatever is set in backend `.env`).
