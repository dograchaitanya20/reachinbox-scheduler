# ReachInbox Scheduler

A production-style email scheduler: schedule bulk emails through an API or dashboard, send them at exact times with **BullMQ delayed jobs (no cron)**, enforce per-sender hourly limits, survive restarts without losing or duplicating emails, and alert Slack when a limit is hit.

- **Live app:** https://reachinbox-chaitanya.centralindia.cloudapp.azure.com
- **Demo video:** https://drive.google.com/drive/folders/1l8__9MjoJi2zr2qCVUlcnen-G28MFL5t?usp=sharing
- **Bull-board (login required):** https://reachinbox-chaitanya.centralindia.cloudapp.azure.com/admin/queues
- **Repository:** https://github.com/dograchaitanya20/reachinbox-scheduler
- **Author:** Chaitanya Dogra (B.Tech CSE, Lovely Professional University) — Invited reviewers: `mitrajit`, `Yadav036`

## Stack

| Layer | Tech |
|---|---|
| Backend | TypeScript, Express, BullMQ, ioredis, Prisma, Zod |
| Queue / counters | Redis 7 (AOF persistence, `noeviction`) |
| Database | PostgreSQL 16 |
| Search | Elasticsearch 8 |
| SMTP | Nodemailer + Ethereal (fake SMTP); Mailpit for offline local dev |
| Auth | Google OAuth (Passport), JWT in an httpOnly cookie |
| Notifications | Slack OAuth (incoming webhook) |
| Frontend | Next.js (App Router), Tailwind, TanStack Query, TipTap editor |
| Deploy | Docker Compose on an Azure VM, Caddy for automatic HTTPS |

## Run locally

Requires Node 20+ and Docker.

```bash
# 1. infrastructure (Redis, Postgres, Elasticsearch, Mailpit)
docker compose up -d redis postgres es mailpit

# 2. backend
cd backend
npm install
cp .env.example .env          # fill in the values (see below)
npx prisma migrate deploy
npm run seed                  # creates 3 sender accounts
npm run dev                   # API on :4000
npm run worker                # in a second terminal

# 3. frontend
cd ../frontend
npm install
cp .env.example .env.local    # BACKEND_URL=http://localhost:4000
npm run dev                   # http://localhost:3000
```

Useful scripts: `npm run reindex` (rebuild the Elasticsearch index from Postgres), `npm run typecheck`.

### Ethereal setup

`npm run seed` calls Nodemailer's `createTestAccount()` three times and stores the generated Ethereal SMTP credentials as sender rows (the three senders are used round-robin). The worker logs an Ethereal preview URL for every sent email. Some networks block Ethereal; set `LOCAL_SMTP=1` before seeding to use Mailpit (`localhost:1025`, UI on `:8025`) instead.

### Environment variables (backend)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | default `redis://localhost:6379` |
| `ELASTIC_URL` | default `http://localhost:9200` |
| `PORT` | API port, default 4000 |
| `WORKER_CONCURRENCY` | parallel jobs per worker, default 5 |
| `MIN_DELAY_MS` | minimum gap between sends, default 2000 |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | hourly cap per sender, default 100 |
| `JWT_SECRET` | required, signs session cookies |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Google OAuth |
| `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_REDIRECT_URI` | Slack OAuth |
| `FRONTEND_URL` | CORS origin and post-login redirect |
| `LOCAL_SMTP` | seed script only: use Mailpit instead of Ethereal |

Secrets are never committed; only `.env.example` files are in the repo.

### Production (Azure VM)

`docker-compose.prod.yml` runs postgres, redis, es, a one-shot `migrate` job, `api`, `worker`, `frontend` and `caddy`. Create `.env` (with `PG_PASSWORD`) and `backend/.env.prod`, then `docker compose -f docker-compose.prod.yml up -d --build`. Caddy proxies `/api/*` and `/admin/*` to the API and everything else to the frontend, and obtains the TLS certificate automatically. Only ports 80 and 443 are public.

## Architecture

```
Next.js ──► Express API ──► PostgreSQL  (source of truth)
                │  └──────► Elasticsearch (search index)
                ▼
            BullMQ queue ◄──► Redis (AOF)
                ▼
            Worker(s) ──► Ethereal SMTP
                └──► Slack webhook (rate-limit alerts)
```

**How scheduling works.** `POST /api/schedule` validates the request, de-duplicates recipients, and assigns every email a send time with `plan()`: round-robin across senders, spaced by the requested delay, and spilling into the next hour once a sender's hourly cap is full. Rows are inserted into Postgres in one call, then added to BullMQ with `jobId = email.id` and `delay = scheduledAt - now`. No cron library or OS cron is used anywhere.

**Persistence on restart.** Postgres is the source of truth and Redis runs with AOF, so delayed jobs survive a Redis or worker restart. At worker startup (a one-time step, not a cron) `reconcile()` re-enqueues any `scheduled` row that has no job and frees rows stuck in `sending` for more than 5 minutes.

**Idempotency (no duplicate sends).** The job id equals the email id, so the same email cannot be queued twice. Before sending, the worker atomically claims the row with `UPDATE ... WHERE status = 'scheduled'`; if zero rows change, the job exits. Two workers or a retried job can never both send the same email.

