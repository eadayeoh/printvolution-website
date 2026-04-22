# Composite-renderer fonts

Drop `.ttf` or `.otf` files into this directory and the template
composite renderer will use them for text zones.

## Why

Vercel's serverless Lambda doesn't have Inter / Playfair Display /
Fraunces / Caveat / Bebas Neue / JetBrains Mono installed. Without
bundled fonts, SVG text rendered through `sharp` (which uses
`librsvg`) falls back to a generic family — the Netflix "my best day"
script title shows up in an approximation of Georgia instead of
Playfair italic.

The renderer at `lib/gifts/pipeline/composite.ts` prefers
`@resvg/resvg-js` when a font file is available here, then falls back
to the sharp path.

## What to add

The design system in `lib/gifts/types.ts` references these families:

| Family slug | Expected file name(s) |
| --- | --- |
| `inter` | `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-Bold.ttf` |
| `playfair` | `PlayfairDisplay-Regular.ttf`, `PlayfairDisplay-Italic.ttf`, `PlayfairDisplay-Bold.ttf`, `PlayfairDisplay-BoldItalic.ttf` |
| `fraunces` | `Fraunces-Regular.ttf`, `Fraunces-Bold.ttf` |
| `cormorant` | `CormorantGaramond-Regular.ttf`, `CormorantGaramond-BoldItalic.ttf` |
| `caveat` | `Caveat-Regular.ttf`, `Caveat-Bold.ttf` |
| `bebas` | `BebasNeue-Regular.ttf` |
| `mono` | `JetBrainsMono-Regular.ttf`, `JetBrainsMono-Bold.ttf` |

Only add the weights and styles you actually use in templates. For
the Netflix series-cover template specifically you'll want:

- `Inter-Bold.ttf` (for the `SERIES` label and `Scenes From Content`)
- `Inter-Regular.ttf` (for the genre tag line)
- `PlayfairDisplay-BoldItalic.ttf` (for the script "my best day" title)

## Where to get them

All fonts listed above are free via Google Fonts:
https://fonts.google.com — click a family, click **Get font**,
then **Download all**. Extract the `static/` folder and drop the
`.ttf` files in here.

File names are respected as-is — resvg reads the internal
`font-family` name from the TTF metadata, not the file name. If a
family doesn't resolve, double-check you downloaded the *static*
variant (not the variable-font one).

## Commit or ignore?

It's fine to commit the TTFs you need — each is 100–500 KB. They
ship with the Lambda build. The alternative (fetching at runtime)
adds latency and failure modes.

`.gitignore` doesn't exclude this directory, so `git add
public/fonts/*.ttf` will include them in the next commit.
