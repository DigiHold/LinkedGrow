---
title: Updating
description: One command to pull the current images and restart, what the tags mean, pinning a version, and the migrations that run at boot
category: self-hosting
order: 4
---

Take a [backup](/docs/self-hosting/backups) before an update that changes the database. The changelog says when a release does.

## Update

```
cd /opt/linkedgrow && ./install.sh update
```

That pulls the images for the tag in `.env` and replaces the running containers, keeping `.env` and the 3 volumes. By hand it is the same 2 commands:

```
docker compose pull && docker compose up -d
```

Expect a minute or 2 during which the app answers nothing. The worker restarts as well, so whatever a browser was doing at that moment stops, and the agent starts again on its next pass.

## The tags

Every push to the main branch publishes `ghcr.io/digihold/linkedgrow` and `ghcr.io/digihold/linkedgrow-worker`, and both carry the same 3 kinds of tag.

| Tag | What it points at |
| --- | --- |
| `latest` | The newest build of the main branch, which is what a fresh install runs. |
| `v1.0.0` and `v1.0` | A release. The shorter tag moves forward with each patch release. |
| `sha-1a2b3c4` | One exact commit, which never moves. |

Release tags are also built for arm64. `latest` is built for amd64 only, so an arm64 host runs a release tag or [builds from source](/docs/self-hosting/install).

## Pin a version

Set the tag in `.env` and the stack stops following the main branch:

```
LINKEDGROW_VERSION=v1.0.0
```

Then `docker compose up -d`, or `./install.sh update`, which keeps whatever is already written there. Going back to a previous release is the same edit with the older tag, so nothing has to be rebuilt on the server. The installer also takes `--version v1.0.0` and writes the line for you.

## Migrations run at boot

Database changes ship as numbered SQL files inside the app image. When the container starts, it applies every file that is not yet recorded in the `schema_migrations` table, in order, before the server accepts a request. Each file runs as one batch, so a failure leaves nothing half applied, and the log says what happened:

```
docker compose logs app | grep migration
```

You will see `applying migrations` followed by `applied 1 migration(s): 003_add_column`, or `applied 0 migration(s): none` when there is nothing to do. The worker waits for the app's health check, which only passes once the migrations are through, so it never runs against a database that is behind the code.

Migrations are not undone by going back to an older tag. A release that added a column leaves it in place, and older code ignores columns it does not know, which is why most rollbacks are safe. A release that changed the shape of an existing table is the exception, and going back across one means restoring the database volume from the backup taken before the update.
