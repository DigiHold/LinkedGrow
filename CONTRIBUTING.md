# Contributing

## Running it locally

The app is a Next.js 16 project at the root, the worker is a Node 24 project under `worker/`, and both talk to the same database. Locally that database is a SQLite file.

```
npm install
cp .env.example .env.local
```

In `.env.local`, add `TURSO_DATABASE_URL=file:linkedgrow.db`, plus `AUTH_SECRET` and `ENCRYPTION_KEY` from `openssl rand -hex 32` each. The container generates those 2 for itself, and `npm run dev` has no container to generate them in. Leave `APP_URL` out and the dev server answers on whatever address you open it at, which is what a self hosted instance does. Then:

```
npm run db:migrate
npm run dev
```

The worker needs Google Chrome, or Chromium with `CHROME_PATH` pointing at the binary:

```
cd worker && npm install && npx patchright install chrome && cp .env.example .env && npm run worker
```

In `worker/.env`, point `TURSO_DATABASE_URL` at the same file (`file:../linkedgrow.db`) and paste the same `ENCRYPTION_KEY` as the app; the worker cannot read a credential encrypted with a different one.

## The stack from this checkout

The compose file pulls the published images, so a checkout that should run its own code adds the build override:

```
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

It replaces the 2 images with a build of the working tree and keeps everything else. `./install.sh --source` runs the same 2 files, and a `docker-compose.override.yml` next to them holds the tweaks that belong to your machine only, such as `platform: linux/amd64` for the worker on Apple Silicon; it is gitignored.

## Tests and the build gate

```
npm test
npm run test:e2e
cd worker && npm run typecheck && npm test
npx next build
```

`npm test` runs the unit tests of the app and of `shared/`. `npm run test:e2e` drives the setup wizard in a browser on its own production server, so run `npx next build` before it. The worker has its own typecheck and tests. A pull request must pass all of them. There is no lint step; the build is the gate.

## Code style

TypeScript strict, no `any`, no `@ts-ignore`, no `console.log`, no TODO left behind. Validation in API routes is manual and every query on user data carries the owner in its WHERE clause. No em dashes anywhere, in code or in copy. Match the nearest file of the same kind before writing a new one. No new dependency without a discussion in an issue first.

## Database changes

There are no generated migrations and no `drizzle-kit`. Add a numbered file under `docker/migrations/`, after the last one (for example `003_add_column.sql`), with one statement per line ending in a semicolon and comment lines starting with `--`. The runner records each file in `schema_migrations` and applies it once, as a single batch, so a failure leaves nothing half applied. Update `src/lib/db/schema.ts` in the same commit. The app container applies new files when it starts, and `npm run db:migrate` does the same locally.

## Pull requests

Keep pull requests small and focused. Say what changed and how you tested it, and add a screenshot for anything visual.
