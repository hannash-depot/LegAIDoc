import { getClientIp } from "@/lib/security/rate-limit";

type LogLevel = "info" | "warn" | "error";

type MonitoringContext = Record<string, unknown>;

interface RequestContext extends MonitoringContext {
  requestId: string;
  route: string;
  method: string;
  path: string;
  ip: string;
}

function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function log(level: LogLevel, event: string, context: MonitoringContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: "legaidoc",
    ...context,
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function buildRequestContext(
  request: Request,
  route: string
): RequestContext {
  const url = new URL(request.url);
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id") ??
    crypto.randomUUID();

  return {
    requestId,
    route,
    method: request.method,
    path: url.pathname,
    ip: getClientIp(request),
  };
}

export function logApiInfo(event: string, context: MonitoringContext = {}) {
  log("info", event, context);
}

export function logApiWarn(event: string, context: MonitoringContext = {}) {
  log("warn", event, context);
}

export async function logApiError(
  event: string,
  error: unknown,
  context: MonitoringContext = {}
) {
  const payload = {
    ...context,
    error: sanitizeError(error),
  };
  log("error", event, payload);
  await sendAlert(event, payload);
}

async function sendAlert(event: string, payload: MonitoringContext) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        source: "legaidoc",
        payload,
      }),
    });
  } catch (error) {
    // Avoid recursive alert failures; log once as warning.
    log("warn", "monitoring.alert_failed", {
      alertEvent: event,
      error: sanitizeError(error),
    });
  }
}
