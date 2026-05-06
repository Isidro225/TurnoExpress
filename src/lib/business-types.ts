export const BUSINESS_TYPE_VALUES = [
  "barbershop",
  "hair_salon",
  "nails",
  "beauty",
  "spa",
  "massage",
  "gym",
  "yoga",
  "pilates",
  "health",
  "other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPE_VALUES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  barbershop: "Barbería",
  hair_salon: "Peluquería",
  nails: "Uñas",
  beauty: "Estética",
  spa: "Spa",
  massage: "Masajes",
  gym: "Gimnasio",
  yoga: "Yoga",
  pilates: "Pilates",
  health: "Salud",
  other: "Otro",
};

export function normalizeBusinessType(value: unknown): BusinessType | null {
  return BUSINESS_TYPE_VALUES.includes(value as BusinessType)
    ? (value as BusinessType)
    : null;
}

export function businessTypeLabel(value: string | null | undefined): string {
  const normalized = normalizeBusinessType(value);
  return normalized ? BUSINESS_TYPE_LABELS[normalized] : "Sin definir";
}
