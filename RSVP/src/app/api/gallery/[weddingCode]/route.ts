import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

/**
 * GET /api/gallery/:weddingCode — public gallery of approved photos
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ weddingCode: string }> }
) {
  const { weddingCode } = await params;
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 30;

  try {
    const wedding = await prisma.wedding.findUnique({
      where: { weddingCode },
      select: {
        id: true,
        brideName: true,
        groomName: true,
        primaryColorHex: true,
        secondaryColorHex: true,
        photoWallEnabled: true,
      },
    });

    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }
    if (!wedding.photoWallEnabled) {
      return NextResponse.json(apiError("Photo gallery is not available"), { status: 403 });
    }

    const skip = (Math.max(1, page) - 1) * pageSize;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { weddingId: wedding.id, status: "APPROVED" },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          imageUrl: true,
          thumbnailUrl: true,
          caption: true,
          createdAt: true,
          guest: { select: { name: true } },
        },
      }),
      prisma.photo.count({
        where: { weddingId: wedding.id, status: "APPROVED" },
      }),
    ]);

    return NextResponse.json(
      apiSuccess({
        wedding: {
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          primaryColorHex: wedding.primaryColorHex,
          secondaryColorHex: wedding.secondaryColorHex,
        },
        photos,
        total,
        page,
        pageSize,
      })
    );
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(apiError("Failed to load gallery"), { status: 500 });
  }
}
