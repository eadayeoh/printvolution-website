/**
 * Supabase database types — placeholder until we run:
 *   npx supabase login
 *   npx supabase gen types typescript --project-id zblzeztisjzjcnvarwcw > types/database.ts
 *
 * Loose typing for now — works fine for queries, just no autocomplete on column names.
 * Will be replaced with strict generated types in a follow-up.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: Record<string, {
      Row: Record<string, Json>;
      Insert: Record<string, Json>;
      Update: Record<string, Json>;
    }>;
    Views: Record<string, { Row: Record<string, Json> }>;
    Functions: Record<string, { Args: Record<string, Json>; Returns: Json }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};
