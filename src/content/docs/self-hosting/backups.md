---
title: Backups
description: The 3 volumes that hold everything, one command to archive them, and how to restore on a new server
category: self-hosting
order: 9
---

## What to back up

3 Docker volumes hold everything the stack knows: `db-data` is the database, `uploads` holds the files attached to posts and the archived browser sessions, and `profiles` holds the signed in Chrome profile of each LinkedIn account. Compose names them with the project prefix, `linkedgrow_db-data` and so on for a stack installed in `/opt/linkedgrow`; `docker volume ls` shows the real names on your host.

The `.env` file is the fourth thing. Every stored credential is encrypted with its `ENCRYPTION_KEY`, so a database restored next to a different key is unreadable, and a backup without `.env` is not a backup. Keep a copy of it somewhere the volumes are not.

## Archive the volumes

Stop the stack first, so the database is not written while it is copied, then run one container that mounts the 3 volumes and the current folder:

```
docker compose stop
docker run --rm -v linkedgrow_db-data:/db -v linkedgrow_uploads:/uploads -v linkedgrow_profiles:/profiles -v "$PWD":/backup alpine tar czf /backup/linkedgrow-backup.tgz /db /uploads /profiles
docker compose start
```

The archive lands in the current folder as `linkedgrow-backup.tgz`. Move it off the server with your usual tool, and put the 3 commands in a cron entry if you want it to happen every night. A stop and start takes about a minute, during which the app answers nothing, so pick a quiet hour in the instance timezone.

## Restore

On the new server, install the stack as usual with the same `.env`, start it once so the volumes exist, then stop it and unpack the archive into the volumes:

```
docker compose down
docker run --rm -v linkedgrow_db-data:/db -v linkedgrow_uploads:/uploads -v linkedgrow_profiles:/profiles -v "$PWD":/backup alpine sh -c "cd / && tar xzf /backup/linkedgrow-backup.tgz"
docker compose up -d
```

The app applies any migration the archived database is missing when it starts, so a backup from an older release restores into a newer one. Dedicated addresses live at the proxy supplier, not on the server, so a restore on a new machine keeps every LinkedIn account on the address it always had. If the new server has a different public IP, add it to the Proxy-Seller allowlist before the worker needs to buy or renew anything.
