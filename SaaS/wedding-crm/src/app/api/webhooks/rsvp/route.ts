import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/webhooks/rsvp
 * Receives real-time RSVP update notifications from the RSVP platform.
 * Updates the local RSVPGuest cache.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const {
      type,
      weddingId: rsvpWeddingId,
      guestId,
      guestName,
      guestPhone,
      responses,
      timestamp,
    } = payload

    if (type !== 'rsvp.updated' || !rsvpWeddingId || !guestId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Find the CRM wedding that maps to this RSVP wedding
    const wedding = await prisma.wedding.findFirst({
      where: { rsvpWeddingId },
    })

    if (!wedding) {
      return NextResponse.json(
        { error: 'No matching CRM wedding' },
        { status: 404 }
      )
    }

    // Determine overall status
    const hasAttending = responses?.some(
      (r: any) => r.rsvpStatus === 'ATTENDING'
    )
    const allDeclined =
      responses?.length > 0 &&
      responses.every((r: any) => r.rsvpStatus === 'DECLINED')
    const overallStatus = hasAttending
      ? 'ATTENDING'
      : allDeclined
        ? 'DECLINED'
        : 'PENDING'

    // Upsert the RSVPGuest cache record
    await prisma.rSVPGuest.upsert({
      where: {
        weddingId_rsvpGuestId: {
          weddingId: wedding.id,
          rsvpGuestId: guestId,
        },
      },
      update: {
        name: guestName,
        phone: guestPhone,
        overallStatus,
        rsvpData: JSON.stringify(responses),
        lastSyncedAt: new Date(timestamp),
      },
      create: {
        weddingId: wedding.id,
        rsvpGuestId: guestId,
        name: guestName,
        phone: guestPhone,
        overallStatus,
        rsvpData: JSON.stringify(responses),
        lastSyncedAt: new Date(timestamp),
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] RSVP processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
