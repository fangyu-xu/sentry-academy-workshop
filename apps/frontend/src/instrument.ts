import * as Sentry from "@sentry/react";
import { useEffect } from "react";

import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

Sentry.init({
  dsn: "<Your Sentry DSN>",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect: useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  _experiments: {
    enableLogs: true,
  },
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost:3001"],
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});
