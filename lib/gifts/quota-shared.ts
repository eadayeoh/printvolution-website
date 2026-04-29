// Client-safe quota types. Lives separately from quota.ts (server-only)
// so the PDP can import the shape without dragging the Supabase service
// client into the browser bundle.

export type QuotaState = {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  isSignedIn: boolean;
  /** Set when blocked — UI message describes why. */
  reason?: string;
};

export const ANON_LIMIT = 3;
export const USER_LIMIT = 8;
