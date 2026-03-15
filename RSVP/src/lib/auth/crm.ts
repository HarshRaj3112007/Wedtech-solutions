import { prisma } from "@/lib/db";
import type { Planner } from "@prisma/client";

/**
 * Authenticate a CRM request via Bearer token.
 * Returns the planner record if valid, null otherwise.
 */
export async function authenticateCRM(req: Request): Promise<Planner | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const apiKey = authHeader.slice(7);
  const planner = await prisma.planner.findUnique({ where: { apiKey } });
  return planner;
}
