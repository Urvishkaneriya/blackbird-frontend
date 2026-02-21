# Blackbird Tattoo Management System

Next.js frontend for the Blackbird Tattoo backend API.

## Local development

1. Install dependencies: `pnpm install`
2. Create env file: `cp .env.example .env.local`
3. Start app: `pnpm dev`
4. Open `http://localhost:3000`

## Environment variables

- `NEXT_PUBLIC_API_URL`: absolute backend base URL, for example `https://api.example.com`

Notes:
- In development, this defaults to `http://localhost:5000` if unset.
- In production, `NEXT_PUBLIC_API_URL` is required and validated at build/runtime startup.

## Production checks

Run before deployment:

```bash
pnpm check
```

This runs linting, TypeScript checks, and production build.

## Backend

Run the backend (Node + Express + MongoDB) separately. See the backend repository for backend setup and secure credential provisioning.
