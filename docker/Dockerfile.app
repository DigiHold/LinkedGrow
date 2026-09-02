FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-bookworm-slim AS build
WORKDIR /app
# The public origin is baked into the browser bundle and into next/image's
# allowed hosts, so the build has to know it. Compose passes APP_URL from .env.
ARG APP_URL=http://localhost:3000
ENV LINKEDGROW_EDITION=self-hosted NEXT_TELEMETRY_DISABLED=1 APP_URL=$APP_URL NEXT_PUBLIC_APP_URL=$APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build

FROM node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production LINKEDGROW_EDITION=self-hosted NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 STORAGE_ROOT=/data/uploads
RUN groupadd -r linkedgrow && useradd -r -g linkedgrow -d /app linkedgrow && mkdir -p /data/uploads && chown -R linkedgrow:linkedgrow /data
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
