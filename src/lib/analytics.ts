// ./src/lib/analytics.ts
import { analytics } from "./firebase";
import {
  logEvent,
  setUserId,
  setUserProperties as fbSetUserProperties,
  type Analytics,
} from "firebase/analytics";

/**
 * GA4 event parameters accept string | number | boolean | null.
 * (We avoid `any` to satisfy ESLint.)
 */
export type AnalyticsParams = Record<string, string | number | boolean | null>;

const hasAnalytics = (a: unknown): a is Analytics => Boolean(a);

export const trackEvent = (eventName: string, parameters?: AnalyticsParams) => {
  if (hasAnalytics(analytics)) {
    logEvent(analytics, eventName, parameters);
  }
};

export const trackThemeChange = (themeName: string, userId?: string) => {
  trackEvent("theme_change", {
    theme_name: themeName,
    user_id: userId ?? "anonymous",
    timestamp: new Date().toISOString(),
  });
};

export const trackPageView = (pageName: string, userId?: string) => {
  trackEvent("page_view", {
    page_name: pageName,
    user_id: userId ?? "anonymous",
    timestamp: new Date().toISOString(),
  });
};

export const trackUserEngagement = (
  action: string,
  details?: AnalyticsParams,
  userId?: string
) => {
  trackEvent("user_engagement", {
    action,
    user_id: userId ?? "anonymous",
    timestamp: new Date().toISOString(),
    ...(details ?? {}),
  });
};

export const setAnalyticsUserId = (userId: string) => {
  if (hasAnalytics(analytics)) {
    setUserId(analytics, userId);
  }
};

/** Rename to avoid clashing with the Firebase import name */
export const setAnalyticsUserProperties = (properties: AnalyticsParams) => {
  if (hasAnalytics(analytics)) {
    fbSetUserProperties(analytics, properties);
  }
};
