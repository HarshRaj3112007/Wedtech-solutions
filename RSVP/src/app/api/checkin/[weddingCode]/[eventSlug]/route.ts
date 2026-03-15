import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, verifyHmac } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingCode: string; eventSlug: string }>;
}

/** POST /api/checkin/:weddingCode/:eventSlug — check in a guest */
export async function POST(req: Request, { params }: RouteParams) {
  const { weddingCode, eventSlug } = await params;

  try {
    const body = await req.json();
    const { pin, guestId, method, checkedInBy, qrData } = body;

    // Find the event
    const event = await prisma.weddingEvent.findFirst({
      where: {
        slug: eventSlug,
        wedding: { weddingCode },
      },
      include: { wedding: { select: { id: true } } },
    });

    if (!event) {
      return NextResponse.json(apiError("Event not found"), { status: 404 });
    }

    // Verify staff PIN
    if (event.checkInPin && event.checkInPin !== pin) {
      return NextResponse.json(apiError("Invalid check-in PIN"), { status: 403 });
    }

    let resolvedGuestId = guestId;

    // If QR scan, parse and verify the QR payload
    if (method === "QR" && qrData) {
      try {
        const parsed = JSON.parse(qrData);
        const isValid = await verifyHmac(
          `${parsed.guestId}:${parsed.eventId}`,
          parsed.signature
        );
        if (!isValid) {
          return NextResponse.json(apiError("Invalid QR code — possible forgery"), { status: 403 });
        }
        if (parsed.eventId !== event.id) {
          return NextResponse.json(apiError("QR code is for a different event"), { status: 400 });
        }
        resolvedGuestId = parsed.guestId;
      } catch {
        return NextResponse.json(apiError("Invalid QR code format"), { status: 400 });
      }
    }

    if (!resolvedGuestId) {
      return NextResponse.json(apiError("Guest ID is required"), { status: 400 });
    }

    // Check guest is invited to this event
    const invite = await prisma.guestEventInvite.findUnique({
      where: {
        guestId_eventId: {
          guestId: resolvedGuestId,
          eventId: event.id,
        },
      },
      include: {
        guest: {
          select: {
            name: true,
            phone: true,
            dietaryPref: true,
            dietaryNotes: true,
            isVip: true,
            plusOnes: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        apiError("Guest is not invited to this event"),
        { status: 404 }
      );
    }

    // Check for duplicate check-in
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        guestId_eventId: {
          guestId: resolvedGuestId,
          eventId: event.id,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        apiSuccess({
          alreadyCheckedIn: true,
          checkedInAt: existingCheckIn.checkedInAt,
          guest: invite.guest,
          seatingTableId: invite.seatingTableId,
          plusOneCount: invite.plusOneCount,
        })
      );
    }

    // Perform check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        guestId: resolvedGuestId,
        eventId: event.id,
        checkedInBy: checkedInBy || "Staff",
        method: method === "QR" ? "QR" : "MANUAL",
      },
    });

    // Get seating table if assigned
    let seatingTable = null;
    if (invite.seatingTableId) {
      seatingTable = await prisma.seatingTable.findUnique({
        where: { id: invite.seatingTableId },
        select: { tableNumber: true, label: true, zone: true },
      });
    }

    return NextResponse.json(
      apiSuccess({
        alreadyCheckedIn: false,
        checkedInAt: checkIn.checkedInAt,
        guest: invite.guest,
        seatingTable,
        plusOneCount: invite.plusOneCount,
        childrenCount: invite.childrenCount,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(apiError("Check-in failed"), { status: 500 });
  }
}

/** GET /api/checkin/:weddingCode/:eventSlug — get check-in stats + search guests */
export async function GET(req: Request, { params }: RouteParams) {
  const { weddingCode, eventSlug } = await params;
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  try {
    const event = await prisma.weddingEvent.findFirst({
      where: {
        slug: eventSlug,
        wedding: { weddingCode },
      },
      select: { id: true, name: true, weddingId: true },
    });

    if (!event) {
      return NextResponse.json(apiError("Event not found"), { status: 404 });
    }

    // Get total invited and checked-in counts
    const [totalInvited, totalCheckedIn] = await Promise.all([
      prisma.guestEventInvite.count({
        where: { eventId: event.id, rsvpStatus: "ATTENDING" },
      }),
      prisma.checkIn.count({ where: { eventId: event.id } }),
    ]);

    // If search query, find matching guests
    let matchedGuests: Array<{
      id: string;
      name: string;
      phone: string;
      isVip: boolean;
      checkedIn: boolean;
    }> = [];

    if (search) {
      const guests = await prisma.guest.findMany({
        where: {
          weddingId: event.weddingId,
          eventInvites: { some: { eventId: event.id } },
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        },
        select: {
          id: true,
          name: true,
          phone: true,
          isVip: true,
          checkIns: {
            where: { eventId: event.id },
            select: { id: true },
          },
        },
        take: 20,
      });

      matchedGuests = guests.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        isVip: g.isVip,
        checkedIn: g.checkIns.length > 0,
      }));
    }

    return NextResponse.json(
      apiSuccess({
        eventName: event.name,
        totalInvited,
        totalCheckedIn,
        guests: matchedGuests,
      })
    );
  } catch (error) {
    console.error("Check-in stats error:", error);
    return NextResponse.json(apiError("Failed to fetch check-in data"), { status: 500 });
  }
}
