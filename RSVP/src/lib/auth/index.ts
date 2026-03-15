import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export { authOptions } from "./options";

/**
 * Get the current planner's session on the server side.
 * Returns null if not authenticated.
 */
export async function getCurrentPlanner() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Require authentication — throws redirect if not logged in.
 * Use in server components and API routes.
 */
export async function requirePlanner() {
  const user = await getCurrentPlanner();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
