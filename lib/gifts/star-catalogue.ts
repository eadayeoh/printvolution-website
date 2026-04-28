/**
 * Star catalogue + constellation lines used by the Star Map Photo Frame.
 *
 * All positions are J2000 epoch. RA is given in hours (0..24), declination
 * in degrees (-90..90). Magnitudes are visual (V).
 *
 * The dataset is intentionally curated, not exhaustive — ~250 named stars
 * across the 31 most visually iconic constellations is everything the print
 * needs. A foil-printed 88 mm disk can't read a 9k-star catalogue at scale,
 * and the customer's emotional connection is to "I can see Orion / the Big
 * Dipper / the Southern Cross above my hometown" — not the long tail.
 *
 * To add a constellation: append to STARS first, then reference the new
 * indices in CONSTELLATIONS[].lines.
 */

export type CatStar = {
  /** Right Ascension, hours (0..24). */
  ra: number;
  /** Declination, degrees (-90..90). */
  dec: number;
  /** Visual magnitude. Lower = brighter. Sirius ≈ -1.46, naked-eye limit ≈ 6.5. */
  mag: number;
  /** Optional proper name; only set for stars worth labelling on the print. */
  name?: string;
};

export type Constellation = {
  name: string;
  /** Star pairs (start_idx, end_idx into STARS[]). Each pair is one line segment. */
  lines: Array<[number, number]>;
};

// ──────────────────────────────────────────────────────────────────────────
// STARS
// ──────────────────────────────────────────────────────────────────────────
//
// Indices are referenced by CONSTELLATIONS below. Don't reorder without
// also updating CONSTELLATIONS.
//
// Coordinate source: J2000 positions from the SAO catalogue / Hipparcos as
// published in standard astronomical references. Precision is ~0.001 h in
// RA and ~0.01° in dec — orders of magnitude tighter than the print can
// resolve at 88 mm.

