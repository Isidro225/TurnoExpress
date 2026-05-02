import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mpPayment } from "@/lib/mercadopago";

// MP envía notificaciones a esta URL. Soportamos el formato nuevo (`type` + `data.id`).
// https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const data = payload as {
    type?: string;
    action?: string;
    data?: { id?: string };
  };

  if (data.type !== "payment" || !data.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(data.data.id);

  const localPayment = await prisma.payment.findFirst({
    where: { paymentId: mpPaymentId },
    include: { tenant: true, appointment: true },
  });

  // Si no existe localmente, buscamos por el preferenceId via external_reference (ver más abajo).
  // Para ello necesitamos consultar al MP el detalle del pago.
  let tenant = localPayment?.tenant ?? null;
  if (!tenant) {
    // Sin tenant todavía no podemos llamar a MP (cada negocio tiene su access token).
    // Estrategia: traer pagos pendientes recientes y matchear por external_reference cuando llegue
    // la confirmación. Por ahora dejamos el webhook como ack y se procesa en /book/success.
    return NextResponse.json({ ok: true, note: "no-local-payment" });
  }

  const accessToken = tenant.mpAccessToken;
  if (!accessToken) return NextResponse.json({ ok: true, note: "tenant-missing-mp-token" });

  const mp = mpPayment(accessToken);
  const detail = await mp.get({ id: mpPaymentId });

  const status = (detail.status ?? "").toLowerCase();
  const mapped =
    status === "approved"
      ? "APPROVED"
      : status === "rejected"
        ? "REJECTED"
        : status === "refunded"
          ? "REFUNDED"
          : status === "cancelled"
            ? "CANCELLED"
            : "PENDING";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: localPayment!.id },
      data: {
        status: mapped,
        rawPayload: detail as object,
      },
    });
    if (mapped === "APPROVED") {
      await tx.appointment.update({
        where: { id: localPayment!.appointmentId },
        data: { status: "CONFIRMED" },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
