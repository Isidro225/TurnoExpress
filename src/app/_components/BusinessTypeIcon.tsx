import { normalizeBusinessType } from "@/lib/business-types";

export function BusinessTypeIcon({
  businessType,
  className = "h-5 w-5",
}: {
  businessType?: string | null;
  className?: string;
}) {
  const type = normalizeBusinessType(businessType);

  if (type === "barbershop" || type === "hair_salon") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <path d="M8 7.5 20 19" strokeLinecap="round" />
        <path d="M8 16.5 20 5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "nails") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <path d="M12 3c3 0 5 2.4 5 6v6.5c0 3.1-2 5.5-5 5.5s-5-2.4-5-5.5V9c0-3.6 2-6 5-6z" strokeLinejoin="round" />
        <path d="M9 14c.8.7 1.8 1.1 3 1.1s2.2-.4 3-1.1" strokeLinecap="round" />
        <path d="M12 6v5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "beauty") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <path d="M12 3l1.2 4 3.8 1.2-3.8 1.2L12 13l-1.2-3.6L7 8.2 10.8 7z" strokeLinejoin="round" />
        <path d="M18 13l.7 2.2L21 16l-2.3.8L18 19l-.8-2.2L15 16l2.2-.8z" strokeLinejoin="round" />
        <path d="M6 14l.5 1.5L8 16l-1.5.5L6 18l-.5-1.5L4 16l1.5-.5z" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "gym") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <path d="M5 8v8M19 8v8M2.5 10v4M21.5 10v4" strokeLinecap="round" />
        <path d="M5 12h14" strokeLinecap="round" />
        <path d="M8 7v10M16 7v10" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "yoga" || type === "pilates") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <circle cx="12" cy="5" r="2" />
        <path d="M12 8v5" strokeLinecap="round" />
        <path d="M7 12h10" strokeLinecap="round" />
        <path d="M6 20c2.5-3 4.5-4.5 6-4.5S15.5 17 18 20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 20h6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "spa" || type === "massage") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <path d="M12 21c4-3 6-6.5 6-10a6 6 0 0 0-12 0c0 3.5 2 7 6 10z" strokeLinejoin="round" />
        <path d="M12 15c2-1.5 3-3 3-4.5a3 3 0 0 0-6 0c0 1.5 1 3 3 4.5z" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "health") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        <rect x="4" y="4" width="16" height="16" rx="4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
      <path d="m9 15 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
