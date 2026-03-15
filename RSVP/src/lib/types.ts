import type {
  Planner,
  Wedding,
  WeddingEvent,
  Guest,
  GuestEventInvite,
  AccommodationRoom,
  SeatingTable,
  CheckIn,
  PlusOne,
  CommunicationLog,
  Photo,
  InviteTemplate,
  ReminderSchedule,
  DisplayToken,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Re-export Prisma types for convenience
// ─────────────────────────────────────────────────────────────

export type {
  Planner,
  Wedding,
  WeddingEvent,
  Guest,
  GuestEventInvite,
  AccommodationRoom,
  SeatingTable,
  CheckIn,
  PlusOne,
  CommunicationLog,
  Photo,
  InviteTemplate,
  ReminderSchedule,
  DisplayToken,
};

// ─────────────────────────────────────────────────────────────
// Extended / composite types used in the frontend
// ─────────────────────────────────────────────────────────────

/** Wedding with events and guest count */
export type WeddingWithDetails = Wedding & {
  events: WeddingEvent[];
  _count: {
    guests: number;
  };
};

/** Guest with all relations loaded */
export type GuestWithRelations = Guest & {
  eventInvites: (GuestEventInvite & {
    event: WeddingEvent;
    seatingTable: SeatingTable | null;
  })[];
  accommodationRoom: AccommodationRoom | null;
  plusOnes: PlusOne[];
  checkIns: CheckIn[];
};

/** Event with RSVP counts */
export type EventWithCounts = WeddingEvent & {
  _count: {
    guestEventInvites: number;
    checkIns: number;
  };
  rsvpCounts: {
    total: number;
    attending: number;
    declined: number;
    pending: number;
    plusOnes: number;
    children: number;
    totalPax: number; // attending + plusOnes + children
  };
};

/** Headcount response for CRM integration */
export interface EventHeadcount {
  eventId: string;
  eventName: string;
  eventDate: string;
  confirmed: number;
  plusOnes: number;
  children: number;
  totalPax: number;
  declined: number;
  pending: number;
}

/** QR code payload for check-in */
export interface QRPayload {
  guestId: string;
  eventId: string;
  signature: string;
}

/** Caterer brief data */
export interface CatererBriefData {
  eventName: string;
  eventDate: string;
  totalHeadcount: number;
  dietaryBreakdown: Record<string, number>;
  allergyGuests: Array<{
    name: string;
    notes: string;
    isVip: boolean;
  }>;
  vipDietary: Array<{
    name: string;
    preference: string;
    notes: string | null;
  }>;
}

/** Planner dashboard wedding card */
export interface WeddingCard {
  id: string;
  brideName: string;
  groomName: string;
  weddingCode: string;
  city: string | null;
  primaryColorHex: string;
  bannerImageUrl: string | null;
  rsvpDeadline: string | null;
  guestCount: number;
  responseRate: number; // percentage
  lastActivity: string | null;
  upcomingEventDate: string | null;
}

/** Guest self-service portal data */
export interface GuestPortalData {
  guest: Guest;
  wedding: Pick<Wedding, "brideName" | "groomName" | "weddingCode" | "primaryColorHex" | "secondaryColorHex" | "bannerImageUrl">;
  events: Array<{
    event: WeddingEvent;
    invite: GuestEventInvite;
    seatingTable: SeatingTable | null;
    checkIn: CheckIn | null;
  }>;
  accommodation: AccommodationRoom | null;
  showSeating: boolean;
}

/** Live RSVP display data */
export interface LiveRSVPData {
  weddingCode: string;
  brideName: string;
  groomName: string;
  events: Array<{
    name: string;
    date: string;
    attending: number;
    declined: number;
    pending: number;
    totalInvited: number;
  }>;
  lastUpdated: string;
}
