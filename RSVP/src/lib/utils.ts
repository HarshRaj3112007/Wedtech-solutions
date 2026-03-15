import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx — the standard cn() helper */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an Indian phone number: ensures +91 prefix.
 * Strips spaces, dashes, and leading zero.
 */
export function formatIndianPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith("91") && !cleaned.startsWith("+91")) {
    cleaned = "+" + cleaned;
  }
  if (!cleaned.startsWith("+91")) {
    cleaned = "+91" + cleaned;
  }
  return cleaned;
}

/**
 * Validate an Indian mobile number — must be +91 followed by 10 digits
 * starting with 6-9.
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

/** Generate a URL-safe slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Standard JSON API response envelope used across all endpoints:
 * { success, data, error, meta }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    total?: number;
    pageSize?: number;
  };
}

export function apiSuccess<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return { success: true, data, error: null, meta };
}

export function apiError(error: string, meta?: ApiResponse["meta"]): ApiResponse<null> {
  return { success: false, data: null, error, meta };
}

/**
 * Generate a HMAC signature for QR code data to prevent forgery.
 * Uses crypto.createHmac with SHA-256.
 */
export async function generateHmac(data: string): Promise<string> {
  const { createHmac } = await import("crypto");
  const secret = process.env.HMAC_SECRET ?? "default-dev-secret";
  return createHmac("sha256", secret).update(data).digest("hex");
}

export async function verifyHmac(data: string, signature: string): Promise<boolean> {
  const expected = await generateHmac(data);
  return expected === signature;
}

/** Paginate query helper — returns skip, take for Prisma */
export function paginationParams(page: number, pageSize: number = 50) {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 100);
  return {
    skip: (safePage - 1) * safeSize,
    take: safeSize,
    page: safePage,
    pageSize: safeSize,
  };
}
