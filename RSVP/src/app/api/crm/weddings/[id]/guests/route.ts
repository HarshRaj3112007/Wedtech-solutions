import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, paginationParams } from "@/lib/utils";
import { authenticateCRM } from "@/lib/auth/crm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/weddings/:id/guests
 *
 * Returns the full guest list for a wedding with RSVP status,
 * dietary preferences, accommodation, and seating information.
 * Supports pagination via `page` and `pageSize` query params.
 *
 * Authentication: Bearer token (Planner.apiKey)
 */
export async function GET(req: Request, { params }: RouteParams) {
  const planner = await authenticateCRM(req);
  if (!planner) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50");

  try {
    // Verify the wedding belongs to this planner
    const wedding = await prisma.wedding.findFirst({
      where: { id, plannerId: planner.id },
      select: { id: true },
    });

    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const {
      skip,
      take,
      page: safePage,
      pageSize: safeSize,
    } = paginationParams(page, pageSize);

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where: { weddingId: id },
        skip,
        take,
        orderBy: [{ isVip: "desc" }, { name: "asc" }],
        include: {
          eventInvites: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  date: true,
                },
              },
              seatingTable: {
                select: {
                  id: true,
                  tableNumber: true,
                  label: true,
                  zone: true,
                },
              },
            },
          },
          accommodationRoom: {
            select: {
              id: true,
              hotelName: true,
              roomNumber: true,
              roomType: true,
              checkInDate: true,
              checkOutDate: true,
            },
          },
          plusOnes: {
            select: {
              id: true,
              name: true,
              dietaryPref: true,
              dietaryNotes: true,
            },
          },
        },
      }),
      prisma.guest.count({ where: { weddingId: id } }),
    ]);

    return NextResponse.json(
      apiSuccess(guests, { page: safePage, pageSize: safeSize, total })
    );
  } catch (error) {
    console.error("Error fetching CRM guests:", error);
    return NextResponse.json(
      apiError("Failed to fetch guests"),
      { status: 500 }
    );
  }
}
