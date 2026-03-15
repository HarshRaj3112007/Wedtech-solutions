import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/weddings/:id/rsvp/full-sync
 * Pull full guest list from RSVP platform and update local RSVPGuest cache.
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
    let allGuests: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore && page <= 10) {
      const res = await fetch(
        `${wedding.rsvpPlatformUrl}/api/crm/weddings/${wedding.rsvpWeddingId}/guests?page=${page}&pageSize=100`,
        {
          headers: { Authorization: `Bearer ${wedding.rsvpApiKey}` },
          signal: AbortSignal.timeout(10000),
        }
      )

      if (!res.ok) break

      const data = await res.json()
      allGuests = allGuests.concat(data.data || [])
      hasMore = (data.data?.length || 0) === 100
      page++
    }

    // Upsert each guest into local cache
    let synced = 0
    for (const guest of allGuests) {
      const invites = guest.eventInvites || []
      const hasAttending = invites.some(
        (i: any) => i.rsvpStatus === 'ATTENDING'
      )
      const allDeclined =
        invites.length > 0 &&
        invites.every((i: any) => i.rsvpStatus === 'DECLINED')
      const overallStatus = hasAttending
        ? 'ATTENDING'
        : allDeclined
          ? 'DECLINED'
          : 'PENDING'

      await prisma.rSVPGuest.upsert({
        where: {
          weddingId_rsvpGuestId: { weddingId: id, rsvpGuestId: guest.id },
        },
        update: {
          name: guest.name,
          phone: guest.phone,
          email: guest.email,
          side: guest.relationshipSide,
          groupTag: guest.groupTag,
          isVip: guest.isVip || false,
          dietaryPref: guest.dietaryPref,
          overallStatus,
          rsvpData: JSON.stringify(invites),
          lastSyncedAt: new Date(),
        },
        create: {
          weddingId: id,
          rsvpGuestId: guest.id,
          name: guest.name,
          phone: guest.phone,
          email: guest.email,
          side: guest.relationshipSide,
          groupTag: guest.groupTag,
          isVip: guest.isVip || false,
          dietaryPref: guest.dietaryPref,
          overallStatus,
          rsvpData: JSON.stringify(invites),
          lastSyncedAt: new Date(),
        },
      })
      synced++
    }

    return NextResponse.json({ success: true, synced, total: allGuests.length })
  } catch (error) {
    console.error('[RSVP Full Sync] Error:', error)
    return NextResponse.json({ error: 'Full sync failed' }, { status: 500 })
  }
}
