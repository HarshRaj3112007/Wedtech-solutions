import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, paginationParams } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId/seating — list tables, optionally filtered by eventId */
export async function GET(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
  const eventId = url.searchParams.get("eventId") || "";

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const { skip, take, page: safePage, pageSize: safeSize } = paginationParams(page, pageSize);

    const where: Record<string, unknown> = { weddingId };

    if (eventId) {
      where.eventId = eventId;
    }

    const [tables, total] = await Promise.all([
      prisma.seatingTable.findMany({
        where,
        skip,
        take,
        orderBy: [{ eventId: "asc" }, { tableNumber: "asc" }],
        include: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              date: true,
            },
          },
          assignedGuests: {
            include: {
              guest: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  isVip: true,
                  dietaryPref: true,
                  groupTag: true,
                },
              },
            },
          },
        },
      }),
      prisma.seatingTable.count({ where }),
    ]);

    return NextResponse.json(
      apiSuccess(tables, { page: safePage, pageSize: safeSize, total })
    );
  } catch (error) {
    console.error("Error fetching seating tables:", error);
    return NextResponse.json(apiError("Failed to fetch seating tables"), {
      status: 500,
    });
  }
}

/** POST /api/weddings/:weddingId/seating — create a new seating table */
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
      eventId,
      tableNumber,
      capacity,
      label,
      zone,
      positionX,
      positionY,
    } = body as {
      eventId?: string;
      tableNumber?: number;
      capacity?: number;
      label?: string;
      zone?: string;
      positionX?: number;
      positionY?: number;
    };

    if (!eventId || tableNumber === undefined || tableNumber === null || !capacity) {
      return NextResponse.json(
        apiError("eventId, tableNumber, and capacity are required"),
        { status: 400 }
      );
    }

    if (tableNumber < 1) {
      return NextResponse.json(
        apiError("tableNumber must be at least 1"),
        { status: 400 }
      );
    }

    if (capacity < 1) {
      return NextResponse.json(
        apiError("capacity must be at least 1"),
        { status: 400 }
      );
    }

    // Verify the event belongs to this wedding
    const event = await prisma.weddingEvent.findFirst({
      where: { id: eventId, weddingId },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json(
        apiError("Event not found in this wedding"),
        { status: 404 }
      );
    }

    // Check unique constraint: (weddingId, eventId, tableNumber)
    const existing = await prisma.seatingTable.findUnique({
      where: {
        weddingId_eventId_tableNumber: {
          weddingId,
          eventId,
          tableNumber,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        apiError(
          `Table number ${tableNumber} already exists for this event`
        ),
        { status: 409 }
      );
    }

    const table = await prisma.seatingTable.create({
      data: {
        weddingId,
        eventId,
        tableNumber,
        capacity,
        label: label || null,
        zone: zone || null,
        positionX: positionX ?? null,
        positionY: positionY ?? null,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            date: true,
          },
        },
        assignedGuests: {
          include: {
            guest: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(apiSuccess(table), { status: 201 });
  } catch (error) {
    console.error("Error creating seating table:", error);
    return NextResponse.json(apiError("Failed to create seating table"), {
      status: 500,
    });
  }
}
