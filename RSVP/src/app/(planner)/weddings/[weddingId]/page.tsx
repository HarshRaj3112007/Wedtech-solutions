"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Users,
  Trash2,
  Pencil,
  BarChart3,
  Shirt,
} from "lucide-react";
import { COMMON_EVENT_PRESETS } from "@/lib/constants";

interface EventWithCounts {
  id: string;
  name: string;
  slug: string;
  date: string;
  time: string | null;
  venue: string | null;
  dressCode: string | null;
  description: string | null;
  isActive: boolean;
  checkInPin: string | null;
  _count: { guestEventInvites: number; checkIns: number };
  rsvpCounts: {
    total: number;
    attending: number;
    declined: number;
    pending: number;
    plusOnes: number;
    children: number;
    totalPax: number;
  };
}

interface WeddingDetail {
  id: string;
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
  events: EventWithCounts[];
  _count: { guests: number };
}

export default function WeddingDetailPage() {
  const params = useParams<{ weddingId: string }>();
  const router = useRouter();
  const [wedding, setWedding] = useState<WeddingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithCounts | null>(null);
  const [eventForm, setEventForm] = useState({
    name: "",
    date: "",
    time: "",
    venue: "",
    dressCode: "",
    description: "",
    checkInPin: "",
  });
  const [savingEvent, setSavingEvent] = useState(false);

  const fetchWedding = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}`);
      const json = await res.json();
      if (json.success) {
        setWedding(json.data);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to load wedding");
    } finally {
      setLoading(false);
    }
  }, [params.weddingId]);

  useEffect(() => {
    fetchWedding();
  }, [fetchWedding]);

  function resetEventForm() {
    setEventForm({ name: "", date: "", time: "", venue: "", dressCode: "", description: "", checkInPin: "" });
  }

  function openEditEvent(event: EventWithCounts) {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      date: new Date(event.date).toISOString().slice(0, 16),
      time: event.time || "",
      venue: event.venue || "",
      dressCode: event.dressCode || "",
      description: event.description || "",
      checkInPin: event.checkInPin || "",
    });
  }

  function applyPreset(preset: typeof COMMON_EVENT_PRESETS[number]) {
    setEventForm((prev) => ({
      ...prev,
      name: preset.name,
      dressCode: preset.dressCode,
    }));
  }

  async function handleSaveEvent() {
    if (!eventForm.name || !eventForm.date) {
      toast.error("Event name and date are required");
      return;
    }

    setSavingEvent(true);
    try {
      const isEdit = !!editingEvent;
      const url = isEdit
        ? `/api/weddings/${params.weddingId}/events/${editingEvent.id}`
        : `/api/weddings/${params.weddingId}/events`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventForm.name,
          date: new Date(eventForm.date).toISOString(),
          time: eventForm.time || null,
          venue: eventForm.venue || null,
          dressCode: eventForm.dressCode || null,
          description: eventForm.description || null,
          checkInPin: eventForm.checkInPin || null,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error);
        return;
      }

      toast.success(isEdit ? "Event updated" : "Event created");
      setShowNewEvent(false);
      setEditingEvent(null);
      resetEventForm();
      fetchWedding();
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string, eventName: string) {
    if (!confirm(`Delete "${eventName}"? This will remove all guest invitations and check-in data for this event.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/events/${eventId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Event deleted");
        fetchWedding();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to delete event");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="mb-8 h-4 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Wedding not found.</p>
      </div>
    );
  }

  const eventDialogContent = (
    <div className="space-y-4">
      {/* Presets row */}
      {!editingEvent && (
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Quick presets</Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_EVENT_PRESETS.map((p) => (
              <Button
                key={p.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(p)}
              >
                {p.icon} {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Event Name</Label>
          <Input
            value={eventForm.name}
            onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Sangeet Night"
          />
        </div>
        <div className="space-y-2">
          <Label>Date & Time</Label>
          <Input
            type="datetime-local"
            value={eventForm.date}
            onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Display Time (optional)</Label>
          <Input
            value={eventForm.time}
            onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value }))}
            placeholder="7:00 PM onwards"
          />
        </div>
        <div className="space-y-2">
          <Label>Venue</Label>
          <Input
            value={eventForm.venue}
            onChange={(e) => setEventForm((f) => ({ ...f, venue: e.target.value }))}
            placeholder="Lakeside Lawns"
          />
        </div>
        <div className="space-y-2">
          <Label>Dress Code</Label>
          <Input
            value={eventForm.dressCode}
            onChange={(e) => setEventForm((f) => ({ ...f, dressCode: e.target.value }))}
            placeholder="Festive / Semi-Formal"
          />
        </div>
        <div className="space-y-2">
          <Label>Check-in PIN (for staff)</Label>
          <Input
            value={eventForm.checkInPin}
            onChange={(e) => setEventForm((f) => ({ ...f, checkInPin: e.target.value }))}
            placeholder="4-6 digit PIN"
            maxLength={6}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={eventForm.description}
          onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="A night of music, dance and celebration..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-[#d4a017]/10">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-display">
              {wedding.brideName} & {wedding.groomName}
            </h1>
            <p className="text-xs text-muted-foreground">
              /{wedding.weddingCode} &middot; {wedding.city || "No city"} &middot;{" "}
              {wedding._count.guests} guests
            </p>
          </div>
          <div
            className="h-6 w-12 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${wedding.primaryColorHex}, ${wedding.secondaryColorHex})`,
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 bg-paisley-corner">
        <Tabs defaultValue="events">
          <TabsList className="mb-6">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="guests">
              <Link href={`/weddings/${wedding.id}/guests`}>Guests</Link>
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Wedding Events</h2>
              <Dialog
                open={showNewEvent}
                onOpenChange={(open) => {
                  setShowNewEvent(open);
                  if (!open) resetEventForm();
                }}
              >
                <DialogTrigger
                  render={<Button className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all"><Plus className="mr-2 h-4 w-4" /> Add Event</Button>}
                />
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                      Create a wedding event like Sangeet, Mehendi, Reception, etc.
                    </DialogDescription>
                  </DialogHeader>
                  {eventDialogContent}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewEvent(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEvent} disabled={savingEvent} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
                      {savingEvent ? "Creating..." : "Create Event"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit event dialog */}
            <Dialog
              open={!!editingEvent}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingEvent(null);
                  resetEventForm();
                }
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>Update event details.</DialogDescription>
                </DialogHeader>
                {eventDialogContent}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingEvent(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEvent} disabled={savingEvent} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
                    {savingEvent ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Events grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wedding.events.length === 0 && (
                <Card className="col-span-full border-dashed">
                  <CardHeader className="items-center text-center">
                    <CardTitle>No events yet</CardTitle>
                    <CardDescription>
                      Add your first event — Sangeet, Mehendi, Reception, etc.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {wedding.events.map((event) => (
                <div className="card-3d" key={event.id}>
                  <Card className="relative card-3d-inner glass-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{event.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditEvent(event)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteEvent(event.id, event.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {event.time && ` · ${event.time}`}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.venue}
                          </span>
                        )}
                        {event.dressCode && (
                          <span className="flex items-center gap-1">
                            <Shirt className="h-3 w-3" />
                            {event.dressCode}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* RSVP counts */}
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-md bg-green-50 px-2 py-1.5 dark:bg-green-950">
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">
                            {event.rsvpCounts.attending}
                          </p>
                          <p className="text-[10px] text-green-600 dark:text-green-500">Attending</p>
                        </div>
                        <div className="rounded-md bg-red-50 px-2 py-1.5 dark:bg-red-950">
                          <p className="text-lg font-bold text-red-700 dark:text-red-400">
                            {event.rsvpCounts.declined}
                          </p>
                          <p className="text-[10px] text-red-600 dark:text-red-500">Declined</p>
                        </div>
                        <div className="rounded-md bg-amber-50 px-2 py-1.5 dark:bg-amber-950">
                          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                            {event.rsvpCounts.pending}
                          </p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500">Pending</p>
                        </div>
                      </div>
                      {event.rsvpCounts.totalPax > 0 && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          Total PAX: <strong>{event.rsvpCounts.totalPax}</strong>
                          {event.rsvpCounts.plusOnes > 0 && ` (${event.rsvpCounts.plusOnes} +1s)`}
                          {event.rsvpCounts.children > 0 && ` (${event.rsvpCounts.children} children)`}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.rsvpCounts.total} invited
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {event._count.checkIns} checked in
                        </span>
                      </div>
                      {!event.isActive && (
                        <Badge variant="secondary" className="mt-2">
                          Inactive
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <WeddingSettings wedding={wedding} onUpdate={fetchWedding} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/** Inline settings component for editing wedding metadata */
function WeddingSettings({
  wedding,
  onUpdate,
}: {
  wedding: WeddingDetail;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    city: wedding.city || "",
    venueName: wedding.venueName || "",
    primaryColorHex: wedding.primaryColorHex,
    secondaryColorHex: wedding.secondaryColorHex,
    timezone: wedding.timezone,
    rsvpDeadline: wedding.rsvpDeadline
      ? new Date(wedding.rsvpDeadline).toISOString().slice(0, 16)
      : "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/weddings/${wedding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rsvpDeadline: form.rsvpDeadline
            ? new Date(form.rsvpDeadline).toISOString()
            : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Wedding updated");
        onUpdate();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete the entire wedding "${wedding.brideName} & ${wedding.groomName}"? This cannot be undone and removes all guests, events, and data.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/weddings/${wedding.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Wedding deleted");
        router.push("/dashboard");
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to delete wedding");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wedding Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Bride&apos;s Name</Label>
            <Input
              value={form.brideName}
              onChange={(e) => setForm((f) => ({ ...f, brideName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Groom&apos;s Name</Label>
            <Input
              value={form.groomName}
              onChange={(e) => setForm((f) => ({ ...f, groomName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Venue</Label>
            <Input
              value={form.venueName}
              onChange={(e) => setForm((f) => ({ ...f, venueName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Primary Colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-9 cursor-pointer rounded border"
                value={form.primaryColorHex}
                onChange={(e) => setForm((f) => ({ ...f, primaryColorHex: e.target.value }))}
              />
              <Input
                value={form.primaryColorHex}
                onChange={(e) => setForm((f) => ({ ...f, primaryColorHex: e.target.value }))}
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secondary Colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-9 cursor-pointer rounded border"
                value={form.secondaryColorHex}
                onChange={(e) => setForm((f) => ({ ...f, secondaryColorHex: e.target.value }))}
              />
              <Input
                value={form.secondaryColorHex}
                onChange={(e) => setForm((f) => ({ ...f, secondaryColorHex: e.target.value }))}
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>RSVP Deadline</Label>
            <Input
              type="datetime-local"
              value={form.rsvpDeadline}
              onChange={(e) => setForm((f) => ({ ...f, rsvpDeadline: e.target.value }))}
            />
          </div>
        </CardContent>
        <div className="flex justify-end gap-3 border-t p-6">
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this wedding and all related data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Wedding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
