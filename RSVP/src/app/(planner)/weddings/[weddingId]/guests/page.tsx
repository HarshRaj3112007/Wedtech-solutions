"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Upload,
  Search,
  Trash2,
  Pencil,
  Star,
  Plane,
  Download,
} from "lucide-react";
import {
  DIETARY_LABELS,
  RSVP_STATUS_LABELS,
  RELATIONSHIP_SIDE_LABELS,
} from "@/lib/constants";

interface GuestEvent {
  id: string;
  event: { id: string; name: string; slug: string; date: string };
  rsvpStatus: string;
  plusOneCount: number;
  childrenCount: number;
}

interface GuestRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relationshipSide: string;
  groupTag: string | null;
  isVip: boolean;
  isOutstation: boolean;
  dietaryPref: string;
  dietaryNotes: string | null;
  plusOneAllowed: boolean;
  token: string;
  eventInvites: GuestEvent[];
  accommodationRoom: { id: string; hotelName: string; roomNumber: string } | null;
  plusOnes: Array<{ id: string; name: string; dietaryPref: string }>;
}

interface WeddingEvent {
  id: string;
  name: string;
  slug: string;
  date: string;
}

export default function GuestsPage() {
  const params = useParams<{ weddingId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filters
  const [search, setSearch] = useState("");
  const [filterSide, setFilterSide] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterRsvp, setFilterRsvp] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [filterVip, setFilterVip] = useState(false);
  const [filterOutstation, setFilterOutstation] = useState(false);

  // Add/Edit dialog
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestRow | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    email: "",
    relationshipSide: "MUTUAL",
    groupTag: "",
    isVip: false,
    isOutstation: false,
    dietaryPref: "VEG",
    dietaryNotes: "",
    plusOneAllowed: false,
    eventIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  // Import dialog
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<Record<string, string>[] | null>(null);
  const [importing, setImporting] = useState(false);

  // Fetch events once
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`/api/weddings/${params.weddingId}/events`);
        const json = await res.json();
        if (json.success) setEvents(json.data);
      } catch { /* ignore */ }
    }
    loadEvents();
  }, [params.weddingId]);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (filterSide) sp.set("side", filterSide);
      if (filterGroup) sp.set("group", filterGroup);
      if (filterRsvp) sp.set("rsvpStatus", filterRsvp);
      if (filterEvent) sp.set("eventId", filterEvent);
      if (filterVip) sp.set("isVip", "true");
      if (filterOutstation) sp.set("isOutstation", "true");

      const res = await fetch(`/api/weddings/${params.weddingId}/guests?${sp.toString()}`);
      const json = await res.json();
      if (json.success) {
        setGuests(json.data);
        setTotal(json.meta?.total || 0);
      }
    } catch {
      toast.error("Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [params.weddingId, page, search, filterSide, filterGroup, filterRsvp, filterEvent, filterVip, filterOutstation]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function resetGuestForm() {
    setGuestForm({
      name: "", phone: "", email: "", relationshipSide: "MUTUAL", groupTag: "",
      isVip: false, isOutstation: false, dietaryPref: "VEG", dietaryNotes: "",
      plusOneAllowed: false, eventIds: [],
    });
  }

  function openEditGuest(guest: GuestRow) {
    setEditingGuest(guest);
    setGuestForm({
      name: guest.name,
      phone: guest.phone,
      email: guest.email || "",
      relationshipSide: guest.relationshipSide,
      groupTag: guest.groupTag || "",
      isVip: guest.isVip,
      isOutstation: guest.isOutstation,
      dietaryPref: guest.dietaryPref,
      dietaryNotes: guest.dietaryNotes || "",
      plusOneAllowed: guest.plusOneAllowed,
      eventIds: guest.eventInvites.map((ei) => ei.event.id),
    });
  }

  async function handleSaveGuest() {
    if (!guestForm.name || !guestForm.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editingGuest;
      const url = isEdit
        ? `/api/weddings/${params.weddingId}/guests/${editingGuest.id}`
        : `/api/weddings/${params.weddingId}/guests`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestForm),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      toast.success(isEdit ? "Guest updated" : "Guest added");
      setShowAddGuest(false);
      setEditingGuest(null);
      resetGuestForm();
      fetchGuests();
    } catch {
      toast.error("Failed to save guest");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGuest(guestId: string, guestName: string) {
    if (!confirm(`Delete guest "${guestName}"? This removes all their RSVPs and check-in data.`)) return;
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/guests/${guestId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Guest deleted");
        fetchGuests();
      } else {
        toast.error(json.error);
      }
    } catch { toast.error("Failed to delete guest"); }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        setImportData(results.data as Record<string, string>[]);
        setShowImport(true);
      },
      error() {
        toast.error("Failed to parse CSV file");
      },
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!importData) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/guests/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importData }),
      });
      const json = await res.json();
      if (json.success) {
        const { imported, skipped, errors } = json.data;
        toast.success(`Imported ${imported} guests. ${skipped} skipped.`);
        if (errors.length > 0) {
          console.warn("Import errors:", errors);
        }
        setShowImport(false);
        setImportData(null);
        fetchGuests();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  // Collect unique group tags for filter
  const allGroups = [...new Set(guests.map((g) => g.groupTag).filter(Boolean))] as string[];
  const totalPages = Math.ceil(total / pageSize);

  const guestDialog = (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={guestForm.name}
            onChange={(e) => setGuestForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Guest full name"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input
            value={guestForm.phone}
            onChange={(e) => setGuestForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            value={guestForm.email}
            onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Side</Label>
          <Select
            value={guestForm.relationshipSide}
            onValueChange={(v) => setGuestForm((f) => ({ ...f, relationshipSide: v ?? "MUTUAL" }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BRIDE">Bride&apos;s Side</SelectItem>
              <SelectItem value="GROOM">Groom&apos;s Side</SelectItem>
              <SelectItem value="MUTUAL">Mutual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Group Tag</Label>
          <Input
            value={guestForm.groupTag}
            onChange={(e) => setGuestForm((f) => ({ ...f, groupTag: e.target.value }))}
            placeholder="e.g. College Friends, Family"
          />
        </div>
        <div className="space-y-2">
          <Label>Dietary Preference</Label>
          <Select
            value={guestForm.dietaryPref}
            onValueChange={(v) => setGuestForm((f) => ({ ...f, dietaryPref: v ?? "VEG" }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="VEG">Vegetarian</SelectItem>
              <SelectItem value="NON_VEG">Non-Vegetarian</SelectItem>
              <SelectItem value="JAIN">Jain</SelectItem>
              <SelectItem value="VEGAN">Vegan</SelectItem>
              <SelectItem value="CUSTOM">Custom / Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Dietary Notes / Allergies</Label>
        <Textarea
          value={guestForm.dietaryNotes}
          onChange={(e) => setGuestForm((f) => ({ ...f, dietaryNotes: e.target.value }))}
          placeholder="Any allergies or special dietary requirements"
          rows={2}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={guestForm.isVip}
            onCheckedChange={(v) => setGuestForm((f) => ({ ...f, isVip: !!v }))}
          />
          VIP Guest
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={guestForm.isOutstation}
            onCheckedChange={(v) => setGuestForm((f) => ({ ...f, isOutstation: !!v }))}
          />
          Outstation
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={guestForm.plusOneAllowed}
            onCheckedChange={(v) => setGuestForm((f) => ({ ...f, plusOneAllowed: !!v }))}
          />
          Plus-One Allowed
        </label>
      </div>
      {/* Event assignment (only for new guests — editing events uses separate flow) */}
      {!editingGuest && events.length > 0 && (
        <div className="space-y-2">
          <Label>Invite to Events</Label>
          <div className="flex flex-wrap gap-3">
            {events.map((ev) => (
              <label key={ev.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={guestForm.eventIds.includes(ev.id)}
                  onCheckedChange={(checked) => {
                    setGuestForm((f) => ({
                      ...f,
                      eventIds: checked
                        ? [...f.eventIds, ev.id]
                        : f.eventIds.filter((id) => id !== ev.id),
                    }));
                  }}
                />
                {ev.name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href={`/weddings/${params.weddingId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Guest Management</h1>
            <p className="text-xs text-muted-foreground">{total} guests total</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button size="sm" onClick={() => { setShowAddGuest(true); resetGuestForm(); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Guest
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterSide} onValueChange={(v) => { setFilterSide(v === "all" ? "" : v ?? ""); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All sides" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sides</SelectItem>
              <SelectItem value="BRIDE">Bride</SelectItem>
              <SelectItem value="GROOM">Groom</SelectItem>
              <SelectItem value="MUTUAL">Mutual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRsvp} onValueChange={(v) => { setFilterRsvp(v === "all" ? "" : v ?? ""); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="RSVP status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ATTENDING">Attending</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
            </SelectContent>
          </Select>
          {events.length > 0 && (
            <Select value={filterEvent} onValueChange={(v) => { setFilterEvent(v === "all" ? "" : v ?? ""); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All events" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant={filterVip ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterVip(!filterVip); setPage(1); }}
          >
            <Star className="mr-1 h-3 w-3" /> VIP
          </Button>
          <Button
            variant={filterOutstation ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterOutstation(!filterOutstation); setPage(1); }}
          >
            <Plane className="mr-1 h-3 w-3" /> Outstation
          </Button>
        </div>

        {/* Guest Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Diet</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))}
                  {!loading && guests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        No guests found. Add guests manually or import from CSV.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{guest.name}</span>
                            {guest.isVip && (
                              <Badge variant="default" className="bg-amber-500 text-[10px] px-1 py-0">
                                VIP
                              </Badge>
                            )}
                            {guest.isOutstation && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                OOS
                              </Badge>
                            )}
                          </div>
                          {guest.email && (
                            <p className="text-xs text-muted-foreground">{guest.email}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{guest.phone}</TableCell>
                        <TableCell className="text-xs">
                          {RELATIONSHIP_SIDE_LABELS[guest.relationshipSide] || guest.relationshipSide}
                        </TableCell>
                        <TableCell className="text-xs">{guest.groupTag || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {DIETARY_LABELS[guest.dietaryPref] || guest.dietaryPref}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {guest.eventInvites.map((ei) => (
                              <Badge
                                key={ei.id}
                                variant={
                                  ei.rsvpStatus === "ATTENDING"
                                    ? "default"
                                    : ei.rsvpStatus === "DECLINED"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-[10px] px-1.5 py-0"
                              >
                                {ei.event.name}
                              </Badge>
                            ))}
                            {guest.eventInvites.length === 0 && (
                              <span className="text-xs text-muted-foreground">No events</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditGuest(guest)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDeleteGuest(guest.id, guest.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Guest Dialog */}
      <Dialog
        open={showAddGuest || !!editingGuest}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddGuest(false);
            setEditingGuest(null);
            resetGuestForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGuest ? "Edit Guest" : "Add Guest"}</DialogTitle>
            <DialogDescription>
              {editingGuest
                ? "Update guest information."
                : "Add a new guest and assign them to events."}
            </DialogDescription>
          </DialogHeader>
          {guestDialog}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddGuest(false);
                setEditingGuest(null);
                resetGuestForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveGuest} disabled={saving}>
              {saving ? "Saving..." : editingGuest ? "Save Changes" : "Add Guest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              {importData?.length || 0} rows found. Review before importing.
            </DialogDescription>
          </DialogHeader>
          {importData && (
            <div className="max-h-[400px] overflow-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {Object.keys(importData[0] || {}).map((col) => (
                      <TableHead key={col} className="text-xs">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} className="text-xs max-w-[150px] truncate">
                          {val}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {importData.length > 10 && (
                    <TableRow>
                      <TableCell
                        colSpan={Object.keys(importData[0] || {}).length + 1}
                        className="text-center text-xs text-muted-foreground"
                      >
                        ... and {importData.length - 10} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Expected columns: name, phone, email, side, group, events, vip,
            outstation, dietary, plus_one
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImport(false); setImportData(null); }}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing..." : `Import ${importData?.length || 0} Guests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
