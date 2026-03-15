import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, slugify } from "@/lib/utils";
import type { WeddingCard } from "@/lib/types";

/** GET /api/weddings — list all weddings for the authenticated planner */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  try {
    const weddings = await prisma.wedding.findMany({
      where: { plannerId: session.user.id },
      include: {
        events: {
          orderBy: { date: "asc" },
          select: { id: true, date: true },
        },
        _count: { select: { guests: true } },
        guests: {
          select: {
            eventInvites: {
              select: { rsvpStatus: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const cards: WeddingCard[] = weddings.map((w) => {
      const totalInvites = w.guests.reduce(
        (sum, g) => sum + g.eventInvites.length,
        0
      );
      const responded = w.guests.reduce(
        (sum, g) =>
          sum +
          g.eventInvites.filter((ei) => ei.rsvpStatus !== "PENDING").length,
        0
      );
      const responseRate =
        totalInvites > 0 ? Math.round((responded / totalInvites) * 100) : 0;

      const now = new Date();
      const upcomingEvent = w.events.find((e) => new Date(e.date) >= now);

      return {
        id: w.id,
        brideName: w.brideName,
        groomName: w.groomName,
        weddingCode: w.weddingCode,
        city: w.city,
        primaryColorHex: w.primaryColorHex,
        bannerImageUrl: w.bannerImageUrl,
        rsvpDeadline: w.rsvpDeadline?.toISOString() ?? null,
        guestCount: w._count.guests,
        responseRate,
        lastActivity: w.updatedAt.toISOString(),
        upcomingEventDate: upcomingEvent?.date.toISOString() ?? null,
      };
    });

    return NextResponse.json(apiSuccess(cards));
  } catch (error) {
    console.error("Error fetching weddings:", error);
    return NextResponse.json(apiError("Failed to fetch weddings"), {
      status: 500,
    });
  }
}

/** POST /api/weddings — create a new wedding */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  try {
    const body = await req.json();
    const { brideName, groomName, weddingCode, city, venueName, primaryColorHex, secondaryColorHex, timezone, rsvpDeadline } = body;

    if (!brideName || !groomName) {
      return NextResponse.json(
        apiError("Bride and groom names are required"),
        { status: 400 }
      );
    }

    // Auto-generate wedding code if not provided
    const code = weddingCode || slugify(`${brideName}-${groomName}-${new Date().getFullYear()}`);

    const existing = await prisma.wedding.findUnique({
      where: { weddingCode: code },
    });
    if (existing) {
      return NextResponse.json(
        apiError("This wedding code is already taken. Try a different one."),
        { status: 409 }
      );
    }

    const wedding = await prisma.wedding.create({
      data: {
        plannerId: session.user.id,
        brideName,
        groomName,
        weddingCode: code,
        city: city || null,
        venueName: venueName || null,
        primaryColorHex: primaryColorHex || "#B8860B",
        secondaryColorHex: secondaryColorHex || "#800020",
        timezone: timezone || "Asia/Kolkata",
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
      },
    });

    return NextResponse.json(apiSuccess(wedding), { status: 201 });
  } catch (error) {
    console.error("Error creating wedding:", error);
    return NextResponse.json(apiError("Failed to create wedding"), {
      status: 500,
    });
  }
}
