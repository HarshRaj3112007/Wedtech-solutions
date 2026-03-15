import { prisma } from "@/lib/db";

export interface RSVPWebhookPayload {
  type: "rsvp.updated";
  weddingId: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  responses: Array<{
    eventId: string;
    eventName: string;
    rsvpStatus: "ATTENDING" | "DECLINED" | "PENDING";
    plusOneCount: number;
    childrenCount: number;
  }>;
  timestamp: string;
}

/**
 * Dispatch a webhook to the CRM when RSVP data changes.
 * Fails silently — webhook delivery is best-effort.
 * The CRM can always re-pull from /api/crm/weddings/:id/guests.
 */
export async function dispatchRSVPWebhook(
  weddingId: string,
  payload: RSVPWebhookPayload
): Promise<void> {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { crmWebhookUrl: true },
    });

    if (!wedding?.crmWebhookUrl) return;

    const response = await fetch(wedding.crmWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(
        `[Webhook] CRM returned ${response.status} for wedding ${weddingId}`
      );
    }
  } catch (error) {
    console.error(
      `[Webhook] Failed to dispatch for wedding ${weddingId}:`,
      error
    );
  }
}
