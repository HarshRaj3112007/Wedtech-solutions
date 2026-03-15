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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Plus, Hotel, Users, AlertTriangle } from "lucide-react";

interface Room {
  id: string;
  hotelName: string;
  roomNumber: string;
  roomType: string;
  maxOccupancy: number;
  checkInDate: string;
  checkOutDate: string;
  notes: string | null;
  assignedGuests: Array<{
    id: string;
    name: string;
    phone: string;
    isVip: boolean;
  }>;
}

export default function AccommodationPage() {
  const params = useParams<{ weddingId: string }>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hotelName: "",
    roomNumber: "",
    roomType: "Deluxe",
    maxOccupancy: 2,
    checkInDate: "",
    checkOutDate: "",
    notes: "",
  });

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/accommodation`);
      const json = await res.json();
      if (json.success) setRooms(json.data);
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [params.weddingId]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  async function handleAddRoom() {
    if (!form.hotelName || !form.roomNumber || !form.checkInDate || !form.checkOutDate) {
      toast.error("Hotel name, room number, and dates are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/accommodation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          checkInDate: new Date(form.checkInDate).toISOString(),
          checkOutDate: new Date(form.checkOutDate).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Room added");
        setShowAdd(false);
        setForm({ hotelName: "", roomNumber: "", roomType: "Deluxe", maxOccupancy: 2, checkInDate: "", checkOutDate: "", notes: "" });
        fetchRooms();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to add room");
    } finally {
      setSaving(false);
    }
  }

  // Group rooms by hotel
  const hotels = new Map<string, Room[]>();
  rooms.forEach((r) => {
    const list = hotels.get(r.hotelName) || [];
    list.push(r);
    hotels.set(r.hotelName, list);
  });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.assignedGuests.length > 0).length;
  const fullRooms = rooms.filter((r) => r.assignedGuests.length >= r.maxOccupancy).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href={`/weddings/${params.weddingId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Accommodation</h1>
            <p className="text-xs text-muted-foreground">
              {totalRooms} rooms &middot; {occupiedRooms} occupied &middot; {fullRooms} full
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Rooms</CardDescription>
              <CardTitle className="text-2xl">{totalRooms}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Partially/Fully Occupied</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{occupiedRooms}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Empty Rooms</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{totalRooms - occupiedRooms}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        )}

        {/* Rooms by hotel */}
        {Array.from(hotels.entries()).map(([hotelName, hotelRooms]) => (
          <Card key={hotelName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" /> {hotelName}
              </CardTitle>
              <CardDescription>{hotelRooms.length} rooms</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotelRooms.map((room) => {
                    const occupancy = room.assignedGuests.length;
                    const isFull = occupancy >= room.maxOccupancy;
                    return (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.roomNumber}</TableCell>
                        <TableCell className="text-sm">{room.roomType}</TableCell>
                        <TableCell className="text-sm">{room.maxOccupancy}</TableCell>
                        <TableCell>
                          {occupancy > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {room.assignedGuests.map((g) => (
                                <Badge key={g.id} variant="secondary" className="text-xs">
                                  {g.name}
                                  {g.isVip && " (VIP)"}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Empty</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isFull ? (
                            <Badge className="bg-green-600">Full</Badge>
                          ) : occupancy > 0 ? (
                            <Badge variant="secondary">{occupancy}/{room.maxOccupancy}</Badge>
                          ) : (
                            <Badge variant="outline">Empty</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(room.checkInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {" — "}
                          {new Date(room.checkOutDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {!loading && rooms.length === 0 && (
          <Card className="border-dashed">
            <CardHeader className="items-center text-center">
              <Hotel className="h-8 w-8 text-muted-foreground" />
              <CardTitle>No rooms added yet</CardTitle>
              <CardDescription>Add hotel rooms to start assigning outstation guests.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      {/* Add Room Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>Add a hotel room for guest accommodation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hotel Name</Label>
              <Input value={form.hotelName} onChange={(e) => setForm((f) => ({ ...f, hotelName: e.target.value }))} placeholder="The Leela Palace" />
            </div>
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input value={form.roomNumber} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} placeholder="301" />
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Input value={form.roomType} onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))} placeholder="Deluxe / Suite" />
            </div>
            <div className="space-y-2">
              <Label>Max Occupancy</Label>
              <Input type="number" min={1} value={form.maxOccupancy} onChange={(e) => setForm((f) => ({ ...f, maxOccupancy: parseInt(e.target.value) || 2 }))} />
            </div>
            <div className="space-y-2">
              <Label>Check-In Date</Label>
              <Input type="date" value={form.checkInDate} onChange={(e) => setForm((f) => ({ ...f, checkInDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Check-Out Date</Label>
              <Input type="date" value={form.checkOutDate} onChange={(e) => setForm((f) => ({ ...f, checkOutDate: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any special notes..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddRoom} disabled={saving}>
              {saving ? "Adding..." : "Add Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
