export const TENANT_TITLE_FONT_VALUES = [
  "system",
  "serif",
  "rounded",
  "editorial",
  "compact",
] as const;

export type TenantTitleFont = (typeof TENANT_TITLE_FONT_VALUES)[number];

export const TENANT_TITLE_FONTS: Record<
  TenantTitleFont,
  { label: string; stack: string }
> = {
  system: {
    label: "Moderna",
    stack: "Arial, Helvetica, sans-serif",
  },
  serif: {
    label: "Clasica",
    stack: 'Georgia, "Times New Roman", serif',
  },
  rounded: {
    label: "Redondeada",
    stack: '"Trebuchet MS", Arial, Helvetica, sans-serif',
  },
  editorial: {
    label: "Editorial",
    stack: '"Palatino Linotype", Palatino, Georgia, serif',
  },
  compact: {
    label: "Compacta",
    stack: '"Arial Narrow", Arial, Helvetica, sans-serif',
  },
};

export function normalizeTenantTitleFont(value: string | null | undefined): TenantTitleFont {
  return TENANT_TITLE_FONT_VALUES.includes(value as TenantTitleFont)
    ? (value as TenantTitleFont)
    : "system";
}
