type LogLevel = 'error' | 'warn' | 'info';

interface TelemetryEvent {
  context: string;
  message: string;
  level: LogLevel;
  error?: unknown;
  extra?: Record<string, unknown>;
}

function formatMessage(event: TelemetryEvent): string {
  return `[${event.context}] ${event.message}`;
}

function sendToSentry(event: TelemetryEvent): void {
  const Sentry = (globalThis as Record<string, unknown>).Sentry as
    | { captureException: (err: unknown, opts?: unknown) => void; captureMessage: (msg: string, level?: string) => void }
    | undefined;

  if (!Sentry) return;

  if (event.error) {
    Sentry.captureException(event.error, { extra: { context: event.context, ...event.extra } });
  } else {
    Sentry.captureMessage(formatMessage(event), event.level);
  }
}

export function logError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(formatMessage({ context, message, level: 'error', error, extra }), error);
  sendToSentry({ context, message, level: 'error', error, extra });
}

export function logWarn(context: string, message: string, extra?: Record<string, unknown>): void {
  console.warn(formatMessage({ context, message, level: 'warn', extra }));
  sendToSentry({ context, message, level: 'warn', extra });
}

export function logInfo(context: string, message: string, extra?: Record<string, unknown>): void {
  console.info(formatMessage({ context, message, level: 'info', extra }));
}
