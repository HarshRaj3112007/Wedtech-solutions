import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, slugify } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string; eventId: string }>;
}

/** PATCH /api/weddings/:weddingId/events/:eventId — update event */
export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId, eventId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const existing = await prisma.weddingEvent.findFirst({
      where: { id: eventId, weddingId },
    });
    if (!existing) {
      return NextResponse.json(apiError("Event not found"), { status: 404 });
    }

    const body = await req.json();
    const { name, date, time, venue, dressCode, description, isActive, checkInPin } = body;

    // If name changed, update slug too
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = slugify(name);
      const slugConflict = await prisma.weddingEvent.findFirst({
        where: { weddingId, slug, id: { not: eventId } },
      });
      if (slugConflict) {
        return NextResponse.json(
          apiError(`Slug "${slug}" conflicts with another event`),
          { status: 409 }
        );
      }
    }

    const event = await prisma.weddingEvent.update({
      where: { id: eventId },
      data: {
        ...(name !== undefined && { name, slug }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(venue !== undefined && { venue }),
        ...(dressCode !== undefined && { dressCode }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(checkInPin !== undefined && { checkInPin }),
      },
    });

    return NextResponse.json(apiSuccess(event));
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(apiError("Failed to update event"), {
      status: 500,
    });
  }
}

/** DELETE /api/weddings/:weddingId/events/:eventId — delete event */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(apiError("Unauthorized"), { status: 401 });
  }

  const { weddingId, eventId } = await params;

  try {
    const wedding = await prisma.wedding.findFirst({
      where: { id: weddingId, plannerId: session.user.id },
      select: { id: true },
    });
    if (!wedding) {
      return NextResponse.json(apiError("Wedding not found"), { status: 404 });
    }

    const existing = await prisma.weddingEvent.findFirst({
      where: { id: eventId, weddingId },
    });
    if (!existing) {
      return NextResponse.json(apiError("Event not found"), { status: 404 });
    }

    await prisma.weddingEvent.delete({ where: { id: eventId } });

    return NextResponse.json(apiSuccess({ deleted: true }));
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(apiError("Failed to delete event"), {
      status: 500,
    });
  }
}
