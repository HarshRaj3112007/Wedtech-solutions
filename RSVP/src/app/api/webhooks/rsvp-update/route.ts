import { NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils";

/**
 * POST /api/webhooks/rsvp-update
 * Fires this webhook to CRM whenever an RSVP changes.
 * This is the endpoint the RSVP platform calls OUT to the CRM.
 * For now, this is a stub that logs the webhook. In production,
 * the reminder engine / RSVP API would call the CRM's webhook URL instead.
 *
 * Body: { weddingId, guestId, eventId, rsvpStatus, respondedAt }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { weddingId, guestId, eventId, rsvpStatus, respondedAt } = body;

    if (!weddingId || !guestId || !eventId || !rsvpStatus) {
      return NextResponse.json(
        apiError("Missing required fields: weddingId, guestId, eventId, rsvpStatus"),
        { status: 400 }
      );
    }

    // In production: forward to the CRM's configured webhook URL
    // const crmWebhookUrl = await getCRMWebhookUrl(weddingId);
    // await fetch(crmWebhookUrl, { method: "POST", body: JSON.stringify({ ... }) });

    console.log("[Webhook] RSVP update:", {
      weddingId,
      guestId,
      eventId,
      rsvpStatus,
      respondedAt,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      apiSuccess({ received: true, timestamp: new Date().toISOString() })
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(apiError("Webhook processing failed"), { status: 500 });
  }
}
