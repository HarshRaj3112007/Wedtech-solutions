"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Shirt, Clock, Share2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { DIETARY_LABELS } from "@/lib/constants";

interface InviteClientProps {
  event: {
    id: string;
    name: string;
    date: string;
    time: string | null;
    venue: string | null;
    dressCode: string | null;
    description: string | null;
  };
  wedding: {
    brideName: string;
    groomName: string;
    weddingCode: string;
    city: string | null;
    venueName: string | null;
    primaryColorHex: string;
    secondaryColorHex: string;
    bannerImageUrl: string | null;
    rsvpDeadline: string | null;
  };
  guest: {
    id: string;
    name: string;
    token: string;
    dietaryPref: string;
    plusOneAllowed: boolean;
  } | null;
  invite: {
    rsvpStatus: string;
    plusOneCount: number;
    childrenCount: number;
    respondedAt: string | null;
  } | null;
  theme: string;
}

/** Computed background styles per invite theme */
function getThemeStyles(theme: string, primary: string, secondary: string) {
  const base = {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    background: `linear-gradient(135deg, ${primary}10, ${secondary}10)`,
  };

  switch (theme) {
    case "ROYAL":
      return {
        ...base,
        background: `linear-gradient(160deg, #1a0a2e 0%, ${primary}30 50%, #1a0a2e 100%)`,
        textColor: "#f5e6c4",
        accentColor: "#d4af37",
        goldTextAccent: "#d4a017",
      };
    case "MINIMAL":
      return {
        ...base,
        fontFamily: "'Inter', 'Helvetica', sans-serif",
        background: "#fafafa",
        textColor: "#1a1a1a",
        accentColor: primary,
      };
    case "BOHO":
      return {
        ...base,
        background: `linear-gradient(180deg, #f4e6d0 0%, #e8d5b7 50%, ${primary}15 100%)`,
        textColor: "#5c4033",
        accentColor: "#8b6f47",
      };
    case "TRADITIONAL":
      return {
        ...base,
        background: `linear-gradient(180deg, ${secondary}15 0%, #fff5f5 30%, ${primary}10 100%)`,
        textColor: "#8b1a34",
        accentColor: "#8b1a34",
        goldAccent: "#d4a017",
      };
    case "FLORAL":
    default:
      return {
        ...base,
        background: `linear-gradient(180deg, #fdf2f8 0%, #fff1f2 30%, ${primary}08 100%)`,
        textColor: "#831843",
        accentColor: primary,
      };
  }
}

