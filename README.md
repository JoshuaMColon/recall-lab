# Recall Lab

A study lab for **WGU D335 – Introduction to Programming in Python**. It quizzes you objective by objective, grades code by actually running it, schedules reviews with spaced repetition, and shows how ready you are for the objective assessment (OA).

**Live:** https://recall-lab-ruby.vercel.app · **Guest demo:** [/demo](https://recall-lab-ruby.vercel.app/demo) (no sign-up; guest data is deleted after a day)

> Recall Lab is an independent study tool. It is not affiliated with or endorsed by WGU or zyBooks. Every question, explanation and objective summary here is original. The objective list paraphrases the publicly described course competencies; it is not official course material.

## What it does

- **304 original questions** across 11 objectives, in four types:
  - **Multiple choice**: concept checks.
  - **Predict the output**: type exactly what a program prints. Grading is exact, with partial credit and a note when only spacing differs.
  - **Find the bug**: pick the faulty line. The feedback shows the fix and what each version prints.
  - **Write the code**: your program runs in **Pyodide (CPython compiled to WebAssembly) in a Web Worker**, against visible and hidden stdin/stdout tests. Infinite loops time out, and each run gets a fresh namespace.
- **Instant feedback** on every answer: an explanation, the correct answer, and a test table for code.
- **Topic, objective or mixed quizzes.** Mixed sets lean on weak objectives, and anything due for review comes first.
- **Spaced repetition (SM-2)** for each question. Misses come back within minutes; known questions drift out to days and then weeks.
- **Mastery dashboard** mapped to the course objectives. It shows a recency-weighted accuracy × confidence score per objective, levels from *Not started* to *Mastered*, weak areas with one-click drills, and a readiness gauge weighted like the mock OA.
- **Timed mock OA**: 25 questions in 60 minutes, apportioned by objective weight, with four coding tasks. It gives no feedback until you submit, supports flagging and a question navigator, submits itself when time runs out, and breaks results down by objective. It is Recall Lab's own format and does not claim to mirror the real OA.
- **Optional AI extras**: a hint, an "explain my mistake" note (streamed), and "one more like this" generated questions. They sit behind hard caps. See below.
- **Accounts or guest mode**: email sign-up (Supabase Auth), or `/demo` for an anonymous guest session.
- **Light and dark themes**: "lab notebook" (paper, ink, highlighter) and "chalkboard". Every button has a tooltip, every press gives visible feedback, and the app is responsive and keyboard friendly. Axe is checked in CI.

## The app is $0, and it works with no AI

The app runs fully **without AI**: the committed question bank, the deterministic grading and the in-browser Python need no AI at all. AI is a small optional extra, and every layer is built so it can never cost money:

| Safeguard | Where |
| --- | --- |
| AI goes through **Vercel AI Gateway** using **OIDC** (no API key is stored anywhere). On a team with no payment method, the Gateway's free monthly credit simply runs out and returns 429; it cannot bill. **Never add a card or buy Gateway credits or enable auto top-up for this project.** | Vercel |
| A cheap, small model (`google/gemini-2.5-flash-lite`, fallback `openai/gpt-4.1-nano`) with small token limits (900 tokens to generate, 150 for a hint, 400 for an explanation) and truncated inputs | `api/` |
| **Per-user daily caps**: guests get 3 AI requests a day and accounts get 20. A **global cap** of 150 requests a day applies to the whole app, plus a 4-second burst gap. Postgres enforces them atomically *before* any model call (`study_ai_consume`). | `supabase/migrations` |
| Every AI route requires a verified Supabase session | `api/_shared.ts` |
| Hints and explanations are cached per question and answer, and generated questions are saved and reused before a new one is requested | `study.ai_notes`, `study.ai_questions` |
| Generated questions are **verified by running them** in Pyodide before they are saved: the output is computed, not trusted; bug fixes must change the output; the solution must pass its own tests and the starter must fail them | `src/lib/ai.ts` |
| **Kill switch**: set `AI_DISABLED=1` on the Vercel project and all AI routes return 503, while the rest of the app carries on | Vercel env |
| Graceful degradation: quota, rate-limit and outage errors show a calm message and the AI buttons simply do nothing more | UI |

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 · Vercel Functions (`/api`) with the AI SDK (structured output validated with zod, and streaming text) · Supabase (Postgres, Auth, RLS) · Pyodide · Vitest · Playwright + axe · GitHub Actions.

## Data model

Everything lives in a dedicated **`study`** schema in Supabase. It is not exposed directly; the client reaches it through `public.study_*` views created with `security_invoker`, so RLS still applies.

- `courses`, `objectives`: a seeded catalogue, ready for more courses (D335 is the first).
- `attempts`, `review_state` (SM-2 state per user and question), `mock_sessions`.
- `ai_questions`, `ai_notes`: the AI cache.
- `ai_usage`, `ai_usage_global`: daily counters, written only by `SECURITY DEFINER` functions.

Row-level security is on for every table, with owner-only policies (`user_id = auth.uid()`). Anonymous (guest) users are removed after a day by the project's existing cleanup job, and their rows cascade. A daily cron job prunes old usage counters.

The Supabase security advisor flags two things that are **intentional**:
- *RLS enabled, no policy* on `ai_usage*`: no client may read or write them directly.
- *SECURITY DEFINER function executable by authenticated*: `study_ai_quota` and `study_ai_consume` must be callable, and they only touch the caller's own counter.

The question bank is plain JSON (`src/data/d335.json`), generated from `scripts/bank/*.py` (`npm run bank`). `src/lib/bank.test.ts` loads Pyodide in Node and proves that every answer is right: outputs match real Python, bug fixes change the output, solutions pass and starters fail.

## Run it locally

```bash
npm ci
npm run dev          # copies Pyodide into public/ and starts Vite
```

Leave `.env` empty to run in **local mode**: no accounts and no AI, with progress saved in `localStorage`. CI and the end-to-end tests use local mode. For cloud mode, copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key. AI only works on Vercel, where OIDC is available, or through `vercel dev`.

```bash
npm run typecheck && npm run lint
npm test             # unit tests + question-bank verification under Pyodide
npm run test:e2e     # Playwright + axe, desktop and mobile, light and dark
```

## Adding a course

Add rows to `study.courses` and `study.objectives`, write a bank JSON with the same shape as `d335.json`, and load it in `src/lib/bank.ts`. Grading, spaced repetition, mastery and the mock OA are all course-agnostic.
