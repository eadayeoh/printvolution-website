/**
 * Supabase database types — placeholder. Queries return `any` until we run:
 *   npx supabase login
 *   npx supabase gen types typescript --project-id zblzeztisjzjcnvarwcw > types/database.ts
 *
 * Loose typing intentionally so Supabase query builder doesn't narrow to `never`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/** Generic table shape — allows any query to type-check. */
type AnyTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      [key: string]: AnyTable;
    };
    Views: {
      [key: string]: { Row: Record<string, any>; Relationships: [] };
    };
    Functions: {
      [key: string]: { Args: Record<string, any>; Returns: any };
    };
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};
