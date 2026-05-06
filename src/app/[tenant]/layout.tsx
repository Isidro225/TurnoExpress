import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getTenantBySlug, isReservedSlug } from "@/lib/tenant";
import { TENANT_TITLE_FONTS, normalizeTenantTitleFont } from "@/lib/tenant-fonts";

const DEFAULT_BRAND = "#0ea5e9";
const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

function normalizeHex(color: string | null | undefined) {
  return /^#[0-9a-fA-F]{6}$/.test(color ?? "") ? color! : DEFAULT_BRAND;
}

function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function toHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0");
}

function rgbToHex(rgb: Rgb) {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn
      ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;

  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hueToRgb(p: number, q: number, t: number) {
  let next = t;
  if (next < 0) next += 1;
  if (next > 1) next -= 1;
  if (next < 1 / 6) return p + (q - p) * 6 * next;
  if (next < 1 / 2) return q;
  if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
  return p;
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const value = ln * 255;
    return { r: value, g: value, b: value };
  }

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const hn = h / 360;

  return {
    r: hueToRgb(p, q, hn + 1 / 3) * 255,
    g: hueToRgb(p, q, hn) * 255,
    b: hueToRgb(p, q, hn - 1 / 3) * 255,
  };
}

function luminance({ r, g, b }: Rgb) {
  const toLinear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function buildBrandPalette(rawBrand: string | null | undefined) {
  const brand = normalizeHex(rawBrand);
  const rgb = hexToRgb(brand);
  const hsl = rgbToHsl(rgb);
  const accent = hslToRgb({
    h: (hsl.h + 26) % 360,
    s: Math.min(100, hsl.s + 8),
    l: Math.min(62, Math.max(42, hsl.l + 4)),
  });

  return {
    brand,
    foreground: luminance(rgb) > 0.55 ? "#111827" : "#ffffff",
    soft: rgbToHex(mix(rgb, WHITE, 0.9)),
    softStrong: rgbToHex(mix(rgb, WHITE, 0.8)),
    border: rgbToHex(mix(rgb, WHITE, 0.62)),
    strong: rgbToHex(mix(rgb, BLACK, 0.22)),
    dark: rgbToHex(mix(rgb, BLACK, 0.35)),
    deep: rgbToHex(mix(rgb, BLACK, 0.52)),
    accent: rgbToHex(accent),
    accentDark: rgbToHex(mix(accent, BLACK, 0.22)),
    onDark: rgbToHex(mix(accent, WHITE, 0.35)),
    ring: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`,
    shadow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.24)`,
  };
}

export default async function TenantLayout({
  params,
  children,
}: {
  params: Promise<{ tenant: string }>;
  children: React.ReactNode;
}) {
  const { tenant: slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const tenant = await getTenantBySlug(slug);
  if (!tenant?.active) notFound();

  const palette = buildBrandPalette(tenant.primaryColor);
  const titleFont = normalizeTenantTitleFont((tenant as { titleFont?: string | null }).titleFont);
  const titleFontStack = TENANT_TITLE_FONTS[titleFont].stack;
  const wrapperStyle: CSSProperties = {
    ["--brand" as string]: palette.brand,
    ["--brand-foreground" as string]: palette.foreground,
    ["--brand-soft" as string]: palette.soft,
    ["--brand-soft-strong" as string]: palette.softStrong,
    ["--brand-border" as string]: palette.border,
    ["--brand-strong" as string]: palette.strong,
    ["--brand-dark" as string]: palette.dark,
    ["--brand-deep" as string]: palette.deep,
    ["--brand-accent" as string]: palette.accent,
    ["--brand-accent-dark" as string]: palette.accentDark,
    ["--brand-on-dark" as string]: palette.onDark,
    ["--brand-ring" as string]: palette.ring,
    ["--brand-shadow" as string]: palette.shadow,
    backgroundColor: "#ffffff",
  };

  return (
    <div style={wrapperStyle} className="min-h-screen text-zinc-900">
      <header
        className="flex w-full items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, var(--brand) 0%, var(--brand) 60%, #ffffff 100%)",
        }}
      >
        {tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- soportamos data URIs sin pasar por next/image
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="block max-h-40 max-w-[16rem] object-contain sm:max-h-56 sm:max-w-[24rem] md:max-h-64 md:max-w-[28rem]"
          />
        ) : (
          <span
            className="text-7xl font-semibold leading-none sm:text-8xl"
            style={{
              color: "var(--brand-foreground)",
              fontFamily: titleFontStack,
            }}
          >
            {tenant.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}
