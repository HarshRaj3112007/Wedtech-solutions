import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/** GET /api/weddings/:weddingId/reminders — list reminder schedules */
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

    const schedules = await prisma.reminderSchedule.findMany({
      where: { weddingId },
      orderBy: { dayOffset: "asc" },
    });

    return NextResponse.json(apiSuccess(schedules));
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(apiError("Failed to fetch reminder schedules"), { status: 500 });
  }
}

/** POST /api/weddings/:weddingId/reminders — create or update a reminder schedule */
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
    const { dayOffset, channel, template, isActive } = body;

    if (!dayOffset || !channel || !template) {
      return NextResponse.json(
        apiError("dayOffset, channel, and template are required"),
        { status: 400 }
      );
    }

    // Upsert: if a schedule for this dayOffset + channel already exists, update it
    const schedule = await prisma.reminderSchedule.upsert({
      where: {
        weddingId_dayOffset_channel: { weddingId, dayOffset, channel },
      },
      update: { template, isActive: isActive ?? true },
      create: { weddingId, dayOffset, channel, template, isActive: isActive ?? true },
    });

    return NextResponse.json(apiSuccess(schedule), { status: 201 });
  } catch (error) {
    console.error("Error saving reminder:", error);
    return NextResponse.json(apiError("Failed to save reminder schedule"), { status: 500 });
  }
}
