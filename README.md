# Portfolio Generator

Users sign up, fill in their profile, skills, experience, education, projects and links (or upload a resume to auto-fill), and get a public page at `/[username]`.

## Structure

| Folder      | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| `frontend/` | Next.js (App Router), React, TypeScript, Tailwind                        |
| `backend/`  | Express, TypeScript (`routes/ controllers/ services/ middleware/ lib/`)  |
| `shared/`   | Zod schemas and shared types, compiled to `shared/dist` and used by both |

Managed as npm workspaces (Node 20+).

## Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

On Windows PowerShell use `Copy-Item` instead of `cp`.

## Run in development

```bash
npm run dev
```

This builds `shared` once, then runs three processes together: `shared` in watch mode, the backend on http://localhost:4000 and the frontend on http://localhost:3000.

Run them individually with `npm run dev:backend` or `npm run dev:frontend` (build shared first with `npm run build:shared`).

## Verify

```bash
curl http://localhost:4000/health
# {"status":"ok","uptime":12.3,"timestamp":"..."}
```

Open http://localhost:3000 to see the frontend.

## Other scripts

| Command                                   | What it does                               |
| ----------------------------------------- | ------------------------------------------ |
| `npm run build`                           | Build shared, backend (`tsc`) and frontend |
| `npm run start -w @portfolio/backend`     | Run the built backend                      |
| `npm run typecheck`                       | Type-check all workspaces                  |
| `npm run lint`                            | ESLint                                     |
| `npm run format` / `npm run format:check` | Prettier                                   |

## Environment variables

**backend/.env** (validated with Zod in `backend/src/lib/config.ts`; the backend exits on invalid values)

- `NODE_ENV` (development | test | production)
- `PORT` (default 4000)
- `FRONTEND_URL` (origin allowed by CORS, default http://localhost:3000)

**frontend/.env.local**

- `NEXT_PUBLIC_API_URL` (Express API base URL)
