import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { InviteClient } from "./invite-client";

interface PageProps {
  params: Promise<{ weddingCode: string; eventSlug: string }>;
  searchParams: Promise<{ guest?: string }>;
}

/**
 * Server component: fetches event + guest data, then renders the client invite.
 * URL: /invite/{weddingCode}/{eventSlug}?guest={guestToken}
 */
export default async function InvitePage({ params, searchParams }: PageProps) {
  const { weddingCode, eventSlug } = await params;
  const { guest: guestToken } = await searchParams;

  // Fetch event
  const event = await prisma.weddingEvent.findFirst({
    where: {
      slug: eventSlug,
      wedding: { weddingCode },
    },
    include: {
      wedding: {
        select: {
          id: true,
          brideName: true,
          groomName: true,
          weddingCode: true,
          city: true,
          venueName: true,
          primaryColorHex: true,
          secondaryColorHex: true,
          bannerImageUrl: true,
          rsvpDeadline: true,
        },
      },
      inviteTemplate: true,
    },
  });

  if (!event) notFound();

  // Fetch guest if token provided
  let guestData = null;
  let guestInvite = null;
  if (guestToken) {
    guestData = await prisma.guest.findUnique({
      where: { token: guestToken },
      select: {
        id: true,
        name: true,
        token: true,
        dietaryPref: true,
        plusOneAllowed: true,
      },
    });

    if (guestData) {
      guestInvite = await prisma.guestEventInvite.findUnique({
        where: {
          guestId_eventId: {
            guestId: guestData.id,
            eventId: event.id,
          },
        },
      });
    }
  }

  return (
    <InviteClient
      event={{
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        time: event.time,
        venue: event.venue,
        dressCode: event.dressCode,
        description: event.description,
      }}
      wedding={{
        brideName: event.wedding.brideName,
        groomName: event.wedding.groomName,
        weddingCode: event.wedding.weddingCode,
        city: event.wedding.city,
        venueName: event.wedding.venueName,
        primaryColorHex: event.wedding.primaryColorHex,
        secondaryColorHex: event.wedding.secondaryColorHex,
        bannerImageUrl: event.wedding.bannerImageUrl,
        rsvpDeadline: event.wedding.rsvpDeadline?.toISOString() ?? null,
      }}
      guest={
        guestData
          ? {
              id: guestData.id,
              name: guestData.name,
              token: guestData.token,
              dietaryPref: guestData.dietaryPref,
              plusOneAllowed: guestData.plusOneAllowed,
            }
          : null
      }
      invite={
        guestInvite
          ? {
              rsvpStatus: guestInvite.rsvpStatus,
              plusOneCount: guestInvite.plusOneCount,
              childrenCount: guestInvite.childrenCount,
              respondedAt: guestInvite.respondedAt?.toISOString() ?? null,
            }
          : null
      }
      theme={event.inviteTemplate?.theme ?? "FLORAL"}
    />
  );
}
