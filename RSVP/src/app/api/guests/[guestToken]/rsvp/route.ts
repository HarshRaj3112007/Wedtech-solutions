import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { dispatchRSVPWebhook } from "@/lib/services/webhook";
import type { RSVPWebhookPayload } from "@/lib/services/webhook";

interface RouteParams {
  params: Promise<{ guestToken: string }>;
}

/**
 * POST /api/guests/:guestToken/rsvp
 * Submit RSVP for one or more events.
 * No planner auth needed — the guest token IS the auth.
 *
 * Body: {
 *   guestToken: string,
 *   dietaryPref?: string,
 *   dietaryNotes?: string,
 *   responses: Array<{
 *     eventId: string,
 *     rsvpStatus: "ATTENDING" | "DECLINED",
 *     plusOneCount?: number,
 *     plusOneName?: string,
 *     plusOneDietaryPref?: string,
 *     childrenCount?: number,
 *     specialNotes?: string,
 *   }>
 * }
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { guestToken } = await params;

  try {
    const body = await req.json();
    const { responses, dietaryPref, dietaryNotes } = body;

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        apiError("At least one event response is required"),
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { token: guestToken },
      include: {
        wedding: { select: { rsvpDeadline: true } },
        eventInvites: true,
      },
    });

    if (!guest) {
      return NextResponse.json(apiError("Invalid guest token"), { status: 404 });
    }

    // Check per-event deadlines: allow response changes up to 48 hours before event
    const now = new Date();
    const cutoffMs = 48 * 60 * 60 * 1000;

    // Optionally update guest dietary preferences
    if (dietaryPref || dietaryNotes !== undefined) {
      await prisma.guest.update({
        where: { id: guest.id },
        data: {
          ...(dietaryPref && { dietaryPref }),
          ...(dietaryNotes !== undefined && { dietaryNotes }),
        },
      });
    }

    const results = [];

    for (const response of responses) {
      const { eventId, rsvpStatus, plusOneCount, plusOneName, plusOneDietaryPref, childrenCount, specialNotes } = response;

      // Validate this guest is invited to this event
      const invite = guest.eventInvites.find((ei) => ei.eventId === eventId);
      if (!invite) {
        results.push({ eventId, error: "Not invited to this event" });
        continue;
      }

      // Check event date for 48-hour cutoff on response changes
      const event = await prisma.weddingEvent.findUnique({
        where: { id: eventId },
        select: { date: true, name: true },
      });

      if (event && invite.respondedAt) {
        const eventTime = new Date(event.date).getTime();
        if (now.getTime() > eventTime - cutoffMs) {
          results.push({
            eventId,
            eventName: event?.name,
            error: "Cannot change RSVP within 48 hours of the event",
          });
          continue;
        }
      }

      // Update the invite record
      await prisma.guestEventInvite.update({
        where: { id: invite.id },
        data: {
          rsvpStatus,
          plusOneCount: rsvpStatus === "ATTENDING" ? (plusOneCount || 0) : 0,
          childrenCount: rsvpStatus === "ATTENDING" ? (childrenCount || 0) : 0,
          specialNotes: specialNotes || null,
          respondedAt: now,
        },
      });

      // Handle plus-one sub-profile
      if (rsvpStatus === "ATTENDING" && plusOneCount && plusOneCount > 0 && plusOneName) {
        // Upsert plus-one — guest can have at most one plus-one
        const existingPlusOne = await prisma.plusOne.findFirst({
          where: { guestId: guest.id },
        });

        if (existingPlusOne) {
          await prisma.plusOne.update({
            where: { id: existingPlusOne.id },
            data: {
              name: plusOneName,
              dietaryPref: plusOneDietaryPref || "VEG",
            },
          });
        } else {
          await prisma.plusOne.create({
            data: {
              guestId: guest.id,
              name: plusOneName,
              dietaryPref: plusOneDietaryPref || "VEG",
            },
          });
        }
      }

      results.push({
        eventId,
        eventName: event?.name,
        rsvpStatus,
        plusOneCount: rsvpStatus === "ATTENDING" ? (plusOneCount || 0) : 0,
        childrenCount: rsvpStatus === "ATTENDING" ? (childrenCount || 0) : 0,
        success: true,
      });
    }

    // Dispatch webhook to CRM (fire-and-forget)
    const successResults = results.filter((r: any) => r.success);
    if (successResults.length > 0) {
      const webhookPayload: RSVPWebhookPayload = {
        type: "rsvp.updated",
        weddingId: guest.weddingId,
        guestId: guest.id,
        guestName: guest.name,
        guestPhone: guest.phone,
        responses: successResults.map((r: any) => ({
          eventId: r.eventId,
          eventName: r.eventName,
          rsvpStatus: r.rsvpStatus,
          plusOneCount: r.plusOneCount || 0,
          childrenCount: r.childrenCount || 0,
        })),
        timestamp: new Date().toISOString(),
      };
      dispatchRSVPWebhook(guest.weddingId, webhookPayload).catch(() => {});
    }

    return NextResponse.json(apiSuccess({ results }));
  } catch (error) {
    console.error("RSVP submission error:", error);
    return NextResponse.json(apiError("Failed to submit RSVP"), { status: 500 });
  }
}
