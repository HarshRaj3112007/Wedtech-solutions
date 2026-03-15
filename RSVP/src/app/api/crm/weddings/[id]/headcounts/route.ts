import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { authenticateCRM } from "@/lib/auth/crm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/weddings/:id/headcounts
 *
 * Returns per-event confirmed PAX counts for a wedding.
 * Used by the Wedding CRM (Product 1) to display headcount dashboards.
 *
 * Authentication: Bearer token (Planner.apiKey)
 */
export async function GET(req: Request, { params }: RouteParams) {
  const planner = await authenticateCRM(req);
  if (!planner) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the wedding belongs to this planner
    const wedding = await prisma.wedding.findFirst({
      where: { id, plannerId: planner.id },
      select: { id: true },
    });

    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    // Fetch all events for this wedding with their RSVP invites
    const events = await prisma.weddingEvent.findMany({
      where: { weddingId: id },
      orderBy: { date: "asc" },
      select: {
        id: true,
        name: true,
        date: true,
        guestEventInvites: {
          select: {
            rsvpStatus: true,
            plusOneCount: true,
            childrenCount: true,
          },
        },
      },
    });

    // Aggregate counts per event
    const data = events.map((event) => {
      let confirmed = 0;
      let plusOnes = 0;
      let children = 0;
      let declined = 0;
      let pending = 0;

      for (const invite of event.guestEventInvites) {
        switch (invite.rsvpStatus) {
          case "ATTENDING":
            confirmed++;
            plusOnes += invite.plusOneCount;
            children += invite.childrenCount;
            break;
          case "DECLINED":
            declined++;
            break;
          case "PENDING":
            pending++;
            break;
        }
      }

      const totalPax = confirmed + plusOnes + children;

      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date.toISOString(),
        confirmed,
        plusOnes,
        children,
        totalPax,
        declined,
        pending,
      };
    });

    return NextResponse.json(apiSuccess(data));
  } catch (error) {
    console.error("Error fetching headcounts:", error);
    return NextResponse.json(
      apiError("Failed to fetch headcounts"),
      { status: 500 }
    );
  }
}
