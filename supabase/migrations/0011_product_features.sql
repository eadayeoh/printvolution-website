-- Editable feature row shown on every product page (Pre-press, Digital
-- mockup, Island-wide delivery, Express). Stored on the site_settings
-- singleton as a JSON array so admins can reorder / rename / replace
-- icons without a code change.
alter table public.site_settings
  add column if not exists product_features jsonb
  not null default '[
    {"icon_url": null, "emoji": "✓", "title": "Pre-press file check", "desc": "We inspect every file before it hits the printer."},
    {"icon_url": null, "emoji": "🖼", "title": "Digital mockup",      "desc": "Preview your design before we produce it."},
    {"icon_url": null, "emoji": "🚚", "title": "Island-wide delivery", "desc": "Or free pickup at Paya Lebar Square."},
    {"icon_url": null, "emoji": "⚡", "title": "Express available",   "desc": "24-hour turnaround for rush jobs — ask us."}
  ]'::jsonb;
