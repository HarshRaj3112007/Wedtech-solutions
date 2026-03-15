import { prisma } from "@/lib/db";

/**
 * Reminder engine service — processes pending reminders.
 *
 * In production this would run as a BullMQ worker connected to Redis,
 * processing jobs on a cron schedule. For the initial build, this
 * provides the core logic callable from API routes.
 *
 * Flow:
 * 1. Find all weddings with active reminder schedules
 * 2. For each schedule, find guests whose invite was created `dayOffset` days ago
 *    and who haven't responded yet and haven't exceeded reminder count
 * 3. Queue/send the message via the configured channel
 * 4. Log each message in CommunicationLog
 * 5. Increment reminderCount on GuestEventInvite
 */

interface ReminderResult {
  guestId: string;
  guestName: string;
  channel: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
}

/**
 * Send reminders for a specific wedding to all pending guests.
 * Used by the "Blast to all pending" button.
 */
export async function sendBulkReminders(
  weddingId: string,
  channel: "WHATSAPP" | "SMS" | "EMAIL",
  messageTemplate: string
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];

  const pendingInvites = await prisma.guestEventInvite.findMany({
    where: {
      rsvpStatus: "PENDING",
      event: { weddingId, isActive: true },
    },
    include: {
      guest: { select: { id: true, name: true, phone: true, email: true, token: true } },
      event: { select: { name: true, date: true } },
    },
  });

  // Check RSVP deadline
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    select: { rsvpDeadline: true, weddingCode: true },
  });

  if (wedding?.rsvpDeadline && new Date(wedding.rsvpDeadline) < new Date()) {
    return [{ guestId: "", guestName: "", channel, status: "skipped", reason: "RSVP deadline has passed" }];
  }

  // Deduplicate by guest (a guest may be invited to multiple events)
  const seen = new Set<string>();

  for (const invite of pendingInvites) {
    if (seen.has(invite.guest.id)) continue;
    seen.add(invite.guest.id);

    // Interpolate template variables
    const message = messageTemplate
      .replace(/\{guest_name\}/g, invite.guest.name)
      .replace(/\{event_name\}/g, invite.event.name)
      .replace(/\{event_date\}/g, new Date(invite.event.date).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }))
      .replace(/\{rsvp_link\}/g, `${process.env.NEXT_PUBLIC_APP_URL}/guest/${invite.guest.token}`);

    try {
      // In production: dispatch to Twilio/MSG91/SendGrid based on channel
      // For now, log the message
      await prisma.communicationLog.create({
        data: {
          guestId: invite.guest.id,
          channel,
          content: message,
          status: "SENT",
          sentAt: new Date(),
          metadata: { eventId: invite.eventId, eventName: invite.event.name },
        },
      });

      // Increment reminder count
      await prisma.guestEventInvite.update({
        where: { id: invite.id },
        data: {
          reminderCount: { increment: 1 },
          lastRemindedAt: new Date(),
        },
      });

      results.push({
        guestId: invite.guest.id,
        guestName: invite.guest.name,
        channel,
        status: "sent",
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      results.push({
        guestId: invite.guest.id,
        guestName: invite.guest.name,
        channel,
        status: "failed",
        reason: errMsg,
      });
    }
  }

  return results;
}

/**
 * Send a reminder to a single guest.
 */
export async function sendSingleReminder(
  guestId: string,
  channel: "WHATSAPP" | "SMS" | "EMAIL",
  message: string
): Promise<ReminderResult> {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { id: true, name: true, phone: true, email: true },
  });

  if (!guest) {
    return { guestId, guestName: "", channel, status: "failed", reason: "Guest not found" };
  }

  try {
    await prisma.communicationLog.create({
      data: {
        guestId,
        channel,
        content: message,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return { guestId, guestName: guest.name, channel, status: "sent" };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return { guestId, guestName: guest.name, channel, status: "failed", reason: errMsg };
  }
}
