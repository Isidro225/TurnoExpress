export function isBookingPaymentBypassEnabled() {
  // Temporary test mode: set BOOKING_PAYMENT_BYPASS=false to restore Mercado Pago.
  return process.env.BOOKING_PAYMENT_BYPASS !== "false";
}
