"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Clock,
  Shirt,
  Check,
  X,
  Hotel,
  QrCode,
  UtensilsCrossed,
  MapPinned,
} from "lucide-react";
import { DIETARY_LABELS } from "@/lib/constants";

interface EventInvite {
  id: string;
  rsvpStatus: string;
  plusOneCount: number;
  childrenCount: number;
  specialNotes: string | null;
  respondedAt: string | null;
  event: {
    id: string;
    name: string;
    slug: string;
    date: string;
    time: string | null;
    venue: string | null;
    dressCode: string | null;
  };
  seatingTable: {
    label: string | null;
    tableNumber: number;
    zone: string | null;
  } | null;
}

interface PortalData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  token: string;
  dietaryPref: string;
  dietaryNotes: string | null;
  isOutstation: boolean;
  plusOneAllowed: boolean;
  isVip: boolean;
  wedding: {
    brideName: string;
    groomName: string;
    weddingCode: string;
    city: string | null;
    venueName: string | null;
    primaryColorHex: string;
    secondaryColorHex: string;
    bannerImageUrl: string | null;
    timezone: string;
    rsvpDeadline: string | null;
  };
  eventInvites: EventInvite[];
  accommodationRoom: {
    hotelName: string;
    roomNumber: string;
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
  } | null;
  plusOnes: Array<{ id: string; name: string; dietaryPref: string }>;
  checkIns: Array<{ eventId: string; checkedInAt: string }>;
}

export function GuestPortalClient({ data }: { data: PortalData }) {
  const { wedding } = data;
  const [invites, setInvites] = useState(data.eventInvites);
  const [dietary, setDietary] = useState(data.dietaryPref);
  const [dietaryNotes, setDietaryNotes] = useState(data.dietaryNotes || "");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [savingDiet, setSavingDiet] = useState(false);

  async function handleRsvp(eventId: string, status: "ATTENDING" | "DECLINED") {
    setSubmitting(eventId);
    try {
      const res = await fetch(`/api/guests/${data.token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestToken: data.token,
          responses: [{ eventId, rsvpStatus: status, plusOneCount: 0, childrenCount: 0 }],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInvites((prev) =>
          prev.map((inv) =>
            inv.event.id === eventId
              ? { ...inv, rsvpStatus: status, respondedAt: new Date().toISOString() }
              : inv
          )
        );
        toast.success(status === "ATTENDING" ? "See you there!" : "Response recorded.");
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(null);
    }
  }

  async function saveDietary() {
    setSavingDiet(true);
    try {
      const res = await fetch(`/api/guests/${data.token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestToken: data.token,
          dietaryPref: dietary,
          dietaryNotes,
          responses: [],
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Dietary preferences updated");
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingDiet(false);
    }
  }

  const isDeadlinePassed = wedding.rsvpDeadline
    ? new Date(wedding.rsvpDeadline) < new Date()
    : false;

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background: `linear-gradient(180deg, ${wedding.primaryColorHex}08 0%, #ffffff 30%, ${wedding.secondaryColorHex}05 100%)`,
      }}
    >
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {wedding.brideName} & {wedding.groomName}
          </p>
          <h1 className="mt-2 text-2xl font-bold">Welcome, {data.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personal guest portal
          </p>
        </motion.div>

        {/* Events */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your Events
          </h2>
          {invites.map((inv, i) => {
            const checkedIn = data.checkIns.find((c) => c.eventId === inv.event.id);
            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{inv.event.name}</CardTitle>
                      <Badge
                        variant={
                          inv.rsvpStatus === "ATTENDING"
                            ? "default"
                            : inv.rsvpStatus === "DECLINED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {inv.rsvpStatus === "ATTENDING"
                          ? "Attending"
                          : inv.rsvpStatus === "DECLINED"
                          ? "Declined"
                          : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(inv.event.date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      {inv.event.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{inv.event.time}
                        </span>
                      )}
                      {inv.event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{inv.event.venue}
                        </span>
                      )}
                      {inv.event.dressCode && (
                        <span className="flex items-center gap-1">
                          <Shirt className="h-3 w-3" />{inv.event.dressCode}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Seating info */}
                    {inv.seatingTable && (
                      <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                        Table {inv.seatingTable.tableNumber}
                        {inv.seatingTable.label && ` — ${inv.seatingTable.label}`}
                        {inv.seatingTable.zone && ` (${inv.seatingTable.zone})`}
                      </div>
                    )}

                    {/* Check-in status */}
                    {checkedIn && (
                      <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                        <Check className="mr-1 inline h-3 w-3" />
                        Checked in at{" "}
                        {new Date(checkedIn.checkedInAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    )}

                    {/* RSVP buttons (if still pending or changeable) */}
                    {inv.rsvpStatus === "PENDING" && !isDeadlinePassed && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRsvp(inv.event.id, "ATTENDING")}
                          disabled={submitting === inv.event.id}
                          style={{ backgroundColor: wedding.primaryColorHex }}
                        >
                          <Check className="mr-1 h-3 w-3" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRsvp(inv.event.id, "DECLINED")}
                          disabled={submitting === inv.event.id}
                        >
                          <X className="mr-1 h-3 w-3" /> Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Dietary preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="h-4 w-4" /> Dietary Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={dietary} onValueChange={(v) => setDietary(v ?? "VEG")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VEG">Vegetarian</SelectItem>
                <SelectItem value="NON_VEG">Non-Vegetarian</SelectItem>
                <SelectItem value="JAIN">Jain</SelectItem>
                <SelectItem value="VEGAN">Vegan</SelectItem>
                <SelectItem value="CUSTOM">Custom / Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Any allergies or special requirements..."
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              rows={2}
            />
            <Button size="sm" onClick={saveDietary} disabled={savingDiet}>
              {savingDiet ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        {/* Accommodation */}
        {data.accommodationRoom && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Hotel className="h-4 w-4" /> Your Accommodation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{data.accommodationRoom.hotelName}</p>
              <p>
                Room {data.accommodationRoom.roomNumber} ({data.accommodationRoom.roomType})
              </p>
              <p className="text-muted-foreground">
                Check-in:{" "}
                {new Date(data.accommodationRoom.checkInDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short",
                })}
                {" — "}
                Check-out:{" "}
                {new Date(data.accommodationRoom.checkOutDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short",
                })}
              </p>
              {wedding.venueName && wedding.city && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(
                    `${wedding.venueName} ${wedding.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm underline"
                  style={{ color: wedding.primaryColorHex }}
                >
                  <MapPinned className="h-3 w-3" /> View venue on Google Maps
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR code link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" /> Check-In Pass
            </CardTitle>
            <CardDescription>
              Show this QR code at the venue for quick check-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your QR check-in pass will be sent via WhatsApp before each event.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">
          Powered by WedTech &middot; Events by Athea
        </p>
      </div>
    </div>
  );
}
