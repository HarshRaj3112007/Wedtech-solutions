"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  Lock,
} from "lucide-react";

interface CheckInResult {
  alreadyCheckedIn: boolean;
  checkedInAt: string;
  guest: {
    name: string;
    phone: string;
    dietaryPref: string;
    dietaryNotes: string | null;
    isVip: boolean;
    plusOnes: Array<{ name: string; dietaryPref: string }>;
  };
  seatingTable?: { tableNumber: number; label: string | null; zone: string | null } | null;
  plusOneCount: number;
  childrenCount?: number;
}

interface SearchGuest {
  id: string;
  name: string;
  phone: string;
  isVip: boolean;
  checkedIn: boolean;
}

export default function CheckInPage() {
  const params = useParams<{ weddingCode: string; eventSlug: string }>();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [staffName, setStaffName] = useState("");

  const [eventName, setEventName] = useState("");
  const [totalInvited, setTotalInvited] = useState(0);
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchGuest[]>([]);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [checking, setChecking] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/checkin/${params.weddingCode}/${params.eventSlug}`
      );
      const json = await res.json();
      if (json.success) {
        setEventName(json.data.eventName);
        setTotalInvited(json.data.totalInvited);
        setTotalCheckedIn(json.data.totalCheckedIn);
      }
    } catch {
      /* ignore */
    }
  }, [params.weddingCode, params.eventSlug]);

  useEffect(() => {
    if (unlocked) {
      loadStats();
      // Poll every 10 seconds for live count
      const interval = setInterval(loadStats, 10000);
      return () => clearInterval(interval);
    }
  }, [unlocked, loadStats]);

  // Debounced search
  useEffect(() => {
    if (!unlocked || !search) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/checkin/${params.weddingCode}/${params.eventSlug}?search=${encodeURIComponent(search)}`
        );
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data.guests);
        }
      } catch {
        /* ignore */
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, unlocked, params.weddingCode, params.eventSlug]);

  async function handleCheckIn(guestId: string) {
    setChecking(true);
    setLastResult(null);

    try {
      const res = await fetch(
        `/api/checkin/${params.weddingCode}/${params.eventSlug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin,
            guestId,
            method: "MANUAL",
            checkedInBy: staffName || "Staff",
          }),
        }
      );
      const json = await res.json();

      if (json.success) {
        setLastResult(json.data);
        if (json.data.alreadyCheckedIn) {
          toast.warning(`${json.data.guest.name} was already checked in`);
        } else {
          toast.success(`${json.data.guest.name} checked in!`);
          setTotalCheckedIn((prev) => prev + 1);
          // Update search results to reflect checked-in state
          setSearchResults((prev) =>
            prev.map((g) => (g.id === guestId ? { ...g, checkedIn: true } : g))
          );
        }
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Check-in failed");
    } finally {
      setChecking(false);
    }
  }

  // PIN unlock screen
  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <CardTitle className="mt-2">Event Check-In</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the staff PIN to unlock
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="input-neu text-center text-2xl tracking-widest"
            />
            <Input
              placeholder="Your name (optional)"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            />
            <Button className="w-full" onClick={() => setUnlocked(true)} disabled={!pin}>
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Live count banner */}
      <div className="sticky top-0 z-50 bg-primary px-4 py-3 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="font-display text-sm font-medium">{eventName || "Event Check-In"}</p>
          </div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5" />
            {totalCheckedIn} / {totalInvited}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="input-neu pl-10 text-lg"
            placeholder="Search guest name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Last check-in result */}
        {lastResult && (
          <Card
            className={
              lastResult.alreadyCheckedIn
                ? "border-amber-300 bg-amber-50 dark:bg-amber-950"
                : "border-green-300 bg-green-50 shadow-gold-glow dark:bg-green-950"
            }
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                {lastResult.alreadyCheckedIn ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {lastResult.guest.name}
                    {lastResult.guest.isVip && " (VIP)"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lastResult.alreadyCheckedIn
                      ? `Already checked in at ${new Date(lastResult.checkedInAt).toLocaleTimeString("en-IN")}`
                      : `Checked in at ${new Date(lastResult.checkedInAt).toLocaleTimeString("en-IN")}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{lastResult.guest.dietaryPref}</Badge>
                    {lastResult.plusOneCount > 0 && (
                      <Badge variant="outline">+{lastResult.plusOneCount} guest</Badge>
                    )}
                    {lastResult.seatingTable && (
                      <Badge variant="secondary">
                        Table {lastResult.seatingTable.tableNumber}
                        {lastResult.seatingTable.label && ` — ${lastResult.seatingTable.label}`}
                      </Badge>
                    )}
                  </div>
                  {lastResult.guest.dietaryNotes && (
                    <p className="mt-1 text-xs text-amber-700">
                      Note: {lastResult.guest.dietaryNotes}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((guest) => (
              <Card key={guest.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{guest.name}</span>
                      {guest.isVip && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {guest.phone}
                    </p>
                  </div>
                  {guest.checkedIn ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Checked In
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(guest.id)}
                      disabled={checking}
                    >
                      Check In
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {search && searchResults.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No guests found matching &quot;{search}&quot;
          </p>
        )}

        {!search && (
          <div className="py-12 text-center text-muted-foreground">
            <QrCode className="mx-auto h-12 w-12 opacity-30" />
            <p className="mt-4 text-sm">
              Search for a guest by name or phone to check them in.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
