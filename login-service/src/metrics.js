import client from "prom-client";

// Collect Node.js default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  prefix: "login_service_",
});

// Track request latency and counts for all endpoints
export const httpRequestDuration = new client.Histogram({
  name: "login_service_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["route", "method", "status"],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5],
});

export const httpRequestCount = new client.Counter({
  name: "login_service_http_requests_total",
  help: "Count of total HTTP requests",
  labelNames: ["route", "method", "status"],
});

// ---- Custom authentication metrics ----

// Login metrics
export const loginSuccessCount = new client.Counter({
  name: "login_service_login_success_total",
  help: "Number of successful login requests",
});

export const loginFailureCount = new client.Counter({
  name: "login_service_login_failure_total",
  help: "Number of failed login requests",
});

// Registration metrics
export const registerSuccessCount = new client.Counter({
  name: "login_service_register_success_total",
  help: "Number of successful registration requests",
});

export const registerFailureCount = new client.Counter({
  name: "login_service_register_failure_total",
  help: "Number of failed registration requests",
});

// Endpoint to expose all collected metrics
export async function getMetrics(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
}
