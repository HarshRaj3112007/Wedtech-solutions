import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, paginationParams } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId/accommodation — paginated room list with optional hotel filter */
export async function GET(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
  const hotelName = url.searchParams.get("hotelName") || "";

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

    if (hotelName) {
      where.hotelName = { contains: hotelName, mode: "insensitive" };
    }

    const [rooms, total] = await Promise.all([
      prisma.accommodationRoom.findMany({
        where,
        skip,
        take,
        orderBy: [{ hotelName: "asc" }, { roomNumber: "asc" }],
        include: {
          assignedGuests: {
            select: {
              id: true,
              name: true,
              phone: true,
              isVip: true,
              dietaryPref: true,
            },
          },
        },
      }),
      prisma.accommodationRoom.count({ where }),
    ]);

    return NextResponse.json(
      apiSuccess(rooms, { page: safePage, pageSize: safeSize, total })
    );
  } catch (error) {
    console.error("Error fetching accommodation rooms:", error);
    return NextResponse.json(apiError("Failed to fetch accommodation rooms"), {
      status: 500,
    });
  }
}

/** POST /api/weddings/:weddingId/accommodation — create a new room */
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
      hotelName,
      roomNumber,
      roomType,
      maxOccupancy,
      checkInDate,
      checkOutDate,
      notes,
    } = body as {
      hotelName?: string;
      roomNumber?: string;
      roomType?: string;
      maxOccupancy?: number;
      checkInDate?: string;
      checkOutDate?: string;
      notes?: string;
    };

    if (!hotelName || !roomNumber || !roomType || !maxOccupancy || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        apiError(
          "hotelName, roomNumber, roomType, maxOccupancy, checkInDate, and checkOutDate are required"
        ),
        { status: 400 }
      );
    }

    if (maxOccupancy < 1) {
      return NextResponse.json(
        apiError("maxOccupancy must be at least 1"),
        { status: 400 }
      );
    }

    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);

    if (isNaN(parsedCheckIn.getTime()) || isNaN(parsedCheckOut.getTime())) {
      return NextResponse.json(
        apiError("checkInDate and checkOutDate must be valid dates"),
        { status: 400 }
      );
    }

    if (parsedCheckOut <= parsedCheckIn) {
      return NextResponse.json(
        apiError("checkOutDate must be after checkInDate"),
        { status: 400 }
      );
    }

    // Check unique constraint: (weddingId, hotelName, roomNumber)
    const existing = await prisma.accommodationRoom.findUnique({
      where: {
        weddingId_hotelName_roomNumber: {
          weddingId,
          hotelName,
          roomNumber,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        apiError(
          `Room "${roomNumber}" at "${hotelName}" already exists for this wedding`
        ),
        { status: 409 }
      );
    }

    const room = await prisma.accommodationRoom.create({
      data: {
        weddingId,
        hotelName,
        roomNumber,
        roomType,
        maxOccupancy,
        checkInDate: parsedCheckIn,
        checkOutDate: parsedCheckOut,
        notes: notes || null,
      },
      include: {
        assignedGuests: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(apiSuccess(room), { status: 201 });
  } catch (error) {
    console.error("Error creating accommodation room:", error);
    return NextResponse.json(apiError("Failed to create accommodation room"), {
      status: 500,
    });
  }
}
