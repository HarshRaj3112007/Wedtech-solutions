import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ guestToken: string }>;
}

/**
 * GET /api/guests/:guestToken — fetch guest portal data (no auth needed, token IS auth)
 * Returns guest info + all events they're invited to + accommodation + wedding theme
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { guestToken } = await params;

  try {
    const guest = await prisma.guest.findUnique({
      where: { token: guestToken },
      include: {
        wedding: {
          select: {
            id: true,
            brideName: true,
            groomName: true,
            weddingCode: true,
            city: true,
            venueName: true,
            primaryColorHex: true,
            secondaryColorHex: true,
            bannerImageUrl: true,
            timezone: true,
            rsvpDeadline: true,
          },
        },
        eventInvites: {
          include: {
            event: true,
            seatingTable: true,
          },
          orderBy: { event: { date: "asc" } },
        },
        accommodationRoom: true,
        plusOnes: true,
        checkIns: true,
      },
    });

    if (!guest) {
      return NextResponse.json(apiError("Invalid invite link"), { status: 404 });
    }

    return NextResponse.json(apiSuccess(guest));
  } catch (error) {
    console.error("Error fetching guest data:", error);
    return NextResponse.json(apiError("Failed to load invitation"), { status: 500 });
  }
}
