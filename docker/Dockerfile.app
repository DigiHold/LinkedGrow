FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-bookworm-slim AS build
WORKDIR /app
# The public address is not known here, and nothing in the build needs it:
# local files are served at relative URLs, and the entrypoint reads APP_URL
# at start. One image runs at any address.
ENV LINKEDGROW_EDITION=self-hosted NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

FROM node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production LINKEDGROW_EDITION=self-hosted NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 STORAGE_ROOT=/data/uploads
# One fixed uid and gid, the same in the worker image: the two share the uploads
# volume, and a system uid picked at build time differs between the two images.
RUN groupadd -g 10001 linkedgrow && useradd -u 10001 -g linkedgrow -d /app -M linkedgrow && mkdir -p /data/uploads && chown -R linkedgrow:linkedgrow /data
COPY --from=build --chown=linkedgrow:linkedgrow /app/.next/standalone ./
COPY --from=build --chown=linkedgrow:linkedgrow /app/.next/static ./.next/static
COPY --from=build --chown=linkedgrow:linkedgrow /app/public ./public
COPY --from=build --chown=linkedgrow:linkedgrow /app/docker/migrations ./docker/migrations
COPY --from=build --chown=linkedgrow:linkedgrow /app/docker/migrate.mjs ./docker/migrate.mjs
COPY --chown=linkedgrow:linkedgrow docker/entrypoint-app.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
USER linkedgrow
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
