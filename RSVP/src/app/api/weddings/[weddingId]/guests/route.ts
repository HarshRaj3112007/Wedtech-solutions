import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, paginationParams, formatIndianPhone } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId/guests — paginated guest list with filters */
export async function GET(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
  const search = url.searchParams.get("search") || "";
  const side = url.searchParams.get("side") || "";
  const group = url.searchParams.get("group") || "";
  const rsvpStatus = url.searchParams.get("rsvpStatus") || "";
  const eventId = url.searchParams.get("eventId") || "";
  const isOutstation = url.searchParams.get("isOutstation");
  const isVip = url.searchParams.get("isVip");
  const dietary = url.searchParams.get("dietary") || "";
  const noAccommodation = url.searchParams.get("noAccommodation");

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const { skip, take, page: safePage, pageSize: safeSize } = paginationParams(page, pageSize);

    // Build dynamic where clause
    const where: Record<string, unknown> = { weddingId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (side) where.relationshipSide = side;
    if (group) where.groupTag = group;
    if (isOutstation === "true") where.isOutstation = true;
    if (isVip === "true") where.isVip = true;
    if (dietary) where.dietaryPref = dietary;
    if (noAccommodation === "true") {
      where.isOutstation = true;
      where.accommodationRoomId = null;
    }

    // RSVP status filter requires filtering through eventInvites
    if (rsvpStatus || eventId) {
      const inviteFilter: Record<string, unknown> = {};
      if (rsvpStatus) inviteFilter.rsvpStatus = rsvpStatus;
      if (eventId) inviteFilter.eventId = eventId;
      where.eventInvites = { some: inviteFilter };
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        skip,
        take,
        orderBy: [{ isVip: "desc" }, { name: "asc" }],
        include: {
          eventInvites: {
            include: {
              event: { select: { id: true, name: true, slug: true, date: true } },
            },
          },
          accommodationRoom: {
            select: { id: true, hotelName: true, roomNumber: true },
          },
          plusOnes: true,
        },
      }),
      prisma.guest.count({ where }),
    ]);

    return NextResponse.json(
      apiSuccess(guests, { page: safePage, pageSize: safeSize, total })
    );
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(apiError("Failed to fetch guests"), { status: 500 });
  }
}

/** POST /api/weddings/:weddingId/guests — add a single guest */
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
    const {
      name,
      phone,
      email,
      relationshipSide,
      groupTag,
      isVip,
      isOutstation,
      dietaryPref,
      dietaryNotes,
      plusOneAllowed,
      eventIds,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        apiError("Guest name and phone are required"),
        { status: 400 }
      );
    }

    const formattedPhone = formatIndianPhone(phone);

    // Check for duplicate phone in this wedding
    const existing = await prisma.guest.findUnique({
      where: { weddingId_phone: { weddingId, phone: formattedPhone } },
    });
    if (existing) {
      return NextResponse.json(
        apiError(`A guest with phone ${formattedPhone} already exists`),
        { status: 409 }
      );
    }

    const guest = await prisma.guest.create({
      data: {
        weddingId,
        name,
        phone: formattedPhone,
        email: email || null,
        relationshipSide: relationshipSide || "MUTUAL",
        groupTag: groupTag || null,
        isVip: isVip || false,
        isOutstation: isOutstation || false,
        dietaryPref: dietaryPref || "VEG",
        dietaryNotes: dietaryNotes || null,
        plusOneAllowed: plusOneAllowed || false,
        // Create event invites if eventIds provided
        ...(eventIds?.length && {
          eventInvites: {
            create: eventIds.map((eventId: string) => ({
              eventId,
            })),
          },
        }),
      },
      include: {
        eventInvites: {
          include: { event: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(apiSuccess(guest), { status: 201 });
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json(apiError("Failed to create guest"), { status: 500 });
  }
}
