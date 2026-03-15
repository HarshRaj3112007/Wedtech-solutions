import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/**
 * GET /api/weddings/:weddingId/analytics
 * Returns comprehensive analytics data: per-event breakdowns,
 * dietary stats, outstation ratios, RSVP timeline, pending list.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true, brideName: true, groomName: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    // Fetch all events with invites and guest data
    const events = await prisma.weddingEvent.findMany({
      where: { weddingId },
      orderBy: { date: "asc" },
      include: {
        guestEventInvites: {
          include: {
            guest: {
              select: {
                id: true,
                name: true,
                phone: true,
                dietaryPref: true,
                dietaryNotes: true,
                isOutstation: true,
                isVip: true,
                relationshipSide: true,
                groupTag: true,
              },
            },
          },
        },
        _count: { select: { checkIns: true } },
      },
    });

    // Per-event attendance forecast
    const eventBreakdowns = events.map((event) => {
      const invites = event.guestEventInvites;
      const attending = invites.filter((i) => i.rsvpStatus === "ATTENDING");
      const declined = invites.filter((i) => i.rsvpStatus === "DECLINED");
      const pending = invites.filter((i) => i.rsvpStatus === "PENDING");
      const plusOnes = attending.reduce((s, i) => s + i.plusOneCount, 0);
      const children = attending.reduce((s, i) => s + i.childrenCount, 0);

      // Dietary breakdown (attending guests only)
      const dietaryBreakdown: Record<string, number> = {};
      for (const inv of attending) {
        const pref = inv.guest.dietaryPref;
        dietaryBreakdown[pref] = (dietaryBreakdown[pref] || 0) + 1;
      }

      // Outstation vs local (attending guests)
      const outstationCount = attending.filter((i) => i.guest.isOutstation).length;
      const localCount = attending.length - outstationCount;

      // VIP count
      const vipCount = attending.filter((i) => i.guest.isVip).length;

      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date.toISOString(),
        totalInvited: invites.length,
        attending: attending.length,
        declined: declined.length,
        pending: pending.length,
        plusOnes,
        children,
        totalPax: attending.length + plusOnes + children,
        checkedIn: event._count.checkIns,
        dietaryBreakdown,
        outstationCount,
        localCount,
        vipCount,
      };
    });

    // RSVP response timeline: count responses per day
    const allInvites = events.flatMap((e) => e.guestEventInvites);
    const responded = allInvites.filter((i) => i.respondedAt);
    const timelineMap = new Map<string, number>();
    for (const inv of responded) {
      if (inv.respondedAt) {
        const day = inv.respondedAt.toISOString().slice(0, 10);
        timelineMap.set(day, (timelineMap.get(day) || 0) + 1);
      }
    }
    const rsvpTimeline = Array.from(timelineMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Pending RSVP list
    const pendingGuests = allInvites
      .filter((i) => i.rsvpStatus === "PENDING")
      .map((i) => ({
        guestId: i.guest.id,
        guestName: i.guest.name,
        guestPhone: i.guest.phone,
        eventName: events.find((e) => e.id === i.eventId)?.name || "",
        side: i.guest.relationshipSide,
        group: i.guest.groupTag,
        isVip: i.guest.isVip,
        reminderCount: i.reminderCount,
      }));

    // Allergy / special diet guests (for caterer briefs)
    const allergyGuests = allInvites
      .filter(
        (i) =>
          i.rsvpStatus === "ATTENDING" &&
          i.guest.dietaryNotes &&
          i.guest.dietaryNotes.trim().length > 0
      )
      .map((i) => ({
        name: i.guest.name,
        notes: i.guest.dietaryNotes!,
        isVip: i.guest.isVip,
        eventName: events.find((e) => e.id === i.eventId)?.name || "",
      }));

    // Overall stats
    const totalGuests = await prisma.guest.count({ where: { weddingId } });
    const totalAttending = allInvites.filter((i) => i.rsvpStatus === "ATTENDING").length;
    const totalDeclined = allInvites.filter((i) => i.rsvpStatus === "DECLINED").length;
    const totalPending = allInvites.filter((i) => i.rsvpStatus === "PENDING").length;
    const responseRate =
      allInvites.length > 0
        ? Math.round(((totalAttending + totalDeclined) / allInvites.length) * 100)
        : 0;

    return NextResponse.json(
      apiSuccess({
        overview: {
          totalGuests,
          totalInvitations: allInvites.length,
          totalAttending,
          totalDeclined,
          totalPending,
          responseRate,
        },
        eventBreakdowns,
        rsvpTimeline,
        pendingGuests,
        allergyGuests,
      })
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(apiError("Failed to fetch analytics"), { status: 500 });
  }
}
