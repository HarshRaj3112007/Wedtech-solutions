import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

/**
 * GET /api/display/:weddingCode?token=xxx
 * Public endpoint (token-gated) returning live RSVP counts for large-screen display.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ weddingCode: string }> }
) {
  const { weddingCode } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json(apiError("Display token is required"), { status: 401 });
  }

  try {
    // Validate token
    const displayToken = await prisma.displayToken.findUnique({
      where: { token },
      include: { wedding: { select: { weddingCode: true } } },
    });

    if (!displayToken) {
      return NextResponse.json(apiError("Invalid display token"), { status: 403 });
    }

    if (displayToken.wedding.weddingCode !== weddingCode) {
      return NextResponse.json(apiError("Token does not match this wedding"), { status: 403 });
    }

    if (new Date() > displayToken.expiresAt) {
      return NextResponse.json(apiError("Display token has expired"), { status: 403 });
    }

    // Fetch wedding + event RSVP counts
    const wedding = await prisma.wedding.findUnique({
      where: { weddingCode },
      select: {
        brideName: true,
        groomName: true,
        primaryColorHex: true,
        secondaryColorHex: true,
        events: {
          where: { isActive: true },
          orderBy: { date: "asc" },
          select: {
            name: true,
            date: true,
            guestEventInvites: {
              select: { rsvpStatus: true },
            },
          },
        },
      },
    });

    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const events = wedding.events.map((ev) => {
      const invites = ev.guestEventInvites;
      return {
        name: ev.name,
        date: ev.date.toISOString(),
        attending: invites.filter((i) => i.rsvpStatus === "ATTENDING").length,
        declined: invites.filter((i) => i.rsvpStatus === "DECLINED").length,
        pending: invites.filter((i) => i.rsvpStatus === "PENDING").length,
        totalInvited: invites.length,
      };
    });

    return NextResponse.json(
      apiSuccess({
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        primaryColorHex: wedding.primaryColorHex,
        secondaryColorHex: wedding.secondaryColorHex,
        events,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Display data error:", error);
    return NextResponse.json(apiError("Failed to fetch display data"), { status: 500 });
  }
}
