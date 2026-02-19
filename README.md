# Resume Rater

AI-powered resume analyser with a $3 paywall powered by [Dodo Payments](https://dodopayments.com). Upload a resume and job description, get a match score and teaser for free, pay to unlock the full breakdown.

Built with Next.js, Fireworks AI (DeepSeek V3.1), PostgreSQL, and Dodo Payments.

## How It Works

1. User uploads a resume (PDF/DOCX) and a job description
2. AI analyses the resume against the JD and returns a structured report
3. Free users see: match score, summary, top 3 matched/missing keywords
4. Paid users ($3 one-time) see: all keywords, strengths, improvements, detailed technical/experience/education breakdown
5. Payment is handled via Dodo Payments hosted checkout
6. Webhook marks the session as paid in Postgres, full report unlocks instantly

## Prerequisites

- Node.js 22+
- Docker (for PostgreSQL)
- [Fireworks AI](https://fireworks.ai) account and API key
- [Dodo Payments](https://app.dodopayments.com) account (free, test mode)
- [ngrok](https://ngrok.com) (for testing webhooks locally)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd resume-ai-rater-dodo
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `FIREWORKS_API_KEY` | [Fireworks dashboard](https://fireworks.ai) -> Settings -> API Keys |
| `DATABASE_URL` | Pre-filled. Works with the Docker Compose setup below |
| `DODO_PAYMENTS_API_KEY` | [Dodo dashboard](https://app.dodopayments.com) -> Developer -> API Keys (Test Mode) |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` for testing, `live_mode` for production |
| `DODO_PAYMENTS_PRODUCT_ID` | Dodo dashboard -> Products -> Create a $3 one-time product -> copy Product ID |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Dodo dashboard -> Developer -> Webhooks -> create endpoint -> copy Signing Secret |

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres on port **5539** (to avoid clashing with a local Postgres on 5432).

### 4. Run database migration

```bash
npm run db:migrate
```

Creates the `sessions` table.

### 5. Start the dev server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Dodo Payments Setup

### Create a product

1. Go to [Dodo dashboard](https://app.dodopayments.com) -> Products
2. Create a new product: **Single Payment**, **$3 USD**
3. Copy the Product ID into `DODO_PAYMENTS_PRODUCT_ID` in `.env.local`

### Create a webhook endpoint

1. Go to Dodo dashboard -> Developer -> Webhooks
2. Add endpoint: `https://<your-ngrok-url>/api/webhook`
3. Copy the Signing Secret into `DODO_PAYMENTS_WEBHOOK_KEY` in `.env.local`

### Disable Adaptive Currency (for testing)

Go to Dodo dashboard -> Settings -> turn OFF **Adaptive Currency**. This prevents USD being converted to local currency which can cause `PAYMENT_METHOD_UNSUPPORTED` errors in test mode.

## Testing the Payment Flow

### 1. Start ngrok

```bash
ngrok http 3000
```

Copy the forwarding URL (e.g. `https://abc123.ngrok-free.app`).

### 2. Update webhook URL

Go to Dodo dashboard -> Developer -> Webhooks -> edit your endpoint -> set URL to:

```
https://abc123.ngrok-free.app/api/webhook
```

### 3. Test end to end

1. Open [http://localhost:3000](http://localhost:3000)
2. Upload a resume (PDF/DOCX) and a job description
3. Click **Analyse** -- see the partial report with score and teaser
4. Click **Unlock Full Report - $3** -- redirects to Dodo checkout
5. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
6. Payment completes -- redirects back to the app
7. Webhook fires -- session marked as paid in Postgres
8. Full report with all keywords, strengths, improvements, and detailed breakdown is shown

## Project Structure

```
app/
  api/
    analyse/route.ts    -- AI analysis endpoint (Fireworks + DeepSeek V3.1)
    extract/route.ts    -- PDF/DOCX text extraction
    checkout/route.ts   -- Dodo Payments checkout session creation
    webhook/route.ts    -- Dodo Payments webhook (signature verified)
    session/[id]/route.ts -- Returns full or partial report based on paid status
  page.tsx              -- Main page with session recovery from URL params
  layout.tsx            -- Root layout
components/
  ResumeForm.tsx        -- File upload with drag-and-drop
  ReportCard.tsx        -- Renders teaser or full report, unlock button
lib/
  ai.ts                 -- Fireworks AI client and analysis prompt
  db.ts                 -- PostgreSQL connection pool
scripts/
  migrate.js            -- Creates sessions table
docker-compose.yml      -- PostgreSQL (port 5539)
Dockerfile              -- Production multi-stage build
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **AI**: Fireworks AI with DeepSeek V3.1 (674B MoE)
- **Payments**: Dodo Payments (dodopayments SDK)
- **Database**: PostgreSQL 16
- **Text Extraction**: pdf-parse (PDF), mammoth (DOCX)
- **Styling**: Tailwind CSS v4
