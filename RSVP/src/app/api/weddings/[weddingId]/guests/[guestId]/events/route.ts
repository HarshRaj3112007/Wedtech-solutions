import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string; guestId: string }>;
}

/**
 * PUT /api/weddings/:weddingId/guests/:guestId/events
 * Replace all event assignments for a guest.
 * Body: { eventIds: string[] }
 */
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId, guestId } = await params;

  try {
    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        weddingId,
        wedding: { plannerId: session.user.id },
      },
      include: { eventInvites: true },
    });
    if (!guest) {
      return NextResponse.json(apiError("Guest not found"), { status: 404 });
    }

    const { eventIds } = await req.json();
    if (!Array.isArray(eventIds)) {
      return NextResponse.json(apiError("eventIds must be an array"), { status: 400 });
    }

    // Validate all eventIds belong to this wedding
    const validEvents = await prisma.weddingEvent.findMany({
      where: { weddingId, id: { in: eventIds } },
      select: { id: true },
    });
    const validIds = new Set(validEvents.map((e) => e.id));
    const invalidIds = eventIds.filter((id: string) => !validIds.has(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        apiError(`Invalid event IDs: ${invalidIds.join(", ")}`),
        { status: 400 }
      );
    }

    const currentEventIds = new Set(guest.eventInvites.map((ei) => ei.eventId));
    const toAdd = eventIds.filter((id: string) => !currentEventIds.has(id));
    const toRemove = guest.eventInvites
      .filter((ei) => !eventIds.includes(ei.eventId))
      // Only remove invites that are still PENDING — don't blow away responded invites
      .filter((ei) => ei.rsvpStatus === "PENDING")
      .map((ei) => ei.id);

    await prisma.$transaction([
      // Create new invites
      ...(toAdd.length > 0
        ? [
            prisma.guestEventInvite.createMany({
              data: toAdd.map((eventId: string) => ({
                guestId,
                eventId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
      // Remove pending invites for unassigned events
      ...(toRemove.length > 0
        ? [
            prisma.guestEventInvite.deleteMany({
              where: { id: { in: toRemove } },
            }),
          ]
        : []),
    ]);

    // Return updated guest
    const updated = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        eventInvites: {
          include: { event: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(apiSuccess(updated));
  } catch (error) {
    console.error("Error updating guest events:", error);
    return NextResponse.json(apiError("Failed to update event assignments"), {
      status: 500,
    });
  }
}
