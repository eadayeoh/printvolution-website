/**
 * Supabase database types. Will be auto-generated via:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT > types/database.ts
 *
 * This is a placeholder stub until the Supabase project is created (Phase 1).
 */
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, never>;
    Enums: Record<string, string>;
  };
};
