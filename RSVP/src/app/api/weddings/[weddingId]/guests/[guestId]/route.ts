import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, formatIndianPhone } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string; guestId: string }>;
}

/** GET /api/weddings/:weddingId/guests/:guestId — full guest profile */
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId, guestId } = await params;

  try {
    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        weddingId,
        wedding: { plannerId: session.user.id },
      },
      include: {
        eventInvites: {
          include: {
            event: true,
            seatingTable: true,
          },
        },
        accommodationRoom: true,
        plusOnes: true,
        checkIns: { include: { event: true } },
        communicationLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!guest) {
      return NextResponse.json(apiError("Guest not found"), { status: 404 });
    }

    return NextResponse.json(apiSuccess(guest));
  } catch (error) {
    console.error("Error fetching guest:", error);
    return NextResponse.json(apiError("Failed to fetch guest"), { status: 500 });
  }
}

/** PATCH /api/weddings/:weddingId/guests/:guestId — update guest */
export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId, guestId } = await params;

  try {
    const existing = await prisma.guest.findFirst({
      where: {
        id: guestId,
        weddingId,
        wedding: { plannerId: session.user.id },
      },
    });
    if (!existing) {
      return NextResponse.json(apiError("Guest not found"), { status: 404 });
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
      accommodationRoomId,
    } = body;

    // If phone changed, check for duplicate
    let formattedPhone = existing.phone;
    if (phone && phone !== existing.phone) {
      formattedPhone = formatIndianPhone(phone);
      const dup = await prisma.guest.findFirst({
        where: {
          weddingId,
          phone: formattedPhone,
          id: { not: guestId },
        },
      });
      if (dup) {
        return NextResponse.json(
          apiError(`Phone ${formattedPhone} is already used by another guest`),
          { status: 409 }
        );
      }
    }

    const guest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: formattedPhone }),
        ...(email !== undefined && { email: email || null }),
        ...(relationshipSide !== undefined && { relationshipSide }),
        ...(groupTag !== undefined && { groupTag: groupTag || null }),
        ...(isVip !== undefined && { isVip }),
        ...(isOutstation !== undefined && { isOutstation }),
        ...(dietaryPref !== undefined && { dietaryPref }),
        ...(dietaryNotes !== undefined && { dietaryNotes: dietaryNotes || null }),
        ...(plusOneAllowed !== undefined && { plusOneAllowed }),
        ...(accommodationRoomId !== undefined && { accommodationRoomId: accommodationRoomId || null }),
      },
      include: {
        eventInvites: {
          include: { event: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(apiSuccess(guest));
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json(apiError("Failed to update guest"), { status: 500 });
  }
}

/** DELETE /api/weddings/:weddingId/guests/:guestId — delete guest */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId, guestId } = await params;

  try {
    const existing = await prisma.guest.findFirst({
      where: {
        id: guestId,
        weddingId,
        wedding: { plannerId: session.user.id },
      },
    });
    if (!existing) {
      return NextResponse.json(apiError("Guest not found"), { status: 404 });
    }

    await prisma.guest.delete({ where: { id: guestId } });

    return NextResponse.json(apiSuccess({ deleted: true }));
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json(apiError("Failed to delete guest"), { status: 500 });
  }
}