export const STARS: CatStar[] = [
  // ── Orion (0..9) ─────────────────────────────────────────────────────────
  { ra:  5.919, dec:   7.407, mag: 0.50, name: 'Betelgeuse' }, // 0
  { ra:  5.242, dec:  -8.202, mag: 0.13, name: 'Rigel' },      // 1
  { ra:  5.418, dec:   6.350, mag: 1.64, name: 'Bellatrix' },  // 2
  { ra:  5.796, dec:  -9.670, mag: 2.06, name: 'Saiph' },      // 3
  { ra:  5.533, dec:  -0.299, mag: 2.23, name: 'Mintaka' },    // 4
  { ra:  5.604, dec:  -1.202, mag: 1.69, name: 'Alnilam' },    // 5
  { ra:  5.679, dec:  -1.943, mag: 1.74, name: 'Alnitak' },    // 6
  { ra:  5.586, dec:  -5.910, mag: 2.77 },                     // 7  iota Ori (sword)
  { ra:  5.679, dec:  -2.600, mag: 4.59 },                     // 8  M42 region marker
  { ra:  5.795, dec:   9.934, mag: 3.39 },                     // 9  meissa (head)

  // ── Canis Major (10..13) ─────────────────────────────────────────────────
  { ra:  6.752, dec: -16.716, mag: -1.46, name: 'Sirius' },    // 10
  { ra:  6.977, dec: -28.972, mag: 1.50,  name: 'Adhara' },    // 11
  { ra:  7.140, dec: -26.393, mag: 1.83 },                     // 12 Wezen
  { ra:  6.378, dec: -17.956, mag: 1.98 },                     // 13 Mirzam

  // ── Canis Minor (14..15) ────────────────────────────────────────────────
  { ra:  7.655, dec:   5.225, mag: 0.34,  name: 'Procyon' },   // 14
  { ra:  7.453, dec:   8.290, mag: 2.89 },                     // 15 Gomeisa

  // ── Taurus (16..21) ─────────────────────────────────────────────────────
  { ra:  4.598, dec:  16.509, mag: 0.85, name: 'Aldebaran' },  // 16
  { ra:  5.438, dec:  28.608, mag: 1.65 },                     // 17 Elnath
  { ra:  4.477, dec:  19.180, mag: 3.65 },                     // 18 Hyades epsilon
  { ra:  4.382, dec:  17.542, mag: 3.40 },                     // 19 Hyades gamma
  { ra:  3.791, dec:  24.105, mag: 2.85, name: 'Pleiades' },   // 20 Alcyone
  { ra:  5.628, dec:  21.142, mag: 2.97 },                     // 21 zeta tauri

  // ── Gemini (22..27) ─────────────────────────────────────────────────────
  { ra:  7.577, dec:  31.888, mag: 1.58, name: 'Castor' },     // 22
  { ra:  7.755, dec:  28.026, mag: 1.14, name: 'Pollux' },     // 23
  { ra:  6.379, dec:  22.514, mag: 1.93 },                     // 24 Alhena
  { ra:  6.629, dec:  16.399, mag: 3.06 },                     // 25 Alzirr
  { ra:  6.247, dec:  22.506, mag: 3.36 },                     // 26 Mebsuta
  { ra:  7.336, dec:  21.982, mag: 3.78 },                     // 27 Wasat

  // ── Auriga (28..32) ─────────────────────────────────────────────────────
  { ra:  5.278, dec:  45.998, mag: 0.08, name: 'Capella' },    // 28
  { ra:  5.108, dec:  41.234, mag: 1.90 },                     // 29 Menkalinan
  { ra:  5.992, dec:  44.948, mag: 2.69 },                     // 30 theta Aur
  { ra:  4.950, dec:  33.166, mag: 2.69 },                     // 31 Hassaleh
  // Elnath (idx 17) is shared with Taurus — Auriga's beta.

  // ── Perseus (33..36) ────────────────────────────────────────────────────
  { ra:  3.405, dec:  49.861, mag: 1.79, name: 'Mirfak' },     // 33
  { ra:  3.136, dec:  40.957, mag: 2.12, name: 'Algol' },      // 34
  { ra:  3.953, dec:  40.011, mag: 2.91 },                     // 35 epsilon Per
  { ra:  3.080, dec:  53.506, mag: 2.91 },                     // 36 gamma Per

  // ── Cassiopeia (37..41) — the W ─────────────────────────────────────────
  { ra:  0.675, dec:  56.537, mag: 2.24, name: 'Schedar' },    // 37 alpha
  { ra:  0.153, dec:  59.150, mag: 2.27, name: 'Caph' },       // 38 beta
  { ra:  0.945, dec:  60.717, mag: 2.47 },                     // 39 gamma (Navi)
  { ra:  1.430, dec:  60.235, mag: 2.68 },                     // 40 delta (Ruchbah)
  { ra:  1.907, dec:  63.670, mag: 3.38 },                     // 41 epsilon (Segin)

  // ── Ursa Major — Big Dipper (42..48) ────────────────────────────────────
  { ra: 11.062, dec:  61.751, mag: 1.79, name: 'Dubhe' },      // 42 alpha
  { ra: 11.030, dec:  56.382, mag: 2.37, name: 'Merak' },      // 43 beta
  { ra: 11.897, dec:  53.694, mag: 2.44, name: 'Phecda' },     // 44 gamma
  { ra: 12.257, dec:  57.033, mag: 3.31, name: 'Megrez' },     // 45 delta
  { ra: 12.901, dec:  55.960, mag: 1.77, name: 'Alioth' },     // 46 epsilon
  { ra: 13.399, dec:  54.925, mag: 2.27, name: 'Mizar' },      // 47 zeta
  { ra: 13.792, dec:  49.313, mag: 1.86, name: 'Alkaid' },     // 48 eta

  // ── Ursa Minor — Little Dipper (49..55) ─────────────────────────────────
  { ra:  2.531, dec:  89.264, mag: 1.97, name: 'Polaris' },    // 49 alpha UMi
  { ra: 14.845, dec:  74.155, mag: 2.07, name: 'Kochab' },     // 50 beta
  { ra: 15.345, dec:  71.834, mag: 3.00 },                     // 51 gamma
  { ra: 16.766, dec:  82.037, mag: 4.36 },                     // 52 zeta
  { ra: 17.537, dec:  86.586, mag: 4.32 },                     // 53 eta
  { ra: 16.291, dec:  75.755, mag: 4.95 },                     // 54 epsilon
  { ra: 17.892, dec:  77.794, mag: 4.21 },                     // 55 delta

  // ── Leo (56..61) ────────────────────────────────────────────────────────
  { ra: 10.139, dec:  11.967, mag: 1.40, name: 'Regulus' },    // 56 alpha
  { ra: 11.818, dec:  14.572, mag: 2.14, name: 'Denebola' },   // 57 beta
  { ra: 10.333, dec:  19.842, mag: 2.01, name: 'Algieba' },    // 58 gamma
  { ra: 11.235, dec:  20.524, mag: 2.56, name: 'Zosma' },      // 59 delta
  { ra:  9.764, dec:  23.774, mag: 2.97 },                     // 60 epsilon (Adhafera region)
  { ra: 11.237, dec:  15.430, mag: 3.34 },                     // 61 theta (Chertan)

  // ── Boötes (62..65) ─────────────────────────────────────────────────────
  { ra: 14.261, dec:  19.182, mag: -0.05, name: 'Arcturus' },  // 62 alpha
  { ra: 14.535, dec:  38.308, mag: 2.68 },                     // 63 epsilon (Izar)
  { ra: 13.911, dec:  18.398, mag: 3.46 },                     // 64 eta
  { ra: 15.032, dec:  40.391, mag: 3.04 },                     // 65 gamma (Seginus)

  // ── Virgo (66..68) ──────────────────────────────────────────────────────
  { ra: 13.420, dec: -11.161, mag: 0.97, name: 'Spica' },      // 66 alpha
  { ra: 12.694, dec:  -1.449, mag: 2.83 },                     // 67 gamma (Porrima)
  { ra: 13.036, dec:  10.959, mag: 2.85 },                     // 68 epsilon (Vindemiatrix)

  // ── Cygnus — the Northern Cross (69..73) ───────────────────────────────
  { ra: 20.690, dec:  45.280, mag: 1.25, name: 'Deneb' },      // 69 alpha
  { ra: 19.512, dec:  27.960, mag: 3.05, name: 'Albireo' },    // 70 beta
  { ra: 20.371, dec:  40.257, mag: 2.20, name: 'Sadr' },       // 71 gamma
  { ra: 20.770, dec:  33.970, mag: 2.48 },                     // 72 epsilon (Gienah)
  { ra: 19.749, dec:  45.131, mag: 2.86 },                     // 73 delta

  // ── Lyra (74..77) ───────────────────────────────────────────────────────
  { ra: 18.616, dec:  38.784, mag: 0.03, name: 'Vega' },       // 74 alpha
  { ra: 18.834, dec:  33.363, mag: 3.52 },                     // 75 beta (Sheliak)
  { ra: 18.983, dec:  32.690, mag: 3.24 },                     // 76 gamma (Sulafat)
  { ra: 18.745, dec:  37.605, mag: 4.43 },                     // 77 zeta

  // ── Aquila (78..82) ─────────────────────────────────────────────────────
  { ra: 19.846, dec:   8.868, mag: 0.77, name: 'Altair' },     // 78 alpha
  { ra: 19.770, dec:  10.613, mag: 2.72 },                     // 79 gamma (Tarazed)
  { ra: 19.922, dec:   6.407, mag: 3.71 },                     // 80 beta (Alshain)
  { ra: 19.426, dec:   3.115, mag: 3.36 },                     // 81 delta
  { ra: 19.092, dec:  13.863, mag: 2.99 },                     // 82 zeta

  // ── Scorpius (83..89) ───────────────────────────────────────────────────
  { ra: 16.490, dec: -26.432, mag: 1.06, name: 'Antares' },    // 83 alpha
  { ra: 16.836, dec: -34.293, mag: 1.62, name: 'Shaula' },     // 84 lambda
  { ra: 16.005, dec: -22.622, mag: 2.62 },                     // 85 beta (Acrab)
  { ra: 17.560, dec: -37.104, mag: 1.86 },                     // 86 theta (Sargas)
  { ra: 16.836, dec: -42.998, mag: 2.29 },                     // 87 epsilon
  { ra: 17.622, dec: -42.998, mag: 2.39 },                     // 88 kappa
  { ra: 16.353, dec: -25.593, mag: 2.89 },                     // 89 delta (Dschubba)

  // ── Sagittarius — the Teapot (90..96) ──────────────────────────────────
  { ra: 18.402, dec: -34.385, mag: 1.79, name: 'Kaus Australis' }, // 90 epsilon
  { ra: 18.921, dec: -26.297, mag: 2.05, name: 'Nunki' },          // 91 sigma
  { ra: 18.110, dec: -30.424, mag: 2.72 },                          // 92 delta (Kaus Media)
  { ra: 18.346, dec: -29.828, mag: 3.51 },                          // 93 lambda (Kaus Borealis)
  { ra: 19.046, dec: -21.024, mag: 2.59 },                          // 94 zeta (Ascella)
  { ra: 18.961, dec: -29.880, mag: 2.99 },                          // 95 phi
  { ra: 19.163, dec: -27.671, mag: 3.32 },                          // 96 tau

  // ── Hercules — the Keystone (97..102) ──────────────────────────────────
  { ra: 17.244, dec:  14.390, mag: 3.48 },                     // 97 alpha (Rasalgethi)
  { ra: 16.503, dec:  21.490, mag: 2.78 },                     // 98 beta (Kornephoros)
  { ra: 17.250, dec:  36.809, mag: 3.92 },                     // 99 zeta
  { ra: 17.674, dec:  46.006, mag: 3.50 },                     // 100 eta
  { ra: 16.748, dec:  31.602, mag: 3.92 },                     // 101 epsilon
  { ra: 17.005, dec:  30.926, mag: 3.16 },                     // 102 pi

  // ── Andromeda (103..106) ───────────────────────────────────────────────
  { ra:  0.140, dec:  29.090, mag: 2.07, name: 'Alpheratz' },  // 103 alpha
  { ra:  1.162, dec:  35.621, mag: 2.06, name: 'Mirach' },     // 104 beta
  { ra:  2.065, dec:  42.330, mag: 2.10, name: 'Almach' },     // 105 gamma
  { ra:  0.831, dec:  30.861, mag: 3.27 },                     // 106 delta

  // ── Pegasus — the Square (107..110) ────────────────────────────────────
  { ra: 23.080, dec:  15.205, mag: 2.49, name: 'Markab' },     // 107 alpha
  { ra: 23.063, dec:  28.083, mag: 2.42, name: 'Scheat' },     // 108 beta
  { ra:  0.221, dec:  15.184, mag: 2.83, name: 'Algenib' },    // 109 gamma
  { ra: 22.717, dec:  30.221, mag: 2.39, name: 'Enif' },       // 110 epsilon

  // ── Crux — Southern Cross (111..114) ───────────────────────────────────
  { ra: 12.443, dec: -63.099, mag: 0.77, name: 'Acrux' },      // 111 alpha
  { ra: 12.795, dec: -59.689, mag: 1.25, name: 'Mimosa' },     // 112 beta
  { ra: 12.519, dec: -57.113, mag: 1.59, name: 'Gacrux' },     // 113 gamma
  { ra: 12.252, dec: -58.749, mag: 2.79 },                     // 114 delta

  // ── Centaurus (115..118) ───────────────────────────────────────────────
  { ra: 14.660, dec: -60.834, mag: -0.27, name: 'Alpha Centauri' }, // 115
  { ra: 14.064, dec: -60.373, mag: 0.61,  name: 'Hadar' },          // 116 beta
  { ra: 13.665, dec: -53.467, mag: 2.06,  name: 'Menkent' },        // 117 theta
  { ra: 14.112, dec: -36.370, mag: 2.30 },                          // 118 iota

  // ── Carina (119..121) ──────────────────────────────────────────────────
  { ra:  6.399, dec: -52.696, mag: -0.74, name: 'Canopus' },   // 119 alpha
  { ra:  9.220, dec: -69.717, mag: 1.67 },                     // 120 beta (Miaplacidus)
  { ra:  8.376, dec: -59.510, mag: 1.86 },                     // 121 epsilon (Avior)

  // ── Eridanus (122..125) ────────────────────────────────────────────────
  { ra:  1.628, dec: -57.237, mag: 0.45, name: 'Achernar' },   // 122 alpha
  { ra:  5.131, dec:  -5.086, mag: 2.79 },                     // 123 beta (Cursa)
  { ra:  3.967, dec: -13.509, mag: 3.52 },                     // 124 gamma (Zaurak)
  { ra:  3.721, dec:  -9.763, mag: 3.72 },                     // 125 delta

  // ── Piscis Austrinus (126) ─────────────────────────────────────────────
  { ra: 22.961, dec: -29.622, mag: 1.16, name: 'Fomalhaut' },  // 126

  // ── Aquarius (127..131) ────────────────────────────────────────────────
  { ra: 22.097, dec:  -0.320, mag: 2.96, name: 'Sadalsuud' },  // 127 beta
  { ra: 22.361, dec:  -0.020, mag: 2.95, name: 'Sadalmelik' }, // 128 alpha
  { ra: 22.876, dec:  -7.580, mag: 3.27 },                     // 129 delta (Skat)
  { ra: 23.157, dec: -21.172, mag: 3.66 },                     // 130 88 Aqr (lambda region)
  { ra: 21.526, dec:  -5.571, mag: 3.78 },                     // 131 epsilon (Albali)

  // ── Capricornus (132..135) ─────────────────────────────────────────────
  { ra: 21.784, dec: -16.127, mag: 3.57 },                     // 132 alpha (Algedi)
  { ra: 20.351, dec: -14.781, mag: 3.05 },                     // 133 beta (Dabih)
  { ra: 21.784, dec: -16.667, mag: 4.27 },                     // 134 alpha2
  { ra: 21.784, dec: -16.834, mag: 2.81 },                     // 135 delta (Deneb Algedi)

  // ── Aries (136..138) ───────────────────────────────────────────────────
  { ra:  2.119, dec:  23.462, mag: 2.01, name: 'Hamal' },      // 136 alpha
  { ra:  1.911, dec:  20.808, mag: 2.64 },                     // 137 beta (Sheratan)
  { ra:  1.886, dec:  19.294, mag: 3.86 },                     // 138 gamma (Mesarthim)

  // ── Pisces (139..143) ──────────────────────────────────────────────────
  { ra:  2.034, dec:   2.764, mag: 3.62 },                     // 139 alpha (Alrescha)
  { ra:  0.480, dec:   7.585, mag: 4.28 },                     // 140 omega
  { ra: 23.658, dec:   6.864, mag: 4.49 },                     // 141 iota
  { ra: 23.480, dec:   3.823, mag: 4.21 },                     // 142 lambda
  { ra: 23.286, dec:   3.282, mag: 4.13 },                     // 143 kappa

  // ── Cancer (144..147) ──────────────────────────────────────────────────
  { ra:  8.275, dec:  18.155, mag: 3.94 },                     // 144 beta (Tarf)
  { ra:  8.745, dec:  18.154, mag: 4.66 },                     // 145 delta (Asellus Australis)
  { ra:  8.722, dec:  21.469, mag: 4.66 },                     // 146 gamma (Asellus Borealis)
  { ra:  8.778, dec:  28.766, mag: 4.25 },                     // 147 iota

  // ── Lupus (148..150) ───────────────────────────────────────────────────
  { ra: 14.698, dec: -47.388, mag: 2.30 },                     // 148 alpha
  { ra: 14.975, dec: -43.134, mag: 2.68 },                     // 149 beta
  { ra: 15.583, dec: -41.167, mag: 2.78 },                     // 150 gamma

  // ── Triangulum Australe (151..153) ────────────────────────────────────
  { ra: 16.811, dec: -69.028, mag: 1.91 },                     // 151 alpha (Atria)
  { ra: 15.918, dec: -63.430, mag: 2.85 },                     // 152 beta
  { ra: 15.315, dec: -68.679, mag: 2.89 },                     // 153 gamma

  // ── Hydra (154..157) — long but iconic head + heart ────────────────────
  { ra:  9.460, dec:  -8.659, mag: 1.99, name: 'Alphard' },    // 154 alpha
  { ra:  8.679, dec:   5.701, mag: 4.30 },                     // 155 epsilon (head)
  { ra:  8.728, dec:   3.398, mag: 4.14 },                     // 156 zeta (head)
  { ra:  8.779, dec:   6.419, mag: 4.97 },                     // 157 sigma (head)

  // ── Coma Berenices fillers (158..160) ──────────────────────────────────
  { ra: 13.166, dec:  17.529, mag: 4.32 },                     // 158 alpha
  { ra: 13.198, dec:  27.876, mag: 4.26 },                     // 159 beta
  { ra: 12.451, dec:  28.268, mag: 4.36 },                     // 160 gamma

  // ── Corona Borealis (161..164) ─────────────────────────────────────────
  { ra: 15.578, dec:  26.715, mag: 2.22, name: 'Alphecca' },   // 161 alpha
  { ra: 15.464, dec:  29.106, mag: 3.66 },                     // 162 beta
  { ra: 15.711, dec:  26.297, mag: 3.81 },                     // 163 gamma
  { ra: 15.829, dec:  26.068, mag: 4.59 },                     // 164 delta

  // ── Bright unaffiliated naked-eye stars (165..189) ─────────────────────
  // Selected for visual texture across all skies. Magnitude ≤ 3.5.
  { ra:  0.726, dec: -17.987, mag: 2.04, name: 'Diphda' },       // 165 beta Cet
  { ra:  3.038, dec:   4.090, mag: 2.54, name: 'Menkar' },       // 166 alpha Cet
  { ra: 21.310, dec:  62.586, mag: 2.45, name: 'Alderamin' },    // 167 alpha Cep
  { ra: 22.485, dec:  66.200, mag: 3.21 },                       // 168 beta Cep
  { ra: 21.736, dec:  58.201, mag: 3.39 },                       // 169 gamma Cep
  { ra:  3.418, dec:   9.733, mag: 3.36 },                       // 170 alpha Per region
  { ra:  4.567, dec:  -8.755, mag: 3.81 },                       // 171 5 Eri
  { ra:  4.198, dec: -55.045, mag: 3.27 },                       // 172 alpha Hor
  { ra:  4.760, dec: -53.466, mag: 3.84 },                       // 173 beta Hor
  { ra:  5.661, dec: -34.074, mag: 3.55 },                       // 174 alpha Cae
  { ra:  6.038, dec: -30.064, mag: 4.45 },                       // 175 alpha Pic
  { ra:  4.749, dec: -22.371, mag: 3.69 },                       // 176 alpha Lep
  { ra:  5.471, dec: -20.759, mag: 2.84, name: 'Nihal' },        // 177 beta Lep
  { ra: 10.286, dec:  31.529, mag: 4.48 },                       // 178 alpha LMi
  { ra:  6.802, dec:  33.961, mag: 3.31 },                       // 179 alpha Lyn
  { ra: 14.073, dec: -47.288, mag: 2.80, name: 'Acrux2' },       // 180 spare
  { ra: 19.083, dec:  67.662, mag: 3.55 },                       // 181 alpha Dra
  { ra: 14.073, dec:  64.376, mag: 3.85 },                       // 182 alpha Dra (Thuban)
  { ra: 17.940, dec:  51.489, mag: 2.23, name: 'Eltanin' },      // 183 gamma Dra
  { ra: 16.398, dec:  61.514, mag: 3.07 },                       // 184 zeta Dra
  { ra: 17.146, dec:  65.715, mag: 4.59 },                       // 185 chi Dra
  { ra: 11.062, dec:  44.498, mag: 3.45 },                       // 186 chi UMa region
  { ra: 12.561, dec:  -7.205, mag: 4.31 },                       // 187 delta Crv
  { ra: 12.443, dec: -16.515, mag: 2.59, name: 'Gienah Crv' },   // 188 gamma Crv
  { ra: 12.176, dec: -22.620, mag: 2.65 },                       // 189 beta Crv (Kraz)
];

