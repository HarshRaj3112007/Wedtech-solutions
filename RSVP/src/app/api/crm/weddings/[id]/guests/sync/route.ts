import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, formatIndianPhone } from "@/lib/utils";
import { authenticateCRM } from "@/lib/auth/crm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Shape of a single guest record pushed by the CRM */
interface SyncGuestInput {
  name: string;
  phone: string;
  email?: string;
  side?: string;
  group?: string;
  events?: string[];
}

/**
 * POST /api/crm/weddings/:id/guests/sync
 *
 * CRM pushes an updated guest list; the platform upserts records.
 * Deduplicates by phone number (formatted to +91 standard).
 *
 * Body: { guests: SyncGuestInput[] }
 *
 * Returns: { created, updated, errors }
 *
 * Authentication: Bearer token (Planner.apiKey)
 */
export async function POST(req: Request, { params }: RouteParams) {
  const planner = await authenticateCRM(req);
  if (!planner) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the wedding belongs to this planner
    const wedding = await prisma.wedding.findFirst({
      where: { id, plannerId: planner.id },
      include: {
        events: { select: { id: true, name: true } },
      },
    });

    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const body: { guests?: SyncGuestInput[] } = await req.json();
    const { guests } = body;

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        apiError("Request body must include a non-empty guests array"),
        { status: 400 }
      );
    }

    // Build event name -> id map for matching
    const eventMap = new Map<string, string>();
    for (const event of wedding.events) {
      eventMap.set(event.name.toLowerCase().trim(), event.id);
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ index: number; name: string; reason: string }>,
    };

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];

      // Validate required fields
      if (!guest.name?.trim()) {
        results.errors.push({ index: i, name: "", reason: "Missing name" });
        continue;
      }
      if (!guest.phone?.trim()) {
        results.errors.push({
          index: i,
          name: guest.name,
          reason: "Missing phone",
        });
        continue;
      }

      const phone = formatIndianPhone(guest.phone.trim());

      // Parse relationship side
      const sideRaw = (guest.side || "").toUpperCase().trim();
      const relationshipSide =
        sideRaw === "BRIDE"
          ? "BRIDE"
          : sideRaw === "GROOM"
            ? "GROOM"
            : "MUTUAL";

      // Resolve event IDs from names
      const matchedEventIds: string[] = [];
      if (Array.isArray(guest.events)) {
        for (const eventName of guest.events) {
          const eventId = eventMap.get(eventName.toLowerCase().trim());
          if (eventId) {
            matchedEventIds.push(eventId);
          }
        }
      }

      try {
        // Check if guest already exists for this wedding + phone
        const existing = await prisma.guest.findUnique({
          where: { weddingId_phone: { weddingId: id, phone } },
          select: {
            id: true,
            eventInvites: { select: { eventId: true } },
          },
        });

        if (existing) {
          // Update existing guest
          await prisma.guest.update({
            where: { id: existing.id },
            data: {
              name: guest.name.trim(),
              email: guest.email?.trim() || undefined,
              relationshipSide: relationshipSide as
                | "BRIDE"
                | "GROOM"
                | "MUTUAL",
              groupTag: guest.group?.trim() || undefined,
            },
          });

          // Add event invites that don't already exist
          const existingEventIds = new Set(
            existing.eventInvites.map((ei) => ei.eventId)
          );
          const newEventIds = matchedEventIds.filter(
            (eid) => !existingEventIds.has(eid)
          );

          if (newEventIds.length > 0) {
            await prisma.guestEventInvite.createMany({
              data: newEventIds.map((eventId) => ({
                guestId: existing.id,
                eventId,
              })),
            });
          }

          results.updated++;
        } else {
          // Create new guest
          await prisma.guest.create({
            data: {
              weddingId: id,
              name: guest.name.trim(),
              phone,
              email: guest.email?.trim() || null,
              relationshipSide: relationshipSide as
                | "BRIDE"
                | "GROOM"
                | "MUTUAL",
              groupTag: guest.group?.trim() || null,
              ...(matchedEventIds.length > 0 && {
                eventInvites: {
                  create: matchedEventIds.map((eventId) => ({ eventId })),
                },
              }),
            },
          });

          results.created++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.errors.push({ index: i, name: guest.name, reason: message });
      }
    }

    return NextResponse.json(apiSuccess(results));
  } catch (error) {
    console.error("Error syncing CRM guests:", error);
    return NextResponse.json(
      apiError("Failed to sync guests"),
      { status: 500 }
    );
  }
}
