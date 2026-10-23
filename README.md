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

| Command                                                    | What it does                               |
| ---------------------------------------------------------- | ------------------------------------------ |
| `npm run build`                                            | Build shared, backend (`tsc`) and frontend |
| `npm run build:backend`                                    | Build only shared and the backend          |
| `npm run start -w @portfolio/backend`                      | Run the built backend                      |
| `npm run prisma:migrate -w @portfolio/backend -- --name x` | Create and apply a migration (dev)         |
| `npm run prisma:deploy -w @portfolio/backend`              | Apply pending migrations (production)      |
| `npm run db:seed -w @portfolio/backend`                    | Seed a sample user and profile             |
| `npm run typecheck`                                        | Type-check all workspaces                  |
| `npm run lint`                                             | ESLint                                     |
| `npm run format` / `npm run format:check`                  | Prettier                                   |

## Environment variables

**backend/.env** (validated with Zod in `backend/src/lib/config.ts`; the backend exits on invalid values)

- `NODE_ENV` (development | test | production)
- `PORT` (default 4000)
- `FRONTEND_URL` (origin allowed by CORS, default http://localhost:3000)
- `DATABASE_URL` (Neon pooled connection string, used by the app)
- `DIRECT_URL` (Neon direct connection string, used by Prisma migrations)
- `JWT_SECRET` (32+ characters; generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
- `JWT_EXPIRES_IN` (number + unit, e.g. `7d`; default `7d`)

**frontend/.env.local**

- `NEXT_PUBLIC_API_URL` (Express API base URL)

## Deploy

**Backend on Render** (installs only `shared` and `backend`, not the frontend's dependencies):

| Setting       | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Build command | `npm ci --include=dev -w @portfolio/shared -w @portfolio/backend && npm run build:backend` |
| Start command | `npm run prisma:deploy -w @portfolio/backend && npm run start -w @portfolio/backend`       |
| Env vars      | everything under **backend/.env** above, with `NODE_ENV=production`                        |

`--include=dev` is required: Render sets `NODE_ENV=production`, which would otherwise skip the type packages and `prisma` that the build needs.

**Frontend on Vercel**: not set up yet. Note that the frontend build needs `shared` built first (`npm run build:shared`).
