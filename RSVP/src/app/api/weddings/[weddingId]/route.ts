import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId — full wedding detail with events and counts */
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      include: {
        events: {
          orderBy: { date: "asc" },
          include: {
            _count: {
              select: {
                guestEventInvites: true,
                checkIns: true,
              },
            },
            guestEventInvites: {
              select: {
                rsvpStatus: true,
                plusOneCount: true,
                childrenCount: true,
              },
            },
          },
        },
        _count: {
          select: { guests: true },
        },
      },
    });

    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    // Compute per-event RSVP counts
    const eventsWithCounts = wedding.events.map((event) => {
      const invites = event.guestEventInvites;
      const attending = invites.filter((i) => i.rsvpStatus === "ATTENDING");
      const declined = invites.filter((i) => i.rsvpStatus === "DECLINED");
      const pending = invites.filter((i) => i.rsvpStatus === "PENDING");
      const plusOnes = attending.reduce((s, i) => s + i.plusOneCount, 0);
      const children = attending.reduce((s, i) => s + i.childrenCount, 0);

      // Remove raw invites from response to keep payload small
      const { guestEventInvites: _, ...eventData } = event;

      return {
        ...eventData,
        rsvpCounts: {
          total: invites.length,
          attending: attending.length,
          declined: declined.length,
          pending: pending.length,
          plusOnes,
          children,
          totalPax: attending.length + plusOnes + children,
        },
      };
    });

    const { events: _, ...weddingData } = wedding;

    return NextResponse.json(
      apiSuccess({
        ...weddingData,
        events: eventsWithCounts,
      })
    );
  } catch (error) {
    console.error("Error fetching wedding:", error);
    return NextResponse.json(apiError("Failed to fetch wedding"), {
      status: 500,
    });
  }
}

/** PATCH /api/weddings/:weddingId — update wedding details */
export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    // Verify ownership
    const existing = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const body = await req.json();
    const {
      brideName,
      groomName,
      city,
      venueName,
      primaryColorHex,
      secondaryColorHex,
      bannerImageUrl,
      timezone,
      rsvpDeadline,
      photoWallEnabled,
    } = body;

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        ...(brideName !== undefined && { brideName }),
        ...(groomName !== undefined && { groomName }),
        ...(city !== undefined && { city }),
        ...(venueName !== undefined && { venueName }),
        ...(primaryColorHex !== undefined && { primaryColorHex }),
        ...(secondaryColorHex !== undefined && { secondaryColorHex }),
        ...(bannerImageUrl !== undefined && { bannerImageUrl }),
        ...(timezone !== undefined && { timezone }),
        ...(rsvpDeadline !== undefined && {
          rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        }),
        ...(photoWallEnabled !== undefined && { photoWallEnabled }),
      },
    });

    return NextResponse.json(apiSuccess(wedding));
  } catch (error) {
    console.error("Error updating wedding:", error);
    return NextResponse.json(apiError("Failed to update wedding"), {
      status: 500,
    });
  }
}

/** DELETE /api/weddings/:weddingId — delete wedding and all related data */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    const existing = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    // Cascade delete handles all related records
    await prisma.wedding.delete({ where: { id: weddingId } });

    return NextResponse.json(apiSuccess({ deleted: true }));
  } catch (error) {
    console.error("Error deleting wedding:", error);
    return NextResponse.json(apiError("Failed to delete wedding"), {
      status: 500,
    });
  }
}
