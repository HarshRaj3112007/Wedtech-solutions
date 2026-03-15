import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** POST /api/weddings/:weddingId/display-tokens — generate a time-limited share token */
export async function POST(req: Request, { params }: RouteParams) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth/options");
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
    const hoursValid = body.hoursValid || 24;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursValid);

    const displayToken = await prisma.displayToken.create({
      data: { weddingId, expiresAt },
    });

    return NextResponse.json(
      apiSuccess({
        token: displayToken.token,
        expiresAt: displayToken.expiresAt.toISOString(),
        url: `${process.env.NEXT_PUBLIC_APP_URL}/display/${(await prisma.wedding.findUnique({ where: { id: weddingId }, select: { weddingCode: true } }))?.weddingCode}?token=${displayToken.token}`,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating display token:", error);
    return NextResponse.json(apiError("Failed to create display token"), { status: 500 });
  }
}