**Concurrency and delay.** The worker runs with `WORKER_CONCURRENCY` parallel jobs and a BullMQ limiter of one job per `MIN_DELAY_MS` (default **2 seconds** between sends, queue-wide). The "delay between emails" field in the UI additionally spaces each sender's emails at schedule time.

**Hourly rate limit.** For each send the worker runs an atomic Redis Lua script on the key `rl:{senderId}:{utcHour}`: if the counter is below `MAX_EMAILS_PER_HOUR_PER_SENDER` it increments and the email sends; otherwise the job is **moved to the start of the next hour window** (plus `seq` milliseconds to preserve order) with `moveToDelayed`. Nothing is dropped or failed. Because the check-and-increment is a single Lua call, it is safe across any number of workers or instances. Rejected jobs do not consume quota.

**Behaviour under load (1000+ emails).** `plan()` spreads them over future hours per sender up front, and the Redis counter acts as the runtime guarantee for overlapping batches. Jobs due at the same moment are processed at the limiter's pace, with ordering preserved by the `seq` offset.

**Slack alerts.** "Connect Slack" runs a real OAuth flow (`incoming-webhook` scope); the webhook URL is stored per user. When a sender hits its cap, a message is posted to the user's channel, once per sender per hour window (Redis `SET NX`). If the user has not connected Slack, nothing is sent and nothing fails; connecting later works immediately, with no redeploy.

**Search.** Emails are indexed in Elasticsearch on creation and updated on every status change. The search implementation leverages multi-match with `phrase_prefix` and wildcard `query_string` (`*query*`) across `subject`, `recipient`, and `body`, ensuring sub-string, unspaced, and partial matches return instantly. Writes to Elasticsearch never block scheduling or sending; `npm run reindex` repairs any drift. The API retries index creation at startup until Elasticsearch is ready.

**Frontend & Scheduling UX.** Built on Next.js 14 App Router with Tailwind CSS, strictly matching the Figma specification across all screens. The composer features:
- Recipient email chips with instant validation, drag-and-drop / file upload for `.csv` and `.txt` files, and dynamic recipient count.
- TipTap rich text editor with clean HTML output.
- **Send Later Picker:** Date and time pickers with a dedicated **"In 4 minutes (Restart test)"** quick preset designed for rapid crash-recovery verification, auto-applied selections, timezone-safe local-to-UTC calculation, and an active countdown banner.
- **Instant Cache Invalidation:** Powered by TanStack Query (`staleTime: 0`) ensuring newly scheduled emails immediately appear in `/scheduled` and counter badges update in real time without stale-cache locks.

## API

All routes except `/api/auth/*` and `/api/slack/callback` require the session cookie. `/admin/queues` (bull-board) is also protected.

| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/google`, `/api/auth/google/callback` | Google login |
| POST | `/api/auth/logout` | clear session |
| GET | `/api/me` | current user |
| POST | `/api/schedule` | `{subject, body (HTML), leads[], startTime, delaySec?, hourlyLimit?, senderId?}` |
| GET | `/api/emails` | scheduled emails; `?status=sent` for sent and failed |
| GET | `/api/emails/:id` | one email with its sender |
| GET | `/api/counts` | sidebar counts |
| GET | `/api/senders` | sender accounts |
| GET | `/api/search?q=` | Elasticsearch fuzzy search |
| GET | `/api/slack/status`, `/api/slack/connect`, `/api/slack/callback` | Slack OAuth |
| DELETE | `/api/slack` | disconnect Slack |

## Features

**Backend:** delayed-job scheduler (no cron), Postgres persistence, restart recovery, idempotent sends, configurable concurrency and send delay, per-sender hourly limit with Redis counters and automatic rescheduling, Slack alerts, Elasticsearch search, bull-board, multiple Ethereal senders.

**Frontend:** Google login, user card with logout, Scheduled and Sent lists with loading, empty and error states, compose page with rich-text editor, recipient chips and CSV/TXT upload (recipient count shown), send-later picker, delay and hourly-limit fields, email detail page (HTML sanitised with DOMPurify), search box, Slack connect/disconnect, toasts.

## Assumptions, shortcuts and trade-offs

- Emails go to Ethereal, a fake SMTP service: nothing reaches real inboxes.
- The rate-limit window is a fixed UTC hour (it starts at :30 past the hour in IST). The worker enforces the global `MAX_EMAILS_PER_HOUR_PER_SENDER`; the per-batch "hourly limit" field affects scheduling only (it is capped by the global value).
- SMTP failures are recorded as `failed` and not retried. If a process dies between SMTP acceptance and the database update, an email can be left in `sending` until the startup recovery runs (at-least-once edge case).
- The Slack webhook URL is stored in plain text; it should be encrypted at rest in a real system.
- Google OAuth is published; Google may show an "unverified app" screen, which can be skipped.
- Attachments, archive and delete from the Figma are not implemented; email/password sign-in is not supported (Google only).
- The API runs through `tsx` in production for parity with development; a compiled build would be the next step.
- No automated tests were written; behaviour was verified manually and through the demo scenarios.
