# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl dumb-init \
  && curl --fail --location --silent --show-error \
    https://github.com/yt-dlp/yt-dlp/releases/download/2026.06.09/yt-dlp_linux \
    --output /usr/local/bin/yt-dlp \
  && echo "bf8aac79b72287a6d2043074415132558b43743a8f9461a22b0141e90f16ce66  /usr/local/bin/yt-dlp" | sha256sum --check --strict \
  && chmod 0755 /usr/local/bin/yt-dlp \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 worker \
  && useradd --system --uid 1001 --gid worker --create-home worker
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src/types ./src/types
COPY src/lib/domain ./src/lib/domain
COPY worker ./worker
RUN mkdir -p /tmp/scene-forge && chown -R worker:worker /app /tmp/scene-forge
USER worker
ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/tsx", "worker/index.ts"]
