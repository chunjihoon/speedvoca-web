import type { Analytics } from "firebase/analytics";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
} from "firebase/analytics";
import { firebaseApp } from "./firebase";

type EventParams = Record<string, string | number | boolean | null | undefined>;

let analyticsInstancePromise: Promise<Analytics | null> | null = null;

async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (analyticsInstancePromise) return analyticsInstancePromise;

  analyticsInstancePromise = (async () => {
    if (typeof window === "undefined") return null;
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    return getAnalytics(firebaseApp);
  })();

  return analyticsInstancePromise;
}

function sanitizeParams(params?: EventParams): Record<string, string | number | boolean> {
  if (!params) return {};
  const result: Record<string, string | number | boolean> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    }
  });

  return result;
}

export function trackEvent(name: string, params?: EventParams) {
  void getAnalyticsInstance().then((analytics) => {
    if (!analytics) return;
    logEvent(analytics, name, sanitizeParams(params));
  });
}

export function identifyUser(userId?: string | null) {
  void getAnalyticsInstance().then((analytics) => {
    if (!analytics) return;
    setUserId(analytics, userId ?? null);
  });
}

export function setAnalyticsProps(params: EventParams) {
  void getAnalyticsInstance().then((analytics) => {
    if (!analytics) return;
    setUserProperties(analytics, sanitizeParams(params));
  });
}
