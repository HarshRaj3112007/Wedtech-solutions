import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, slugify } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId/events — list all events for a wedding */
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const events = await prisma.weddingEvent.findMany({
      where: { weddingId },
      orderBy: { date: "asc" },
      include: {
        _count: {
          select: {
            guestEventInvites: true,
            checkIns: true,
          },
        },
      },
    });

    return NextResponse.json(apiSuccess(events));
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(apiError("Failed to fetch events"), {
      status: 500,
    });
  }
}

/** POST /api/weddings/:weddingId/events — create a new event */
export async function POST(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const body = await req.json();
    const { name, date, time, venue, dressCode, description, isActive, checkInPin } = body;

    if (!name || !date) {
      return NextResponse.json(
        apiError("Event name and date are required"),
        { status: 400 }
      );
    }

    const slug = slugify(name);

    // Check for duplicate slug within this wedding
    const existingSlug = await prisma.weddingEvent.findUnique({
      where: { weddingId_slug: { weddingId, slug } },
    });
    if (existingSlug) {
      return NextResponse.json(
        apiError(`An event with slug "${slug}" already exists in this wedding`),
        { status: 409 }
      );
    }

    const event = await prisma.weddingEvent.create({
      data: {
        weddingId,
        name,
        slug,
        date: new Date(date),
        time: time || null,
        venue: venue || null,
        dressCode: dressCode || null,
        description: description || null,
        isActive: isActive ?? true,
        checkInPin: checkInPin || null,
      },
    });

    return NextResponse.json(apiSuccess(event), { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(apiError("Failed to create event"), {
      status: 500,
    });
  }
}