export function InviteClient({ event, wedding, guest, invite, theme }: InviteClientProps) {
  const [rsvpStatus, setRsvpStatus] = useState(invite?.rsvpStatus || "PENDING");
  const [submitting, setSubmitting] = useState(false);

  const styles = getThemeStyles(theme, wedding.primaryColorHex, wedding.secondaryColorHex);

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isDeadlinePassed = wedding.rsvpDeadline
    ? new Date(wedding.rsvpDeadline) < new Date()
    : false;

  async function handleQuickRsvp(status: "ATTENDING" | "DECLINED") {
    if (!guest) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/guests/${guest.token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestToken: guest.token,
          responses: [
            {
              eventId: event.id,
              rsvpStatus: status,
              plusOneCount: 0,
              childrenCount: 0,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRsvpStatus(status);
        toast.success(
          status === "ATTENDING"
            ? "See you there! Your RSVP has been confirmed."
            : "We'll miss you! Your response has been recorded."
        );
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  }

  function handleWhatsAppShare() {
    const url = `${window.location.origin}/invite/${wedding.weddingCode}/${event.name.toLowerCase().replace(/\s+/g, "-")}`;
    const text = `You're invited to ${wedding.brideName} & ${wedding.groomName}'s ${event.name}! ${formattedDate}${event.venue ? ` at ${event.venue}` : ""}. RSVP here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{
        background: styles.background,
        fontFamily: styles.fontFamily,
      }}
    >
      {/* Animated entrance */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl shadow-wedding-lg backdrop-blur-sm dark:bg-zinc-900/80">
          {/* Banner area */}
          <div
            className="relative flex h-48 items-center justify-center"
            style={{
              background: wedding.bannerImageUrl
                ? `url(${wedding.bannerImageUrl}) center/cover`
                : `linear-gradient(135deg, ${wedding.primaryColorHex}, ${wedding.secondaryColorHex})`,
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative z-10 text-center text-white"
            >
              <p className="text-sm font-light uppercase tracking-[0.3em]">You are invited to</p>
              <h1 className="mt-2 text-3xl font-bold tracking-wide sm:text-4xl">
                {event.name}
              </h1>
            </motion.div>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6 sm:p-8">
            {/* Couple names */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                Celebrating the union of
              </p>
              <h2
                className="mt-2 text-2xl font-bold sm:text-3xl"
                style={{ color: styles.accentColor }}
              >
                {wedding.brideName} & {wedding.groomName}
              </h2>
            </motion.div>

            {/* Guest personalisation */}
            {guest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="rounded-xl border bg-white/50 p-4 text-center dark:bg-zinc-800/50"
              >
                <p className="text-sm text-muted-foreground">Dear</p>
                <p className="text-xl font-semibold" style={{ color: styles.accentColor }}>
                  {guest.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We would be honoured by your presence.
                </p>
              </motion.div>
            )}

            {/* Event details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="grid gap-3"
            >
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
              {event.time && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{event.time}</span>
                </div>
              )}
              {(event.venue || wedding.venueName) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.venue || wedding.venueName}
                    {wedding.city && `, ${wedding.city}`}
                  </span>
                </div>
              )}
              {event.dressCode && (
                <div className="flex items-center gap-3 text-sm">
                  <Shirt className="h-4 w-4 text-muted-foreground" />
                  <span>{event.dressCode}</span>
                </div>
              )}
            </motion.div>

            {event.description && (
              <p className="text-center text-sm italic text-muted-foreground">
                {event.description}
              </p>
            )}

            {/* RSVP Section */}
            {guest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="space-y-4"
              >
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent divider-ornate" />

                {rsvpStatus === "PENDING" && !isDeadlinePassed && (
                  <div className="text-center">
                    <p className="mb-4 text-sm font-medium">Will you be joining us?</p>
                    <div className="flex justify-center gap-3">
                      <Button
                        size="lg"
                        onClick={() => handleQuickRsvp("ATTENDING")}
                        disabled={submitting}
                        style={{ backgroundColor: wedding.primaryColorHex }}
                        className="text-white hover:-translate-y-0.5 transition-all duration-300 shadow-wedding"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {submitting ? "Submitting..." : "Joyfully Accept"}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleQuickRsvp("DECLINED")}
                        disabled={submitting}
                        className="hover:-translate-y-0.5 transition-all duration-300 shadow-wedding"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Regretfully Decline
                      </Button>
                    </div>
                    {guest.plusOneAllowed && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Plus-one & dietary details can be updated on your{" "}
                        <a
                          href={`/guest/${guest.token}`}
                          className="underline"
                          style={{ color: styles.accentColor }}
                        >
                          guest portal
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {rsvpStatus === "ATTENDING" && (
                  <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-950">
                    <Check className="mx-auto h-6 w-6 text-green-600" />
                    <p className="mt-2 font-semibold text-green-800 dark:text-green-300">
                      You&apos;re confirmed!
                    </p>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      We can&apos;t wait to celebrate with you.
                    </p>
                    <a
                      href={`/guest/${guest.token}`}
                      className="mt-2 inline-block text-sm underline"
                      style={{ color: styles.accentColor }}
                    >
                      View your guest portal
                    </a>
                  </div>
                )}

                {rsvpStatus === "DECLINED" && (
                  <div className="rounded-xl bg-muted p-4 text-center">
                    <p className="font-semibold">We&apos;ll miss you!</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your response has been recorded. You can change your mind on your{" "}
                      <a
                        href={`/guest/${guest.token}`}
                        className="underline"
                        style={{ color: styles.accentColor }}
                      >
                        guest portal
                      </a>
                    </p>
                  </div>
                )}

                {isDeadlinePassed && rsvpStatus === "PENDING" && (
                  <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      The RSVP deadline has passed. Please contact the planner directly.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {!guest && (
              <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                This is a preview of the invitation. Guest RSVP will appear when opened via a personalised link.
              </div>
            )}

            {/* Share button */}
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={handleWhatsAppShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share on WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Powered by WedTech &middot; Events by Athea
        </p>
      </motion.div>
    </div>
  );
}
