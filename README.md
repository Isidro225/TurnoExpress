# TurnoExpress

SaaS multi-tenant de reserva de turnos. Cada negocio contrata el servicio, personaliza su turnera, y publica una URL del tipo `turnoexpress.com/<slug-negocio>`. Los clientes eligen servicio, fecha, horario y profesional, y pagan una seña por Mercado Pago. El admin gestiona turnos, calendario y estadísticas.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4
- Postgres + Prisma
- Auth.js v5 (NextAuth) con Credentials + JWT
- Mercado Pago Checkout Pro
- Deploy: **Railway** (app + Postgres en el mismo proyecto)

## Estructura

```
src/
  app/
    page.tsx                       landing público
    (auth)/login/, signup/         flujo de auth
    admin/                         panel del negocio (protegido)
      page.tsx                     dashboard con KPIs
      calendar/, appointments/, services/, staff/, settings/
    [tenant]/                      vista pública del negocio (path-based tenancy)
      page.tsx                     listado de servicios
      book/page.tsx                flujo de reserva
    api/
      auth/[...nextauth]/route.ts  Auth.js handlers
      signup/route.ts              alta de tenant + owner
      mercadopago/webhook/route.ts notificaciones de pago
  lib/
    prisma.ts                      cliente Prisma singleton
    mercadopago.ts                 helpers MP (Preference, Payment)
    tenant.ts                      resolver de slug + slugs reservados
  auth.ts / auth.config.ts         Auth.js (split edge-safe / node)
  proxy.ts                         protege /admin
prisma/schema.prisma               modelo de datos
```

## Setup local

```bash
cp .env.example .env
# Editá .env con tu DATABASE_URL local y un AUTH_SECRET

npm install                          # postinstall corre prisma generate
npx prisma migrate dev --name init   # crea las tablas en tu DB local
npm run dev
```

Abrí http://localhost:3000 y creá tu primer negocio en `/signup`.

## Deploy en Railway

1. **Crear proyecto** en Railway → "New Project" → "Deploy from GitHub repo".
2. **Agregar Postgres**: en el proyecto, "+ New" → "Database" → "PostgreSQL". Railway inyecta automáticamente `DATABASE_URL` en el servicio Next.
3. **Variables de entorno** en el servicio Next:
   - `AUTH_SECRET` → generá uno con `openssl rand -base64 32`.
   - `NEXT_PUBLIC_BASE_URL` → la URL pública del servicio (`https://<servicio>.up.railway.app` o tu dominio custom).
   - `AUTH_URL` (opcional) → solo si usás dominio custom.
4. **Build & start**: Railway autodetecta Next. El `build` corre `prisma generate && prisma migrate deploy && next build`, así que las migraciones se aplican automáticamente en cada deploy.

## Mercado Pago

Las credenciales son **por negocio** (cada tenant cobra a su propia cuenta MP). Se guardan en `Tenant.mpAccessToken` / `Tenant.mpPublicKey`. Pendiente: pantalla en `/admin/settings` para conectar la cuenta MP del negocio (preferentemente vía OAuth de MP).

El webhook recibe notificaciones en `/api/mercadopago/webhook` y actualiza `Payment` + `Appointment.status` cuando el pago se aprueba.

## Próximos pasos sugeridos

- [ ] Flujo de reserva completo (`/[tenant]/book`): selector de staff/fecha/hora con disponibilidad calculada desde `StaffSchedule` + `TimeOff` − turnos existentes.
- [ ] Crear `Appointment` y `Payment` (estado `PENDING`), luego redirigir a la `init_point` del Preference de MP.
- [ ] Páginas `/[tenant]/book/{success,failure,pending}` y reconciliación con `mp.payment.search` por `external_reference` (más robusto que sólo el webhook).
- [ ] CRUD admin completo: servicios, staff, horarios semanales (`StaffSchedule`), bloqueos (`TimeOff`).
- [ ] Vista de calendario (recomendación: [react-big-calendar](https://github.com/jquense/react-big-calendar) o [FullCalendar](https://fullcalendar.io/)).
- [ ] Notificaciones por email (Resend) al crear/confirmar/cancelar turno.
- [ ] OAuth de Mercado Pago para que cada negocio conecte su cuenta sin pegar tokens a mano.
- [ ] Branding por tenant: logo + color en la vista pública.
