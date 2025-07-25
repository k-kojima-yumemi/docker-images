# Base stage for build and dependencies
FROM public.ecr.aws/docker/library/node:22-slim AS base
# Copy package files
COPY package*.json /app/

# Dependencies stage
FROM base AS deps
# Set working directory
WORKDIR /app
# Install prod dependencies
RUN npm ci --omit=dev

# Runtime stage
FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# Set working directory
WORKDIR /app
# Copy AWS Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 --chown=nonroot:nonroot /lambda-adapter /opt/extensions/lambda-adapter
# Copy package.json and dependencies for runtime
COPY --chown=nonroot:nonroot package.json /app/package.json
COPY --from=deps --chown=nonroot:nonroot /app/node_modules /app/node_modules
# Copy built application
COPY --chown=nonroot:nonroot ./src /app/dist

# Set environment variables for Lambda
ENV NODE_ENV=production
ENV PORT=8080
ENV LOG_LEVEL=info
# Expose port (for documentation purposes)
EXPOSE 8080
LABEL org.opencontainers.image.source=https://github.com/k-kojima-yumemi/ecs-initial-image
# Start the server
CMD ["dist/main.mjs"]