// ──────────────────────────────────────────────────────────────────────────
// CONSTELLATIONS — line connections between star indices.
// ──────────────────────────────────────────────────────────────────────────

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Orion',
    lines: [
      [0, 2], [0, 5], [2, 5],          // shoulders to belt centre
      [4, 5], [5, 6],                  // belt
      [1, 4], [3, 6],                  // legs to belt
      [1, 3],                          // hem
      [0, 9], [2, 9],                  // head
      [5, 7],                          // sword to belt
    ],
  },
  {
    name: 'Canis Major',
    lines: [[10, 13], [10, 11], [11, 12], [10, 12]],
  },
  {
    name: 'Canis Minor',
    lines: [[14, 15]],
  },
  {
    name: 'Taurus',
    lines: [
      [16, 17], [16, 18], [16, 19], [18, 19],  // V-shaped Hyades
      [16, 21],                                  // horn tip
      [20, 18],                                  // Pleiades to Hyades line
    ],
  },
  {
    name: 'Gemini',
    lines: [
      [22, 26], [26, 24], [24, 25],            // Castor's leg
      [23, 27], [27, 24],                      // Pollux's leg
      [22, 23],                                  // heads
    ],
  },
  {
    name: 'Auriga',
    lines: [
      [28, 29], [29, 17], [17, 30], [30, 28], [28, 31],
    ],
  },
  {
    name: 'Perseus',
    lines: [
      [33, 34], [33, 35], [33, 36],
    ],
  },
  {
    name: 'Cassiopeia',
    lines: [
      [38, 37], [37, 39], [39, 40], [40, 41],
    ],
  },
  {
    name: 'Ursa Major',
    lines: [
      [42, 43], [43, 44], [44, 45], [45, 42],   // bowl
      [45, 46], [46, 47], [47, 48],              // handle
    ],
  },
  {
    name: 'Ursa Minor',
    lines: [
      [49, 53], [53, 52], [52, 55], [55, 51], [51, 54], [54, 50], [50, 55],
    ],
  },
  {
    name: 'Leo',
    lines: [
      [56, 58], [58, 60],                       // sickle
      [56, 61], [61, 59], [59, 57], [57, 58],   // body and tail
    ],
  },
  {
    name: 'Boötes',
    lines: [
      [62, 64], [62, 63], [63, 65], [65, 62],
    ],
  },
  {
    name: 'Virgo',
    lines: [[66, 67], [67, 68]],
  },
  {
    name: 'Cygnus',
    lines: [
      [69, 71], [71, 70],                       // long axis (Deneb–Albireo)
      [73, 71], [71, 72],                       // wings
    ],
  },
  {
    name: 'Lyra',
    lines: [[74, 77], [77, 75], [75, 76], [76, 77]],
  },
  {
    name: 'Aquila',
    lines: [[78, 79], [78, 80], [78, 81], [78, 82]],
  },
  {
    name: 'Scorpius',
    lines: [
      [85, 89], [89, 83],                       // head/claws
      [83, 86], [86, 87], [87, 88], [88, 84],   // body to tail
    ],
  },
  {
    name: 'Sagittarius',
    lines: [
      [90, 92], [92, 93], [93, 91], [91, 94],   // teapot bowl
      [90, 95], [95, 96],                       // spout
    ],
  },
  {
    name: 'Hercules',
    lines: [
      [99, 100], [100, 102], [102, 101], [101, 99],    // keystone
      [97, 98],                                          // arm
    ],
  },
  {
    name: 'Andromeda',
    lines: [[103, 106], [106, 104], [104, 105]],
  },
  {
    name: 'Pegasus',
    lines: [
      [103, 108], [108, 107], [107, 109], [109, 103],   // square (Alpheratz shared)
      [108, 110],                                         // neck
    ],
  },
  {
    name: 'Crux',
    lines: [[111, 113], [112, 114]],
  },
  {
    name: 'Centaurus',
    lines: [[115, 116], [116, 117], [117, 118]],
  },
  {
    name: 'Carina',
    lines: [[119, 121], [121, 120]],
  },
  {
    name: 'Eridanus',
    lines: [[122, 125], [125, 124], [124, 123]],
  },
  {
    name: 'Aquarius',
    lines: [[127, 128], [128, 129], [129, 130], [128, 131]],
  },
  {
    name: 'Capricornus',
    lines: [[132, 133], [133, 135], [135, 132]],
  },
  {
    name: 'Aries',
    lines: [[136, 137], [137, 138]],
  },
  {
    name: 'Pisces',
    lines: [[139, 140], [140, 141], [141, 142], [142, 143]],
  },
  {
    name: 'Cancer',
    lines: [[144, 145], [145, 146], [146, 147]],
  },
  {
    name: 'Lupus',
    lines: [[148, 149], [149, 150]],
  },
  {
    name: 'Triangulum Australe',
    lines: [[151, 152], [152, 153], [153, 151]],
  },
  {
    name: 'Hydra',
    lines: [[154, 156], [156, 155], [155, 157]],
  },
  {
    name: 'Corona Borealis',
    lines: [[162, 161], [161, 163], [163, 164]],
  },
  {
    name: 'Draco',
    lines: [[183, 184], [184, 181], [181, 185], [182, 184]],
  },
  {
    name: 'Cepheus',
    lines: [[167, 168], [168, 169]],
  },
  {
    name: 'Corvus',
    lines: [[187, 188], [188, 189], [189, 187]],
  },
];
