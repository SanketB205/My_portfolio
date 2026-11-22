import { track } from '@vercel/analytics'

/**
 * Centralized, privacy-safe custom event tracking for Vercel Web Analytics.
 *
 * What we track: only the event name plus non-identifying context
 * (e.g. a project title or a social platform name).
 *
 * What we never track: names, emails, messages, passwords, auth tokens,
 * or any other personally identifiable information.
 *
 * Custom event aggregation is available on Vercel Pro/Enterprise plans.
 * On the Hobby plan these calls are effectively no-ops on the dashboard
 * side and never throw, so they are safe to keep in the codebase.
 *
 * Wrapped in try/catch so analytics can never break app functionality.
 */
export function trackEvent(name, data) {
  try {
    track(name, data)
  } catch {
    // Swallow — analytics must never break app functionality.
  }
}
