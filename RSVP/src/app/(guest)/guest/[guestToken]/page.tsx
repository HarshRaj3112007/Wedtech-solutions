import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { GuestPortalClient } from "./portal-client";

interface PageProps {
  params: Promise<{ guestToken: string }>;
}

export default async function GuestPortalPage({ params }: PageProps) {
  const { guestToken } = await params;

  const guest = await prisma.guest.findUnique({
    where: { token: guestToken },
    include: {
      wedding: {
        select: {
          brideName: true,
          groomName: true,
          weddingCode: true,
          city: true,
          venueName: true,
          primaryColorHex: true,
          secondaryColorHex: true,
          bannerImageUrl: true,
          timezone: true,
          rsvpDeadline: true,
        },
      },
      eventInvites: {
        include: {
          event: true,
          seatingTable: true,
        },
        orderBy: { event: { date: "asc" } },
      },
      accommodationRoom: true,
      plusOnes: true,
      checkIns: true,
    },
  });

  if (!guest) notFound();

  // Serialize dates for client component
  const serialized = {
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    email: guest.email,
    token: guest.token,
    dietaryPref: guest.dietaryPref,
    dietaryNotes: guest.dietaryNotes,
    isOutstation: guest.isOutstation,
    plusOneAllowed: guest.plusOneAllowed,
    isVip: guest.isVip,
    wedding: {
      ...guest.wedding,
      rsvpDeadline: guest.wedding.rsvpDeadline?.toISOString() ?? null,
    },
    eventInvites: guest.eventInvites.map((ei) => ({
      id: ei.id,
      rsvpStatus: ei.rsvpStatus,
      plusOneCount: ei.plusOneCount,
      childrenCount: ei.childrenCount,
      specialNotes: ei.specialNotes,
      respondedAt: ei.respondedAt?.toISOString() ?? null,
      event: {
        id: ei.event.id,
        name: ei.event.name,
        slug: ei.event.slug,
        date: ei.event.date.toISOString(),
        time: ei.event.time,
        venue: ei.event.venue,
        dressCode: ei.event.dressCode,
      },
      seatingTable: ei.seatingTable
        ? { label: ei.seatingTable.label, tableNumber: ei.seatingTable.tableNumber, zone: ei.seatingTable.zone }
        : null,
    })),
    accommodationRoom: guest.accommodationRoom
      ? {
          hotelName: guest.accommodationRoom.hotelName,
          roomNumber: guest.accommodationRoom.roomNumber,
          roomType: guest.accommodationRoom.roomType,
          checkInDate: guest.accommodationRoom.checkInDate.toISOString(),
          checkOutDate: guest.accommodationRoom.checkOutDate.toISOString(),
        }
      : null,
    plusOnes: guest.plusOnes.map((p) => ({
      id: p.id,
      name: p.name,
      dietaryPref: p.dietaryPref,
    })),
    checkIns: guest.checkIns.map((c) => ({
      eventId: c.eventId,
      checkedInAt: c.checkedInAt.toISOString(),
    })),
  };

  return <GuestPortalClient data={serialized} />;
}
