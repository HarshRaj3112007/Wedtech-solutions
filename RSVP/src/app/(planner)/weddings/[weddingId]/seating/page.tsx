"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";

interface AssignedGuest {
  id: string;
  guest: {
    id: string;
    name: string;
    phone: string;
    isVip: boolean;
    dietaryPref: string;
    groupTag: string | null;
  };
}

interface SeatingTableData {
  id: string;
  tableNumber: number;
  label: string | null;
  capacity: number;
  zone: string | null;
  positionX: number | null;
  positionY: number | null;
  event: { id: string; name: string; slug: string; date: string };
  assignedGuests: AssignedGuest[];
}

interface WeddingEvent {
  id: string;
  name: string;
}

export default function SeatingPage() {
  const params = useParams<{ weddingId: string }>();
  const [tables, setTables] = useState<SeatingTableData[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    eventId: "",
    tableNumber: 1,
    label: "",
    capacity: 10,
    zone: "",
  });

  // Load events
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`/api/weddings/${params.weddingId}/events`);
        const json = await res.json();
        if (json.success) {
          setEvents(json.data);
          if (json.data.length > 0 && !selectedEvent) {
            setSelectedEvent(json.data[0].id);
          }
        }
      } catch { /* ignore */ }
    }
    loadEvents();
  }, [params.weddingId, selectedEvent]);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const ep = selectedEvent ? `?eventId=${selectedEvent}` : "";
      const res = await fetch(`/api/weddings/${params.weddingId}/seating${ep}`);
      const json = await res.json();
      if (json.success) setTables(json.data);
    } catch {
      toast.error("Failed to load seating");
    } finally {
      setLoading(false);
    }
  }, [params.weddingId, selectedEvent]);

  useEffect(() => {
    if (selectedEvent) fetchTables();
  }, [selectedEvent, fetchTables]);

  async function handleAddTable() {
    if (!form.eventId) {
      toast.error("Select an event");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/seating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Table added");
        setShowAdd(false);
        fetchTables();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to add table");
    } finally {
      setSaving(false);
    }
  }

  // Colour by side (bride vs groom)
  function guestChipColor(guest: AssignedGuest["guest"]) {
    if (guest.isVip) return "bg-[#d4a017]/15 text-[#b8860b] border-[#d4a017]/30";
    return "bg-muted text-foreground";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-[#d4a017]/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href={`/weddings/${params.weddingId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-display">Seating Plan</h1>
          </div>
          <Select value={selectedEvent} onValueChange={(v) => setSelectedEvent(v ?? "")}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select event" /></SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { setForm((f) => ({ ...f, eventId: selectedEvent })); setShowAdd(true); }} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
            <Plus className="mr-2 h-4 w-4" /> Add Table
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 bg-mesh">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        )}

        {/* Visual seating chart: tables as cards with guest chips */}
        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tables.length === 0 && (
              <Card className="col-span-full border-dashed">
                <CardHeader className="items-center text-center">
                  <CardTitle>No tables yet</CardTitle>
                  <CardDescription>Add seating tables for this event.</CardDescription>
                </CardHeader>
              </Card>
            )}

            {tables.map((table) => {
              const filled = table.assignedGuests.length;
              const isFull = filled >= table.capacity;
              return (
                <div className="card-3d" key={table.id}>
                  <Card className={`card-3d-inner glass-card ${isFull ? "border-green-300" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Table {table.tableNumber}
                            {table.label && ` — ${table.label}`}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {table.zone && `${table.zone} · `}
                            {filled}/{table.capacity} seats filled
                          </CardDescription>
                        </div>
                        <Badge variant={isFull ? "default" : "outline"} className="text-xs">
                          {isFull ? "Full" : `${table.capacity - filled} open`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {table.assignedGuests.map((ag) => (
                          <span
                            key={ag.id}
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${guestChipColor(ag.guest)}`}
                          >
                            {ag.guest.name}
                            {ag.guest.isVip && " ★"}
                          </span>
                        ))}
                        {filled === 0 && (
                          <span className="text-xs text-muted-foreground">No guests assigned</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Table Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Seating Table</DialogTitle>
            <DialogDescription>Create a table for the selected event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={form.eventId} onValueChange={(v) => setForm((f) => ({ ...f, eventId: v ?? "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Table Number</Label>
              <Input type="number" min={1} value={form.tableNumber} onChange={(e) => setForm((f) => ({ ...f, tableNumber: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Rose Table" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 10 }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Zone (optional)</Label>
              <Input value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} placeholder="Stage Side, Garden, Entrance..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddTable} disabled={saving} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
              {saving ? "Adding..." : "Add Table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
