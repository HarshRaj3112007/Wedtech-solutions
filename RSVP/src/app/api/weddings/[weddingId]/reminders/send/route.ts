import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { sendBulkReminders } from "@/lib/services/reminders";

interface RouteParams {
  params: Promise<{ weddingId: string }>;
}

/**
 * POST /api/weddings/:weddingId/reminders/send
 * Blast reminders to all pending guests.
 * Body: { channel: "WHATSAPP" | "SMS" | "EMAIL", message: string }
 */
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
    const { channel, message } = body;

    if (!channel || !message) {
      return NextResponse.json(
        apiError("channel and message are required"),
        { status: 400 }
      );
    }

    const results = await sendBulkReminders(weddingId, channel, message);

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json(
      apiSuccess({
        sent: sentCount,
        failed: failedCount,
        total: results.length,
        details: results,
      })
    );
  } catch (error) {
    console.error("Reminder send error:", error);
    return NextResponse.json(apiError("Failed to send reminders"), { status: 500 });
  }
}
