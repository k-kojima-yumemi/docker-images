FROM public.ecr.aws/docker/library/node:24-slim AS base
COPY package*.json tsconfig.json /app/

FROM base AS builder
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

FROM base AS deps
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 --chown=nonroot:nonroot /lambda-adapter /opt/extensions/lambda-adapter
COPY --chown=nonroot:nonroot package.json /app/package.json
COPY --from=deps --chown=nonroot:nonroot /app/node_modules /app/node_modules
COPY --from=builder --chown=nonroot:nonroot /app/dist /app/dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["dist/index.cjs"]
