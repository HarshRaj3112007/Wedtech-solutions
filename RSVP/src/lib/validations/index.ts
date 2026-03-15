import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Shared validators used across forms and API routes
// ─────────────────────────────────────────────────────────────

export const indianPhoneRegex = /^\+91[6-9]\d{9}$/;

export const phoneSchema = z
  .string()
  .regex(indianPhoneRegex, "Must be a valid Indian mobile number (+91...)");

// ── Planner Auth ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: phoneSchema.optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ── Wedding ──────────────────────────────────────────────────

export const weddingSchema = z.object({
  brideName: z.string().min(1, "Bride's name is required"),
  groomName: z.string().min(1, "Groom's name is required"),
  weddingCode: z
    .string()
    .min(3, "Wedding code must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens allowed"),
  city: z.string().optional(),
  venueName: z.string().optional(),
  primaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex colour"),
  secondaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex colour"),
  bannerImageUrl: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
  rsvpDeadline: z.string().optional(),
});

// ── Wedding Event ────────────────────────────────────────────

export const weddingEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().datetime("Invalid date"),
  time: z.string().optional(),
  venue: z.string().optional(),
  dressCode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  checkInPin: z
    .string()
    .min(4)
    .max(6)
    .regex(/^\d+$/, "PIN must be digits only")
    .optional(),
});

// ── Guest ────────────────────────────────────────────────────

export const dietaryPreference = z.enum([
  "VEG",
  "NON_VEG",
  "JAIN",
  "VEGAN",
  "CUSTOM",
]);

export const relationshipSide = z.enum(["BRIDE", "GROOM", "MUTUAL"]);

export const guestSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  relationshipSide: relationshipSide.default("MUTUAL"),
  groupTag: z.string().optional(),
  isVip: z.boolean().default(false),
  isOutstation: z.boolean().default(false),
  dietaryPref: dietaryPreference.default("VEG"),
  dietaryNotes: z.string().optional(),
  plusOneAllowed: z.boolean().default(false),
  eventIds: z.array(z.string()).optional(), // events to invite this guest to
});

// ── RSVP Submission ─────────────────────────────────────────

export const rsvpEventResponseSchema = z.object({
  eventId: z.string(),
  rsvpStatus: z.enum(["ATTENDING", "DECLINED"]),
  plusOneCount: z.number().min(0).max(1).default(0),
  plusOneName: z.string().optional(),
  plusOneDietaryPref: dietaryPreference.optional(),
  childrenCount: z.number().min(0).max(10).default(0),
  specialNotes: z.string().optional(),
});

export const rsvpSubmissionSchema = z.object({
  guestToken: z.string(),
  dietaryPref: dietaryPreference.optional(),
  dietaryNotes: z.string().optional(),
  responses: z.array(rsvpEventResponseSchema).min(1, "At least one event response is required"),
});

// ── Accommodation ───────────────────────────────────────────

export const accommodationRoomSchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.string().min(1, "Room type is required"),
  maxOccupancy: z.number().min(1).default(2),
  checkInDate: z.string().datetime(),
  checkOutDate: z.string().datetime(),
  notes: z.string().optional(),
});

// ── Seating ─────────────────────────────────────────────────

export const seatingTableSchema = z.object({
  eventId: z.string(),
  tableNumber: z.number().min(1),
  label: z.string().optional(),
  capacity: z.number().min(1).default(10),
  zone: z.string().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

// ── Check-in ────────────────────────────────────────────────

export const checkInSchema = z.object({
  guestId: z.string(),
  eventId: z.string(),
  checkedInBy: z.string().optional(),
  method: z.enum(["QR", "MANUAL"]).default("MANUAL"),
});

// ── Reminder Schedule ───────────────────────────────────────

export const reminderScheduleSchema = z.object({
  dayOffset: z.number().min(1),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  template: z.string().min(1, "Template message is required"),
  isActive: z.boolean().default(true),
});

// ── CSV Import Row ──────────────────────────────────────────

export const csvGuestRowSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().optional(),
  side: z.string().optional(),
  group: z.string().optional(),
  events: z.string().optional(), // comma-separated event names
  vip: z.string().optional(),
  outstation: z.string().optional(),
  dietary: z.string().optional(),
  plus_one: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WeddingInput = z.infer<typeof weddingSchema>;
export type WeddingEventInput = z.infer<typeof weddingEventSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type RSVPSubmission = z.infer<typeof rsvpSubmissionSchema>;
export type RSVPEventResponse = z.infer<typeof rsvpEventResponseSchema>;
export type AccommodationRoomInput = z.infer<typeof accommodationRoomSchema>;
export type SeatingTableInput = z.infer<typeof seatingTableSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ReminderScheduleInput = z.infer<typeof reminderScheduleSchema>;
export type CSVGuestRow = z.infer<typeof csvGuestRowSchema>;
