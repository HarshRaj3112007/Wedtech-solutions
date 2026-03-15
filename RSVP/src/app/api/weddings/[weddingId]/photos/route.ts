import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, paginationParams } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId/photos — list photos (planner view: all statuses) */
export async function GET(req: Request, { params }: RouteParams) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth/options");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "";

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const where: Record<string, unknown> = { weddingId };
    if (status) where.status = status;

    const { skip, take, page: safePage, pageSize } = paginationParams(page, 50);

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          guest: { select: { id: true, name: true } },
        },
      }),
      prisma.photo.count({ where }),
    ]);

    return NextResponse.json(apiSuccess(photos, { page: safePage, pageSize, total }));
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(apiError("Failed to fetch photos"), { status: 500 });
  }
}

/** POST /api/weddings/:weddingId/photos — upload a photo (guest or planner) */
export async function POST(req: Request, { params }: RouteParams) {
  const { weddingId } = await params;

  try {
    const body = await req.json();
    const { imageUrl, thumbnailUrl, caption, guestToken } = body;

    if (!imageUrl) {
      return NextResponse.json(apiError("Image URL is required"), { status: 400 });
    }

    // Verify wedding exists and photo wall is enabled
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { id: true, photoWallEnabled: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }
    if (!wedding.photoWallEnabled) {
      return NextResponse.json(apiError("Photo wall is not enabled for this wedding"), { status: 403 });
    }

    // If guest token, resolve guest ID
    let guestId: string | null = null;
    if (guestToken) {
      const guest = await prisma.guest.findUnique({
        where: { token: guestToken },
        select: { id: true },
      });
      if (guest) guestId = guest.id;
    }

    const photo = await prisma.photo.create({
      data: {
        weddingId,
        guestId,
        imageUrl,
        thumbnailUrl: thumbnailUrl || null,
        caption: caption || null,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json(apiSuccess(photo), { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(apiError("Failed to upload photo"), { status: 500 });
  }
}
