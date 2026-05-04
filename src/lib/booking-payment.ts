export function isBookingPaymentBypassEnabled() {
  // Mercado Pago is enabled by default. Use BOOKING_PAYMENT_BYPASS=true only for local tests.
  return process.env.BOOKING_PAYMENT_BYPASS === "true";
}
