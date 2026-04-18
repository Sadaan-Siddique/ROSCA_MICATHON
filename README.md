# ROSCA MVP (Pakistan Committee App)

Mobile-first MVP for a ROSCA/committee workflow using:
- Backend: Express + Prisma + PostgreSQL
- Frontend: React + Vite + TypeScript
- Auth: OTP mock

## Project structure

```txt
rosca/
  backend/
    prisma/
      schema.prisma
      seed.ts
    src/
      config/env.ts
      lib/prisma.ts
      middlewares/errorHandler.ts
      routes/index.ts
      services/notificationService.ts
      app.ts
      server.ts
  frontend/
    src/
      api/client.ts
      components/Layout.tsx
      pages/
        DashboardPage.tsx
        CreateCommitteePage.tsx
        CommitteeDetailPage.tsx
      types/index.ts
      App.tsx
      main.tsx
      index.css
```

## 1) Backend setup

1. Go to backend:
   - `cd backend`
2. Create env file:
   - `cp .env.example .env`
3. Add your PostgreSQL connection in `.env`:
   - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rosca_mvp?schema=public"`
4. Run migrations and generate Prisma client:
   - `npm run prisma:migrate -- --name init`
   - `npm run prisma:generate`
5. Seed sample data:
   - `npm run prisma:seed`
6. Start backend:
   - `npm run dev`

Backend runs on `http://localhost:4000`.

## 2) Frontend setup

1. Go to frontend:
   - `cd frontend`
2. Create env file:
   - `cp .env.example .env`
3. (Optional) set `VITE_USER_ID` to a seeded user id
4. Start frontend:
   - `npm run dev`

Frontend runs on `http://localhost:5173`.

## 3) API examples

### Mock OTP signup/login

```bash
curl -X POST http://localhost:4000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+923001111111"}'
```

```bash
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+923001111111","otp":"1234","name":"Ali Khan"}'
```

### Create committee

```bash
curl -X POST http://localhost:4000/api/committees \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Office Committee",
    "contributionAmount":5000,
    "cycleLength":5,
    "frequency":"MONTHLY",
    "adminId":"<USER_ID>",
    "startDate":"2026-04-20T00:00:00.000Z",
    "payoutType":"FIXED"
  }'
```

### Join committee

```bash
curl -X POST http://localhost:4000/api/committees/<COMMITTEE_ID>/join \
  -H "Content-Type: application/json" \
  -d '{"userId":"<USER_ID>","inviteCode":"<INVITE_CODE>"}'
```

### Generate contributions for cycle

```bash
curl -X POST http://localhost:4000/api/committees/<COMMITTEE_ID>/cycles/1/contributions/generate
```

### Mark contribution paid

```bash
curl -X PATCH http://localhost:4000/api/contributions/<CONTRIBUTION_ID>/pay
```

### Assign payout for cycle

```bash
curl -X POST http://localhost:4000/api/committees/<COMMITTEE_ID>/cycles/1/payouts/assign
```

### Dashboard

```bash
curl http://localhost:4000/api/dashboard/<USER_ID>
```
