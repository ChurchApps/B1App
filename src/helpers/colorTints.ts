// Lightweight color helpers used by Theme.tsx and MobileThemeProvider.tsx
// to derive primary-light / primary-dark / accent from a single church primary,
// so churches that only set one color still get a coherent theme.

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isValidHex = (value?: string | null): value is string =>
  HEX_RE.test((value || "").trim());

const expand = (hex: string): string => {
  const h = hex.replace("#", "");
  if (h.length === 3) return h.split("").map((c) => c + c).join("");
  return h;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = expand(hex);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
};

// `ratio` is how much of `mix` to blend in: 0 = pure base, 1 = pure mix.
const mix = (base: string, mixColor: string, ratio: number): string => {
  if (!isValidHex(base) || !isValidHex(mixColor)) return base;
  const [br, bg, bb] = hexToRgb(base);
  const [mr, mg, mb] = hexToRgb(mixColor);
  const r = br + (mr - br) * ratio;
  const g = bg + (mg - bg) * ratio;
  const b = bb + (mb - bb) * ratio;
  return rgbToHex(r, g, b);
};

// Tint = blend toward white. Shade = blend toward black.
export const tint = (hex: string, ratio: number): string => mix(hex, "#FFFFFF", ratio);
export const shade = (hex: string, ratio: number): string => mix(hex, "#000000", ratio);

// Rotate hue 30° around the wheel for a complementary-ish accent.
// Falls back to the input if it's not a valid hex.
export const accent = (hex: string): string => {
  if (!isValidHex(hex)) return hex;
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const newH = (h + 30) % 360;
  // back to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((newH / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0, gp = 0, bp = 0;
  if (newH < 60) [rp, gp, bp] = [c, x, 0];
  else if (newH < 120) [rp, gp, bp] = [x, c, 0];
  else if (newH < 180) [rp, gp, bp] = [0, c, x];
  else if (newH < 240) [rp, gp, bp] = [0, x, c];
  else if (newH < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return rgbToHex((rp + m) * 255, (gp + m) * 255, (bp + m) * 255);
};
