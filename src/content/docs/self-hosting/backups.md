---
title: Backups
description: The 4 volumes that hold everything, the one holding the encryption key, one command to archive them, and how to restore on a new server
category: self-hosting
order: 9
---

## What to back up

4 Docker volumes hold everything the stack knows: `db-data` is the database, `uploads` holds the files attached to posts, `profiles` holds the signed in Chrome profile of each LinkedIn account, and `config` holds the 2 secrets the app generated on its first start. Compose names them with the project prefix, `linkedgrow_db-data` and so on for a stack installed in `/opt/linkedgrow`; `docker volume ls` shows the real names on your host.

`config` is the one to be careful about. It holds `secrets.env`, and inside it the `ENCRYPTION_KEY` every stored credential in the database was encrypted with: the LinkedIn passwords, the 2FA secrets, the AI key, the proxy supplier key, the email password, the S3 keys. A database restored next to a different key is unreadable, with no way to recover it, so a backup that skips `config` is not a backup. It is small, it never changes after the first start, and it belongs somewhere the server is not.

A `.env` next to the compose file, if you wrote one, is worth keeping too. Nothing secret is in it any more, only choices such as the pinned version and the domain.

## Archive the volumes

Stop the stack first, so the database is not written while it is copied, then run one container that mounts the 3 volumes and the current folder:

```
docker compose stop
docker run --rm -v linkedgrow_db-data:/db -v linkedgrow_uploads:/uploads -v linkedgrow_profiles:/profiles -v linkedgrow_config:/config -v "$PWD":/backup alpine tar czf /backup/linkedgrow-backup.tgz /db /uploads /profiles /config
docker compose start
```

The archive lands in the current folder as `linkedgrow-backup.tgz`, and it now carries your encryption key, so treat it as a secret and store it accordingly. Move it off the server with your usual tool, and put the 3 commands in a cron entry if you want it to happen every night. A stop and start takes about a minute, during which the app answers nothing, so pick a quiet hour in the instance timezone.

## Restore

On the new server, install the stack as usual, start it once so the volumes exist, then stop it and unpack the archive over them:

```
docker compose down
docker run --rm -v linkedgrow_db-data:/db -v linkedgrow_uploads:/uploads -v linkedgrow_profiles:/profiles -v linkedgrow_config:/config -v "$PWD":/backup alpine sh -c "cd / && tar xzf /backup/linkedgrow-backup.tgz"
docker compose up -d
```

The `config` volume in the archive overwrites the secrets the new install generated for itself, so the restored database opens with the key it was written with. When you have the old `ENCRYPTION_KEY` written down but not the volume, put it in a `.env` next to the compose file instead: a value in the environment wins over the generated file, and the app reads yours.

The app applies any migration the archived database is missing when it starts, so a backup from an older release restores into a newer one. Dedicated addresses live at the proxy supplier, not on the server, so a restore on a new machine keeps every LinkedIn account on the address it always had. If the new server has a different public IP, add it to the Proxy-Seller allowlist before the worker needs to buy or renew anything.
