import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "<Your Sentry DSN>",
  _experiments: {
    enableLogs: true,
  },
  debug: true,
  tracesSampleRate: 1.0,
});
