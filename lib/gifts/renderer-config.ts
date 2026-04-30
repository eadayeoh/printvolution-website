/** Per-renderer admin-editable config stored on
 *  gift_templates.renderer_config. Customer-supplied
 *  personalisation_notes still override at order time, so these
 *  fields act as defaults / studio overrides — handy when the same
 *  template anchors a series of products and admin wants the wording
 *  consistent without baking it into the SVG builder.
 *
 *  Each renderer has its own shape; readers MUST tolerate missing
 *  fields (older rows have an empty {}). */

export type CityMapLayoutKey = 'single-circle' | 'two-hearts' | 'three-circles' | 'circle-with-photos';
export type StarMapLayoutKey = 'single-circle' | 'three-circles' | 'star-photo-pair' | 'with-photos';
export type SongLyricsLayoutKey = 'song' | 'wedding' | 'foil';
export type SpotifyPlaqueLayoutKey = 'classic';

export type CityMapRendererConfig = {
  layout?: CityMapLayoutKey;
  /** Overrides the default banner ("Where it all began") on the
   *  rendered image. Customer can still type their own at order
   *  time via personalisation_notes. */
  default_title?: string;
  default_names_separator?: string; // e.g. " ❤ " or " & "
  show_coordinates?: boolean;
  show_date?: boolean;
};

export type StarMapRendererConfig = {
  layout?: StarMapLayoutKey;
  default_title?: string;
  default_subtitle?: string;
  default_names_separator?: string;
  show_coordinates?: boolean;
  show_date?: boolean;
};

export type SongLyricsRendererConfig = {
  layout?: SongLyricsLayoutKey;
  default_title?: string;
  default_subtitle?: string;
  default_tagline?: string;
};

export type SpotifyPlaqueRendererConfig = {
  layout?: SpotifyPlaqueLayoutKey;
  default_tagline?: string;
};

export type RendererConfig =
  | CityMapRendererConfig
  | StarMapRendererConfig
  | SongLyricsRendererConfig
  | SpotifyPlaqueRendererConfig
  | Record<string, unknown>;

/** Each layout key in the dropdown labels an option. The 'available'
 *  flag lets us list a layout key the SVG builder doesn't fully
 *  implement yet — the picker shows it (so admin can plan), but
 *  saving an unavailable key falls back to the default render. */
export type LayoutOption = {
  key: string;
  label: string;
  description: string;
  available: boolean;
};

export const CITY_MAP_LAYOUTS: LayoutOption[] = [
  { key: 'single-circle',       label: 'Single circle',       description: 'One round map. The classic — what shipped before today.', available: true },
  { key: 'two-hearts',          label: 'Heart pair',          description: 'Two heart-shaped panels: one map, one photo. "Where it all began".', available: false },
  { key: 'three-circles',       label: 'Three circles',       description: 'Three round maps in a row. Met / Engaged / Married.', available: false },
  { key: 'circle-with-photos',  label: 'Circle + photos',     description: 'Big round map up top, three polaroid photos at the bottom.', available: false },
];

export const STAR_MAP_LAYOUTS: LayoutOption[] = [
  { key: 'single-circle',     label: 'Single circle',     description: 'One round star chart with footer text. Existing default.', available: true },
  { key: 'three-circles',     label: 'Three circles',     description: 'Three round star charts in a row. Met / Engaged / Married.', available: false },
  { key: 'star-photo-pair',   label: 'Star + photo pair', description: 'Star chart on the left, customer photo cropped to a circle on the right.', available: false },
  { key: 'with-photos',       label: 'Star + photo strip',description: 'Big star chart up top, photos + Spotify code at the bottom.', available: false },
];

export const SONG_LYRICS_LAYOUTS: LayoutOption[] = [
  { key: 'song',     label: 'Spiral (default)',  description: 'Lyrics spiral around the photo disc. The original layout.', available: true },
  { key: 'wedding',  label: 'Wedding',           description: 'Cleaner wedding-card variant with names + date prominently.', available: true },
  { key: 'foil',     label: 'Foil',              description: 'Single-colour foil version — gold on dark canvas.', available: true },
];

export const RENDERER_LAYOUT_OPTIONS: Record<string, LayoutOption[]> = {
  city_map:        CITY_MAP_LAYOUTS,
  star_map:        STAR_MAP_LAYOUTS,
  song_lyrics:     SONG_LYRICS_LAYOUTS,
  spotify_plaque:  [
    { key: 'classic', label: 'Classic', description: 'Spotify scan code + photo. Single layout for now.', available: true },
  ],
};

export function rendererConfigFor<T extends RendererConfig = Record<string, unknown>>(
  template: { renderer?: string | null; renderer_config?: unknown } | null | undefined,
): T {
  if (!template) return {} as T;
  const cfg = template.renderer_config;
  if (!cfg || typeof cfg !== 'object') return {} as T;
  return cfg as T;
}
