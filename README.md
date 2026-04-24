# Khata — Digital Kameti / ROSCA

**Khata** is a full-stack web app that digitizes the traditional *kameti* (rotating savings and credit association) workflow: creating committees, tracking contributions, and managing fair payouts—without the spreadsheets, group chats, and manual errors that make informal ROSCAs hard to run at scale.

## Why it exists

Committees (*BCs / kametis*) are still coordinated manually: someone tracks who paid, who is due, and who receives the pot next. **Khata** gives admins and members a clear dashboard, mock OTP sign-in for demos, and a structured data model (cycles, contributions, payouts) so the group’s money story stays transparent.

## Live demo

| Layer    | URL |
|----------|-----|
| Frontend | [https://pakkameti.netlify.app](https://pakkameti.netlify.app) |
| Backend  | [https://rosca-micathon.onrender.com](https://rosca-micathon.onrender.com) |

The API is served under `/api` (e.g. [`/api/health`](https://rosca-micathon.onrender.com/api/health) on the live backend).

## Tech stack

- **Frontend:** React 19, Vite, TypeScript, TanStack Router, Tailwind CSS  
- **Backend:** Node.js, Express 5, Zod  
- **Data:** PostgreSQL, Prisma ORM  

## Repository layout

```text
rosca/
  backend/      # Express API + Prisma
  kameti-pool/  # Vite + React client
```

## Local setup

### Prerequisites

- Node.js 20+ and npm  
- PostgreSQL 14+ (local or Docker)  
- A Unix-like shell; on **Arch Linux**, the Postgres service is often `postgresql` (see troubleshooting below)  

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set a valid `DATABASE_URL` and `PORT` (e.g. `4000`). For a default local database named `kameti_db` with user `postgres` and password `postgres`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kameti_db?schema=public"
PORT=4000
```

Sync the schema to your database and (optionally) seed:

```bash
npx prisma db push
npm run prisma:seed   # optional
npm run dev
```

The API base URL is `http://localhost:4000` and routes are mounted at **`/api`**.

### 2. Frontend

```bash
cd kameti-pool
cp .env.example .env
```

Set the API base (bare origin is fine—the client normalizes to `/api`):

```env
VITE_API_URL=http://localhost:4000
```

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Arch Linux: Postgres not running or wrong password

If `npx prisma db push` fails with connection or authentication errors:

1. Start PostgreSQL (often requires `sudo`):

   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql   # optional, start on boot
   ```

2. Set the `postgres` user password and create the database (adjust if you use a different superuser):

   ```bash
   sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
   sudo -u postgres createdb kameti_db
   ```

3. Retry from `backend/`:

   ```bash
   npx prisma db push
   ```

## Environment variables (summary)

| Location | Variable | Purpose |
|----------|----------|---------|
| `backend/.env` | `DATABASE_URL` | Prisma / Postgres connection string |
| `backend/.env` | `PORT` | HTTP port for the API |
| `kameti-pool/.env` | `VITE_API_URL` | API origin for the Vite app (e.g. `http://localhost:4000` or production base URL) |

**Note:** Do not commit real `.env` files; they are listed in `.gitignore`.

## Development scripts (quick reference)

| Where | Command | Description |
|-------|---------|-------------|
| `backend` | `npm run dev` | API with hot reload |
| `backend` | `npx prisma studio` | Browse DB in the browser (from `backend` or use repo `npm run db:studio` if configured) |
| `kameti-pool` | `npm run dev` | Vite dev server |
| `kameti-pool` | `npm run build` | Production static build for Netlify |

## License

Project submitted as a hackathon / educational MVP; adjust licensing as needed for your team.
