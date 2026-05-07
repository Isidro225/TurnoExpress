#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const DEFAULT_SOURCE = path.join(
  process.cwd(),
  "data/imports/sofia-agenda-apr-may-2026-source.json"
);

const DAY_TEXT_COLUMNS = [2, 4, 6, 8, 10, 12, 14];
const MONTHS = {
  "Abril  2026": { year: 2026, month: 4 },
  "Mayo  2026": { year: 2026, month: 5 },
  "Junio  2026": { year: 2026, month: 6 },
};

const DEFAULT_TENANT_SLUG = "bby-nails";
const DEFAULT_STAFF_NAME = "Sofia";
const IMPORT_PREFIX = "sofia-agenda";

const SERVICE_CODES = {
  MB: { label: "Manicuria Basica", durationMin: 30, priceCents: 800000 },
  PB: { label: "Pedicuria Basica", durationMin: 40, priceCents: 1000000 },
  ESM: {
    label: "Esmaltado Semipermanente Manos",
    serviceName: "Semipermanente",
    durationMin: 45,
    priceCents: 1700000,
  },
  ESP: {
    label: "Esmaltado Semipermanente Pies",
    serviceName: "Pies Semipermanente",
    durationMin: 60,
    priceCents: 1900000,
  },
  N: {
    label: "Nivelacion",
    serviceName: "Nivelacion",
    durationMin: 60,
    priceCents: 2100000,
  },
  K: {
    label: "Capping Gel",
    serviceName: "Capping Gel",
    durationMin: 60,
    priceCents: 2300000,
  },
  KP: {
    label: "Capping Polygel",
    serviceName: "Capping Polygel",
    durationMin: 90,
    priceCents: 2600000,
  },
  ESG: {
    label: "Extensiones Soft Gel",
    serviceName: "Soft Gel",
    durationMin: 60,
    priceCents: 2400000,
  },
  EP: {
    label: "Esculpidas Polygel",
    serviceName: "Esculpidas",
    durationMin: 90,
    priceCents: 3000000,
  },
  EP2: {
    label: "Esculpidas Polygel",
    serviceName: "Esculpidas",
    durationMin: 90,
    priceCents: 3000000,
  },
  SK: {
    label: "Service Capping Gel",
    serviceName: "Capping Gel",
    durationMin: 60,
    priceCents: 1800000,
    procedureMode: "service",
  },
  SKP: {
    label: "Service Capping Polygel",
    serviceName: "Capping Polygel",
    durationMin: 60,
    priceCents: 2100000,
    procedureMode: "service",
  },
  SSG: {
    label: "Service Soft Gel",
    serviceName: "Soft Gel",
    durationMin: 60,
    priceCents: 1900000,
    procedureMode: "service",
  },
  SEP: {
    label: "Service Esculpidas Polygel",
    serviceName: "Esculpidas",
    durationMin: 90,
    priceCents: 2300000,
    procedureMode: "service",
  },
  SN: {
    label: "Service Nivelacion",
    serviceName: "Nivelacion",
    durationMin: 60,
    priceCents: 1800000,
    procedureMode: "service",
    inferred: true,
  },
  ESN: {
    label: "Esmaltado Semipermanente con Nivelacion",
    serviceName: "Nivelacion",
    durationMin: 60,
    priceCents: 2100000,
    inferred: true,
  },
};

const REMOVAL_CODES = {
  REC: { label: "Retiro Esmalte Comun", priorName: "Semipermanente", durationMin: 5, priceCents: 200000 },
  RES: { label: "Retiro Esmalte Semi", priorName: "Semipermanente", durationMin: 10, priceCents: 400000 },
  RESN: { label: "Retiro Nivelacion", priorName: "Nivelacion", durationMin: 15, priceCents: 400000 },
  RN: { label: "Retiro Nivelacion", priorName: "Nivelacion", durationMin: 15, priceCents: 400000 },
  RK: { label: "Retiro Capping Gel", priorName: "Capping gel", durationMin: 20, priceCents: 500000 },
  RKP: { label: "Retiro Capping Polygel", priorName: "Capping polygel", durationMin: 30, priceCents: 600000 },
  RSG: { label: "Retiro Soft Gel", priorName: "Soft gel", durationMin: 30, priceCents: 600000 },
  RE: { label: "Retiro Esculpidas", priorName: "Esculpidas", durationMin: 45, priceCents: 700000 },
  RA: { label: "Retiro Acrilico", priorName: "Capping acrilico", durationMin: 60, priceCents: 800000 },
};

