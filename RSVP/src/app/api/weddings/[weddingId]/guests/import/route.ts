import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, formatIndianPhone, isValidIndianPhone } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

interface CSVRow {
  name: string;
  phone: string;
  email?: string;
  side?: string;
  group?: string;
  events?: string;
  vip?: string;
  outstation?: string;
  dietary?: string;
  plus_one?: string;
}

/**
 * POST /api/weddings/:weddingId/guests/import
 * Bulk import guests from parsed CSV data.
 * Expects JSON body: { rows: CSVRow[] }
 * Client-side parses CSV; server validates and imports.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      include: {
        events: { select: { id: true, name: true } },
      },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const body = await req.json();
    const rawRows: Record<string, string>[] = body.rows;

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(apiError("No data to import"), { status: 400 });
    }

    // Normalize column headers to lowercase so CSVs with "Name", "Phone", "Diet" etc. work
    const rows: CSVRow[] = rawRows.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key.toLowerCase().trim()] = value;
      }
      return {
        name: normalized.name || "",
        phone: normalized.phone || "",
        email: normalized.email || "",
        side: normalized.side || "",
        group: normalized.group || "",
        events: normalized.events || "",
        vip: normalized.vip || "",
        outstation: normalized.outstation || "",
        dietary: normalized.dietary || normalized.diet || "",
        plus_one: normalized.plus_one || normalized["plus one"] || "",
      };
    });

    // Build event name -> id map for matching
    const eventMap = new Map<string, string>();
    for (const event of wedding.events) {
      eventMap.set(event.name.toLowerCase().trim(), event.id);
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; name: string; reason: string }>,
    };

    // Get existing phones for dedup
    const existingGuests = await prisma.guest.findMany({
      where: { weddingId },
      select: { phone: true },
    });
    const existingPhones = new Set(existingGuests.map((g) => g.phone));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      if (!row.name?.trim()) {
        results.errors.push({ row: rowNum, name: "", reason: "Missing name" });
        results.skipped++;
        continue;
      }

      if (!row.phone?.trim()) {
        results.errors.push({ row: rowNum, name: row.name, reason: "Missing phone" });
        results.skipped++;
        continue;
      }

      const phone = formatIndianPhone(row.phone.trim());

      if (!isValidIndianPhone(phone)) {
        results.errors.push({ row: rowNum, name: row.name, reason: `Invalid phone: ${phone}` });
        results.skipped++;
        continue;
      }

      // Deduplicate
      if (existingPhones.has(phone)) {
        results.errors.push({ row: rowNum, name: row.name, reason: `Duplicate phone: ${phone}` });
        results.skipped++;
        continue;
      }

      // Parse relationship side
      const sideRaw = (row.side || "").toUpperCase().trim();
      const relationshipSide =
        sideRaw === "BRIDE" ? "BRIDE" : sideRaw === "GROOM" ? "GROOM" : "MUTUAL";

      // Parse dietary
      const dietaryRaw = (row.dietary || "").toUpperCase().replace(/[- ]/g, "_").trim();
      const dietaryAliases: Record<string, string> = {
        VEGETARIAN: "VEG",
        VEG: "VEG",
        NON_VEGETARIAN: "NON_VEG",
        NONVEG: "NON_VEG",
        NON_VEG: "NON_VEG",
        JAIN: "JAIN",
        VEGAN: "VEGAN",
        CUSTOM: "CUSTOM",
      };
      const validDiets = ["VEG", "NON_VEG", "JAIN", "VEGAN", "CUSTOM"];
      const dietaryPref = dietaryAliases[dietaryRaw] || (validDiets.includes(dietaryRaw) ? dietaryRaw : "VEG");

      // Parse boolean flags
      const isVip = ["true", "yes", "1"].includes((row.vip || "").toLowerCase().trim());
      const isOutstation = ["true", "yes", "1"].includes((row.outstation || "").toLowerCase().trim());
      const plusOneAllowed = ["true", "yes", "1"].includes((row.plus_one || "").toLowerCase().trim());

      // Match events by name
      const eventNames = (row.events || "")
        .split(",")
        .map((e) => e.toLowerCase().trim())
        .filter(Boolean);
      const matchedEventIds = eventNames
        .map((en) => eventMap.get(en))
        .filter((id): id is string => !!id);

      try {
        await prisma.guest.create({
          data: {
            weddingId,
            name: row.name.trim(),
            phone,
            email: row.email?.trim() || null,
            relationshipSide: relationshipSide as "BRIDE" | "GROOM" | "MUTUAL",
            groupTag: row.group?.trim() || null,
            isVip,
            isOutstation,
            dietaryPref: dietaryPref as "VEG" | "NON_VEG" | "JAIN" | "VEGAN" | "CUSTOM",
            plusOneAllowed,
            ...(matchedEventIds.length > 0 && {
              eventInvites: {
                create: matchedEventIds.map((eventId) => ({ eventId })),
              },
            }),
          },
        });

        existingPhones.add(phone); // prevent duplicates within same batch
        results.imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.errors.push({ row: rowNum, name: row.name, reason: message });
        results.skipped++;
      }
    }

    return NextResponse.json(apiSuccess(results));
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(apiError("Failed to import guests"), { status: 500 });
  }
}
