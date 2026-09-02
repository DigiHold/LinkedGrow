---
title: Updating
description: Pull the new version, rebuild the images, let the migrations run at boot, and go back to a previous tag when needed
category: self-hosting
order: 4
---

Take a [backup](/docs/self-hosting/backups) before an update that changes the database. The changelog says when a release does.

## Update

```
cd LinkedGrow
git pull
docker compose up -d --build
```

Compose rebuilds the app and worker images from the new code and replaces the running containers. Expect a minute or 2 during which the app answers nothing. The worker restarts as well, so whatever a browser was doing at that moment stops, and the agent starts again on its next pass.

## Migrations run at boot

Database changes ship as numbered SQL files in `docker/migrations/`. When the app container starts, it applies every file that is not yet recorded in the `schema_migrations` table, in order, before the server accepts a request. Each file runs as one batch, so a failure leaves nothing half applied, and the log says what happened:

```
docker compose logs app | grep migration
```

You will see `applying migrations` followed by `applied 1 migration(s): 003_add_column`, or `applied 0 migration(s): none` when there is nothing to do. The worker waits for the app's health check, which only passes once the migrations are through, so it never runs against a database that is behind the code.

## Roll back

Releases are git tags. To go back to the previous one, check it out and rebuild:

```
git tag
git checkout v1.0.0
docker compose up -d --build
```

Migrations are not undone by a rollback. A release that added a column leaves it in place, and older code ignores columns it does not know, which is why most rollbacks are safe. A release that changed the shape of an existing table is the exception: going back across it means restoring the database volume from the backup taken before the update. Return to the latest code later with `git checkout main` and the same `up` command.

## Pin a version

If you prefer to update on your own schedule, check out a tag instead of `main` and pull only when you decide to. Nothing in the stack updates itself, and the images are built on your server from the checked out code.