const DESIGN_CODES = {
  D: { label: "Diseno general", durationMin: 15, priceCents: 300000 },
  DF: { label: "Francesitas", designName: "Francecitas", durationMin: 15, priceCents: 300000 },
  DD: { label: "Degrade", designName: "Degrade", durationMin: 20, priceCents: 400000 },
  DS: { label: "Diseno Simple", durationMin: 5, priceCents: 45000 },
  DI: { label: "Diseno Intermedio", durationMin: 10, priceCents: 55000 },
  DC: { label: "Diseno Complejo", durationMin: 15, priceCents: 70000 },
  DP: { label: "Polvos Cromados/Aurora/Cat eye", designName: "Ojo de gato", durationMin: 15, priceCents: 300000 },
  DSU: { label: "Strass Unidad", durationMin: 5, priceCents: 10000 },
  DR: { label: "Diseno Relieve", designName: "Relieve o 3D", durationMin: 30, priceCents: 500000 },
  DA: { label: "Diseno Aplique", durationMin: 10, priceCents: 150000 },
  DM: { label: "Anime/Dibujos/Cartoon/Manga", durationMin: 20, priceCents: 800000 },
  DSM: { label: "Diseno Simple Mix", durationMin: 20, priceCents: 700000 },
  DIM: { label: "Diseno Intermedio Mix", durationMin: 30, priceCents: 800000 },
  DCM: { label: "Diseno Complejo Mix", durationMin: 30, priceCents: 1000000 },
};

const REPAIR_CODES = {
  RUES: { label: "Reparacion Esmalte Semi", serviceName: "Semipermanente", durationMin: 20, priceCents: 200000 },
  RUK: { label: "Reparacion Capping Gel", serviceName: "Capping Gel", durationMin: 20, priceCents: 300000 },
  RUKP: { label: "Reparacion Capping Polygel", serviceName: "Capping Polygel", durationMin: 25, priceCents: 300000 },
  RUS: { label: "Reparacion Soft Gel", serviceName: "Soft Gel", durationMin: 25, priceCents: 300000, inferred: true },
  RUSG: { label: "Reparacion Soft Gel", serviceName: "Soft Gel", durationMin: 25, priceCents: 300000 },
  RUE: { label: "Reparacion Esculpida", serviceName: "Esculpidas", durationMin: 30, priceCents: 400000 },
};

const REMOVAL_SERVICE_NAMES = {
  Semipermanente: "Semipermanente",
  Nivelacion: "Nivelacion",
  "Capping gel": "Capping Gel",
  "Capping polygel": "Capping Polygel",
  "Capping acrilico": "Esculpidas",
  "Soft gel": "Soft Gel",
  Esculpidas: "Esculpidas",
};

function parseArgs(argv) {
  const args = {
    source: DEFAULT_SOURCE,
    tenant: DEFAULT_TENANT_SLUG,
    staff: DEFAULT_STAFF_NAME,
    write: false,
    limit: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write") args.write = true;
    else if (arg === "--source") args.source = argv[++i];
    else if (arg === "--tenant") args.tenant = argv[++i];
    else if (arg === "--staff") args.staff = argv[++i];
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--help") {
      console.log(`Usage:
  node scripts/import-sofia-agenda.js [--tenant bby-nails] [--staff Sofia] [--write]

By default this is a dry-run. Use --write to insert appointments.`);
      process.exit(0);
    } else {
      throw new Error(`Argumento no reconocido: ${arg}`);
    }
  }

  return args;
}

