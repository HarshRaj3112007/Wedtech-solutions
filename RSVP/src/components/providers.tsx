"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper — wraps the app with
 * NextAuth session, tooltip, and toast providers.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <NextAuthSessionProvider>
      <TooltipProvider>
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </NextAuthSessionProvider>
  );
}
