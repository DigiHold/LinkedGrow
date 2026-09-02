# LinkedGrow, contributor manual

This checkout pushes to git@github.com:DigiHold/LinkedGrow.git only.

## What this repo is

The self hosted edition of LinkedGrow: AI agents that find leads and clients on LinkedIn from a real Chrome signed in to the user's own account, plus the posting tools (generator, editor, calendar, carousels, analytics), and it holds product code only. The hosted service at linkedgrow.ai lives in a private repo that merges from this one, so nothing about billing, marketing pages or the hosted operation belongs here, and a feature lands here first.

## The two editions

`LINKEDGROW_EDITION` selects the edition at build time and at run time: `self-hosted` (the default) or `cloud`. `src/lib/edition.ts` normalises the flag, exports `isSelfHosted()` and `isCloud()`, and refuses to boot when cloud secrets are present under the wrong value. The self hosted edition reads its configuration from the `instance_settings` row that the first login wizard at `/setup` writes: the AI key for the agents, the proxy supplier, email, storage. Every feature is unlocked, the first account is the administrator, and sign ups can be closed from the wizard or from Settings, Instance. Code that only makes sense for one edition is guarded with the two helpers, never with a copy of the check.

## Stack

Next.js 16 (App Router, Turbopack, React server components), TypeScript 5.9 with `strict: true` and the `@/*` alias for `src/*`, Tailwind CSS v4 with shadcn/ui, NextAuth v5, libSQL through Drizzle ORM (the schema file is types only), a Node 24 worker under `worker/` that drives Chrome with Patchright, and a Docker Compose stack described by `docker-compose.yml` and `docker/`. The app and the worker share `shared/` (the AI client and the model tables), which has no imports of its own so both can load it.

There is no LinkedIn API in this product. Everything on LinkedIn happens in the worker's browser, at a human pace, on one dedicated address per account. The app queues work in the database and reads state back; the worker does the work.

## Run and test

```
npm install
cp .env.example .env.local          # add TURSO_DATABASE_URL=file:linkedgrow.db, APP_URL, AUTH_SECRET, ENCRYPTION_KEY
npm run db:migrate
npm run dev
cd worker && npm install && npx patchright install chrome && cp .env.example .env && npm run worker
```

```
npm test                                  # unit tests of the app and shared/
npx next build && npm run test:e2e        # the setup wizard in a browser, on its own server
cd worker && npm run typecheck && npm test
```

`npx next build` is the only automated gate. There is no lint step and no typecheck script for the app; if the build passes, the code ships.

## Hard rules

1. No em dashes anywhere: code, copy, commit messages, docs. Restructure the sentence instead.
2. TypeScript strict. No `any`, no `@ts-ignore`, no `console.log`, no TODO in delivered code.
3. Validation in API routes is manual: presence, type, max length, `if (!field || field.length > MAX) return 400`. No schema validation library.
4. Ownership lives in the WHERE clause: `eq(table.userId, session.user.id)` on every read, update and delete of user data, never a separate check after the fetch.
5. No `drizzle-kit` and no generated migrations. A schema change is a numbered SQL file in `docker/migrations/` (`003_add_column.sql`, one statement per line, comments with `--`) plus the matching edit in `src/lib/db/schema.ts`, in the same commit. The runner records each file in `schema_migrations` and applies it once.
6. No new dependency without a discussion in an issue first. The stack is deliberately small.
7. Copy the nearest neighbour. Before writing a new file of any type, open the newest file of the same type and match its structure, imports and class strings.
8. Next 16 shapes: route params are a Promise (`{ params }: { params: Promise<{ id: string }> }`, then `await params`), the middleware is `src/proxy.ts` (never create `middleware.ts`), `useSearchParams()` sits in an inner component under `<Suspense>`, and the Tailwind v4 gradient syntax is `bg-linear-to-r`.
9. Every visual class pairs with its `dark:` variant. Tailwind utilities only, no inline styles.
10. Commits carry a lowercase prefix (`feat:`, `fix:`, `docs:`, `chore:`) and no attribution lines.

## Key paths

```
src/app/(auth)/            sign in, sign up, forgot password
src/app/(dashboard)/       every app page, under /dashboard
src/app/api/               routes: auth, ai, posts, linkedin, agents, media, setup, v1, mcp, health
src/app/setup/             the first login wizard
src/lib/                   auth, plans, rate-limit, encryption, instance-settings, storage/, proxy/, db/
src/content/docs/          the documentation rendered at /docs, one folder per category
shared/                    the AI client and model tables, imported by the app and the worker
worker/                    the browser plane: worker.ts loops, linkedin/, browser/, safety/, publish/, proxy/
docker/                    the two Dockerfiles, the entrypoints, migrate.mjs and migrations/
```

## Security bar for a route

- `await auth()` first and a 401 without a session. A deliberately public route is listed in `publicApiPrefixes` in `src/proxy.ts`; never add an authenticated prefix there.
- Ownership in the WHERE clause of every query on user data.
- Every input validated. Emails `.toLowerCase().trim()` plus a format check. User URLs parsed with `new URL()` and checked against a hostname and protocol allowlist, with localhost and private ranges blocked.
- Rate limiting from `src/lib/rate-limit.ts`: keyed by IP on public endpoints, by user on expensive ones.
- No secret, token, key or password in any response or log line. Encrypted fields are decrypted only where they are used.
- Admin routes check `session.user.isAdmin`. Errors return `{ error }` with the right status, and the body sits in a try/catch.
- `npx next build` passes before the commit.

## Prose rules for docs and copy

Documentation lives in `src/content/docs/<category>/*.md` with `title`, `description`, `category` and `order` in the frontmatter and a `_category.json` per folder; the tree is built by `src/lib/docs.ts`. Read the code before describing a feature, and describe what it does today. Write plain, specific sentences: no em or en dashes, no hyphenated compounds ("self hosted", "sign ups", "real time"), numerals always, sentence case headings, commas and periods outside closing quotes, no sentence under 6 words, no marketing vocabulary and no hype. When a fact is missing, leave it out rather than guess.