function cell(row, index) {
  return String(row[index] ?? "").trim();
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function makeCustomerEmail(name) {
  const local = normalizeName(name).replace(/\s+/g, ".") || "cliente";
  return `import+${local}@bby-nails.local`;
}

function cleanPhone(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "*") return null;

  if (/^\d+(?:\.\d+)?e\+?\d+$/i.test(raw)) {
    return Number(raw).toFixed(0);
  }

  return raw.replace(/[^\d+]/g, "") || null;
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function buildContacts(rows) {
  const contacts = [];
  for (const row of rows.slice(1)) {
    const name = cell(row, 0);
    if (!name) continue;
    const phone = cleanPhone(cell(row, 1));
    contacts.push({
      name: name.trim(),
      phone,
      instagram: cell(row, 2) || null,
      normalized: normalizeName(name),
    });
  }
  return contacts;
}

function findContact(name, contacts) {
  const normalized = normalizeName(name);
  if (!normalized) return null;

  const exact = contacts.find((contact) => contact.normalized === normalized);
  if (exact) return exact;

  const tokens = normalized.split(" ").filter(Boolean);
  const fuzzy = contacts.filter((contact) => {
    const contactTokens = contact.normalized.split(" ");
    return tokens.every((token) => contactTokens.includes(token));
  });
  if (fuzzy.length === 1) return fuzzy[0];

  return null;
}

function isDayHeader(row) {
  return DAY_TEXT_COLUMNS.some((col) => /^\d{1,2}$/.test(cell(row, col)));
}

function parseTime(value) {
  const match = String(value ?? "").match(/^\/?(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseAppointmentText(rawText) {
  const cleaned = rawText
    .replace(/^\*+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  let match = cleaned.match(/^(.+?)\s+-\s+(.+)$/);
  if (!match) match = cleaned.match(/^([A-Z0-9+\/xX*.\-\s]+?)\s*-\s*(.+)$/i);
  if (!match) match = cleaned.match(/^([A-Z0-9+\/xX*.-]+)\s+(.{3,})$/i);
  if (!match) return null;

  const codePart = match[1].trim();
  const customerName = match[2].replace(/\s+/g, " ").trim();
  if (!codePart || !customerName) return null;

  return { codePart, customerName };
}

function normalizeCodePart(codePart) {
  return codePart
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\*+/, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "+");
}

function parseTokens(codePart) {
  const normalized = normalizeCodePart(codePart);
  const hasSlash = normalized.includes("/");
  return normalized
    .split(/[+/]/)
    .filter(Boolean)
    .map((raw) => {
      const token = raw.replace(/^\*+/, "");
      const match = token.match(/^(\d+)?([A-Z]+)(?:X(\d+))?$/);
      if (!match) return { raw: token, code: token, qty: 1 };
      return {
        raw: token,
        code: match[2],
        qty: Number(match[3] ?? match[1] ?? 1),
      };
    })
    .map((token) => ({ ...token, hasSlash }));
}

function classifyToken(token) {
  if (SERVICE_CODES[token.code]) return { kind: "service", ...SERVICE_CODES[token.code] };
  if (REMOVAL_CODES[token.code]) return { kind: "removal", ...REMOVAL_CODES[token.code] };
  if (DESIGN_CODES[token.code]) return { kind: "design", ...DESIGN_CODES[token.code] };
  if (REPAIR_CODES[token.code]) return { kind: "repair", ...REPAIR_CODES[token.code] };
  return { kind: "unknown", label: token.code, durationMin: 0, priceCents: 0 };
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function effectiveDuration(token) {
  if (token.kind === "design") return token.durationMin;
  return token.durationMin * Math.max(1, token.qty || 1);
}

function effectivePrice(token) {
  if (token.kind === "design" && token.code === "D") return token.priceCents;
  return token.priceCents * Math.max(1, token.qty || 1);
}

function localDate(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseMonth(sheetName, rows, contacts) {
  const month = MONTHS[sheetName];
  if (!month) return { appointments: [], skipped: [] };

  const currentDays = new Map();
  const appointments = [];
  const skipped = [];

  rows.forEach((row, rowIndex) => {
    if (isDayHeader(row)) {
      for (const textCol of DAY_TEXT_COLUMNS) {
        const day = cell(row, textCol);
        if (/^\d{1,2}$/.test(day)) currentDays.set(textCol, Number(day));
      }
      return;
    }

    for (const textCol of DAY_TEXT_COLUMNS) {
      const rawText = cell(row, textCol);
      if (!rawText) continue;

      const parsedText = parseAppointmentText(rawText);
      if (!parsedText) continue;

      const day = currentDays.get(textCol);
      const time = parseTime(cell(row, textCol - 1));
      const source = {
        sheet: sheetName,
        row: rowIndex + 1,
        timeColumn: textCol,
      };

      if (!day) {
        skipped.push({ ...source, rawText, reason: "sin_dia" });
        continue;
      }
      if (!time) {
        skipped.push({ ...source, rawText, reason: "sin_hora" });
        continue;
      }

      const date = isoDate(month.year, month.month, day);
      const contact = findContact(parsedText.customerName, contacts);
      const tokens = parseTokens(parsedText.codePart);
      const classified = tokens.map((token) => ({ ...token, ...classifyToken(token) }));
      const warnings = [];

      if (tokens.some((token) => token.hasSlash)) warnings.push("combo_con_barra_revisar");
      for (const token of classified) {
        if (token.inferred) warnings.push(`codigo_inferido:${token.code}`);
        if (token.kind === "unknown") warnings.push(`codigo_desconocido:${token.code}`);
      }

      const serviceParts = classified.filter((token) => token.kind === "service" && token.serviceName);
      const repairParts = classified.filter((token) => token.kind === "repair" && token.serviceName);
      const removalParts = classified.filter((token) => token.kind === "removal");
      const removalOnlyParts = removalParts
        .map((token) => ({
          ...token,
          serviceName: REMOVAL_SERVICE_NAMES[token.priorName] ?? null,
        }))
        .filter((token) => token.serviceName);
      const designParts = classified.filter((token) => token.kind === "design");
      const mainPart = serviceParts.at(-1) ?? repairParts.at(-1) ?? removalOnlyParts.at(-1) ?? null;

      if (!mainPart) {
        skipped.push({
          ...source,
          rawText,
          date,
          time,
          reason: "sin_servicio_principal",
          codes: tokens.map((token) => token.raw),
        });
        continue;
      }

      const counted = classified.filter((token) => token.kind !== "unknown");
      const totalDurationMin = Math.max(
        15,
        counted.reduce((total, token) => total + effectiveDuration(token), 0)
      );
      const totalPriceCents = counted.reduce(
        (total, token) => total + effectivePrice(token),
        0
      );
      const designName = designParts.length
        ? designParts.map((token) => token.designName ?? token.label).join(" + ")
        : null;
      const designPriceCents = designParts.length
        ? designParts.reduce(
            (total, token) => total + effectivePrice(token),
            0
          )
        : null;

      const startsAt = localDate(date, time);
      const sourceKey = [
        IMPORT_PREFIX,
        sheetName.replace(/\s+/g, "-"),
        date,
        time,
        normalizeName(parsedText.customerName).replace(/\s+/g, "-"),
        normalizeCodePart(parsedText.codePart),
      ].join(":");

      appointments.push({
        sourceKey,
        source,
        date,
        time,
        startsAt,
        endsAt: addMinutes(startsAt, totalDurationMin),
        rawText,
        codePart: parsedText.codePart,
        customerName: parsedText.customerName,
        customerPhone: contact?.phone ?? null,
        customerEmail: makeCustomerEmail(parsedText.customerName),
        codes: classified.map((token) => ({
          raw: token.raw,
          code: token.code,
          qty: token.qty,
          kind: token.kind,
          label: token.label,
        })),
        serviceName: mainPart.serviceName,
        priorServiceName: removalParts[0]?.priorName ?? null,
        procedureMode: removalParts.length ? "retiro" : mainPart.procedureMode ?? "fresh",
        designName,
        designPriceCents,
        totalDurationMin,
        totalPriceCents,
        warnings,
      });
    }
  });

  return { appointments, skipped };
}

function makeNotes(appointment) {
  const lines = [
    "Importado desde Sofia - Agenda.",
    `Original: ${appointment.rawText}`,
    `Codigos: ${appointment.codes.map((token) => token.raw).join(", ")}`,
    `Fuente: ${appointment.source.sheet}, fila ${appointment.source.row}`,
    `sourceKey: ${appointment.sourceKey}`,
  ];
  if (appointment.warnings.length) lines.push(`Revisar: ${appointment.warnings.join(", ")}`);
  return lines.join("\n");
}

function summarize(appointments, skipped) {
  const byMonth = appointments.reduce((acc, appointment) => {
    acc[appointment.source.sheet] = (acc[appointment.source.sheet] ?? 0) + 1;
    return acc;
  }, {});
  const warnings = appointments.filter((appointment) => appointment.warnings.length);

  console.log("Resumen de importacion Sofia Agenda");
  console.log(`  Turnos parseados: ${appointments.length}`);
  console.log(`  Filas salteadas: ${skipped.length}`);
  console.log(`  Con advertencias: ${warnings.length}`);
  for (const [sheet, count] of Object.entries(byMonth)) {
    console.log(`  ${sheet}: ${count}`);
  }
}

function printPreview(appointments, skipped, limit = 20) {
  const rows = appointments.slice(0, limit).map((appointment) => ({
    fecha: appointment.date,
    hora: appointment.time,
    cliente: appointment.customerName,
    servicio: appointment.serviceName,
    duracion: appointment.totalDurationMin,
    telefono: appointment.customerPhone ?? "",
    avisos: appointment.warnings.join(" | "),
    original: appointment.rawText,
  }));
  console.table(rows);

  if (skipped.length) {
    console.log("\nPrimeras filas salteadas:");
    console.table(skipped.slice(0, 15));
  }

  const warnings = appointments.filter((appointment) => appointment.warnings.length);
  if (warnings.length) {
    console.log("\nPrimeros turnos con advertencias:");
    console.table(
      warnings.slice(0, 15).map((appointment) => ({
        fecha: appointment.date,
        hora: appointment.time,
        cliente: appointment.customerName,
        servicio: appointment.serviceName,
        avisos: appointment.warnings.join(" | "),
        original: appointment.rawText,
      }))
    );
  }
}

async function resolveDb({ tenantSlug, staffName }) {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      staff: true,
      services: true,
      designs: true,
    },
  });
  if (!tenant) throw new Error(`No existe tenant con slug ${tenantSlug}`);

  const staff = tenant.staff.find(
    (item) => item.active && normalizeName(item.name) === normalizeName(staffName)
  );
  if (!staff) throw new Error(`No existe staff activo ${staffName} en ${tenantSlug}`);

  const servicesByName = new Map(
    tenant.services
      .filter((service) => service.active)
      .map((service) => [normalizeName(service.name), service])
  );
  const designsByName = new Map(
    tenant.designs
      .filter((design) => design.active)
      .map((design) => [normalizeName(design.name), design])
  );

  return { prisma, tenant, staff, servicesByName, designsByName };
}

async function writeAppointments(context, appointments, { limit }) {
  const { prisma, tenant, staff, servicesByName, designsByName } = context;
  const toWrite = limit ? appointments.slice(0, limit) : appointments;
  const results = { created: 0, duplicates: 0, missingService: 0, customersLinked: 0 };
  const now = new Date();

  for (const appointment of toWrite) {
    const service = servicesByName.get(normalizeName(appointment.serviceName));
    if (!service) {
      results.missingService += 1;
      console.warn(`Sin servicio en BD: ${appointment.serviceName} (${appointment.rawText})`);
      continue;
    }

    const phone = normalizePhone(appointment.customerPhone);
    const customer = phone
      ? await prisma.customer.upsert({
          where: { tenantId_phone: { tenantId: tenant.id, phone } },
          create: {
            tenantId: tenant.id,
            phone,
            name: appointment.customerName,
            email: appointment.customerEmail,
          },
          update: {
            name: appointment.customerName,
            email: appointment.customerEmail,
          },
          select: { id: true },
        })
      : null;

    const duplicate = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        staffId: staff.id,
        startsAt: appointment.startsAt,
        customerName: appointment.customerName,
      },
      select: { id: true, customerId: true },
    });
    if (duplicate) {
      if (customer && !duplicate.customerId) {
        await prisma.appointment.update({
          where: { id: duplicate.id },
          data: { customerId: customer.id },
        });
        results.customersLinked += 1;
      }
      results.duplicates += 1;
      continue;
    }

    const exactSource = await prisma.appointment.findFirst({
      where: {
        tenantId: tenant.id,
        notes: { contains: appointment.sourceKey },
      },
      select: { id: true, customerId: true },
    });
    if (exactSource) {
      if (customer && !exactSource.customerId) {
        await prisma.appointment.update({
          where: { id: exactSource.id },
          data: { customerId: customer.id },
        });
        results.customersLinked += 1;
      }
      results.duplicates += 1;
      continue;
    }

    const design = appointment.designName
      ? designsByName.get(normalizeName(appointment.designName))
      : null;
    const status = appointment.endsAt < now ? "COMPLETED" : "CONFIRMED";
    const priceCents = appointment.totalPriceCents || service.priceCents;
    const extraMinutes = Math.max(0, appointment.totalDurationMin - service.durationMin);

    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        customerId: customer?.id ?? null,
        staffId: staff.id,
        serviceId: service.id,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        notes: makeNotes(appointment),
        priceCents,
        depositCents: 0,
        priorServiceName: appointment.priorServiceName,
        priorAge: null,
        procedureMode: appointment.procedureMode,
        designId: design?.id ?? null,
        designName: appointment.designName,
        designPriceCents: appointment.designPriceCents,
        extraMinutes,
      },
    });

    results.created += 1;
  }

  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = path.resolve(args.source);
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8").replace(/^\uFEFF/, ""));
  const contacts = buildContacts(source.sheets.Contactos ?? []);
  const parsed = Object.entries(MONTHS).map(([sheetName]) =>
    parseMonth(sheetName, source.sheets[sheetName] ?? [], contacts)
  );
  const appointments = parsed.flatMap((result) => result.appointments);
  const skipped = parsed.flatMap((result) => result.skipped);

  appointments.sort((a, b) => a.startsAt - b.startsAt);
  summarize(appointments, skipped);
  printPreview(appointments, skipped, Math.min(args.limit ?? 20, 50));

  if (!args.write) {
    console.log("\nDry-run: no se escribio nada. Agrega --write para importar en la base.");
    return;
  }

  const context = await resolveDb({ tenantSlug: args.tenant, staffName: args.staff });
  try {
    const results = await writeAppointments(context, appointments, { limit: args.limit });
    console.log("\nResultado de escritura:");
    console.log(results);
  } finally {
    await context.prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
