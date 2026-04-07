import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("hono-otel-template");
