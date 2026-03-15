import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/weddings/:id/rsvp/sync
 * Push guest data from CRM to RSVP platform.
 * Body: { guests: Array<{ name, phone, email?, side?, group?, events? }> }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    select: {
      rsvpPlatformUrl: true,
      rsvpWeddingId: true,
      rsvpApiKey: true,
    },
  })

  if (
    !wedding?.rsvpPlatformUrl ||
    !wedding?.rsvpWeddingId ||
    !wedding?.rsvpApiKey
  ) {
    return NextResponse.json(
      { error: 'RSVP integration not configured' },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()

    const rsvpResponse = await fetch(
      `${wedding.rsvpPlatformUrl}/api/crm/weddings/${wedding.rsvpWeddingId}/guests/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wedding.rsvpApiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!rsvpResponse.ok) {
      const errText = await rsvpResponse.text()
      return NextResponse.json(
        { error: `RSVP platform error: ${errText}` },
        { status: 502 }
      )
    }

    return NextResponse.json(await rsvpResponse.json())
  } catch (error) {
    console.error('[RSVP Sync] Error pushing guests:', error)
    return NextResponse.json(
      { error: 'Failed to sync guests' },
      { status: 502 }
    )
  }
}
