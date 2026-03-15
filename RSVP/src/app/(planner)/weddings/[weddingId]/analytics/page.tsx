"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Download, Bell, Users, TrendingUp, UtensilsCrossed } from "lucide-react";
import { DIETARY_LABELS } from "@/lib/constants";

interface EventBreakdown {
  eventId: string;
  eventName: string;
  eventDate: string;
  totalInvited: number;
  attending: number;
  declined: number;
  pending: number;
  plusOnes: number;
  children: number;
  totalPax: number;
  checkedIn: number;
  dietaryBreakdown: Record<string, number>;
  outstationCount: number;
  localCount: number;
  vipCount: number;
}

interface PendingGuest {
  guestId: string;
  guestName: string;
  guestPhone: string;
  eventName: string;
  side: string;
  group: string | null;
  isVip: boolean;
  reminderCount: number;
}

interface AnalyticsData {
  overview: {
    totalGuests: number;
    totalInvitations: number;
    totalAttending: number;
    totalDeclined: number;
    totalPending: number;
    responseRate: number;
  };
  eventBreakdowns: EventBreakdown[];
  rsvpTimeline: Array<{ date: string; count: number }>;
  pendingGuests: PendingGuest[];
  allergyGuests: Array<{ name: string; notes: string; isVip: boolean; eventName: string }>;
}

const DIET_COLORS: Record<string, string> = {
  VEG: "#22c55e",
  NON_VEG: "#ef4444",
  JAIN: "#f59e0b",
  VEGAN: "#06b6d4",
  CUSTOM: "#8b5cf6",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const params = useParams<{ weddingId: string }>();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/analytics`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.error);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [params.weddingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  const { overview, eventBreakdowns, rsvpTimeline, pendingGuests, allergyGuests } = data;

  // Prepare per-event dietary stacked bar data
  const dietaryChartData = eventBreakdowns.map((eb) => ({
    name: eb.eventName,
    ...Object.fromEntries(
      Object.entries(eb.dietaryBreakdown).map(([k, v]) => [DIETARY_LABELS[k] || k, v])
    ),
  }));

  // Get all unique dietary keys for bar chart
  const allDietKeys = new Set<string>();
  eventBreakdowns.forEach((eb) => {
    Object.keys(eb.dietaryBreakdown).forEach((k) => allDietKeys.add(k));
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href={`/weddings/${params.weddingId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-lg font-bold">Analytics & Reports</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Guests</CardDescription>
              <CardTitle className="text-3xl">{overview.totalGuests}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Response Rate</CardDescription>
              <CardTitle className="text-3xl">{overview.responseRate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Attending</CardDescription>
              <CardTitle className="text-3xl text-green-600">{overview.totalAttending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending RSVPs</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{overview.totalPending}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Event Attendance Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Attendance Forecast by Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventBreakdowns.map((eb) => ({
                name: eb.eventName,
                Attending: eb.attending,
                "Plus-Ones": eb.plusOnes,
                Children: eb.children,
                Declined: eb.declined,
                Pending: eb.pending,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Attending" stackId="a" fill="#22c55e" />
                <Bar dataKey="Plus-Ones" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Children" stackId="a" fill="#06b6d4" />
                <Bar dataKey="Declined" fill="#ef444450" />
                <Bar dataKey="Pending" fill="#f59e0b50" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Outstation vs Local Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Outstation vs Local (Attending)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventBreakdowns.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Outstation",
                          value: eventBreakdowns.reduce((s, e) => s + e.outstationCount, 0),
                        },
                        {
                          name: "Local",
                          value: eventBreakdowns.reduce((s, e) => s + e.localCount, 0),
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Dietary Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" /> Dietary Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dietaryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Array.from(allDietKeys).map((key) => (
                    <Bar
                      key={key}
                      dataKey={DIETARY_LABELS[key] || key}
                      stackId="diet"
                      fill={DIET_COLORS[key] || "#94a3b8"}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RSVP Response Timeline */}
        {rsvpTimeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>RSVP Responses Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={rsvpTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Per-Event Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Event Summary</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-center">Invited</TableHead>
                  <TableHead className="text-center">Attending</TableHead>
                  <TableHead className="text-center">+1s</TableHead>
                  <TableHead className="text-center">Children</TableHead>
                  <TableHead className="text-center">Total PAX</TableHead>
                  <TableHead className="text-center">VIP</TableHead>
                  <TableHead className="text-center">Checked In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventBreakdowns.map((eb) => (
                  <TableRow key={eb.eventId}>
                    <TableCell className="font-medium">{eb.eventName}</TableCell>
                    <TableCell className="text-center">{eb.totalInvited}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">{eb.attending}</TableCell>
                    <TableCell className="text-center">{eb.plusOnes}</TableCell>
                    <TableCell className="text-center">{eb.children}</TableCell>
                    <TableCell className="text-center font-bold">{eb.totalPax}</TableCell>
                    <TableCell className="text-center">{eb.vipCount}</TableCell>
                    <TableCell className="text-center">{eb.checkedIn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Allergy Guests (Caterer Brief) */}
        {allergyGuests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Guests with Dietary Notes / Allergies</CardTitle>
              <CardDescription>For caterer briefing — guests with special requirements</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>VIP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allergyGuests.map((ag, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{ag.name}</TableCell>
                      <TableCell>{ag.eventName}</TableCell>
                      <TableCell className="max-w-xs">{ag.notes}</TableCell>
                      <TableCell>
                        {ag.isVip && <Badge className="bg-amber-500">VIP</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pending RSVP List */}
        {pendingGuests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" /> Pending RSVPs ({pendingGuests.length})
                  </CardTitle>
                  <CardDescription>Guests who haven&apos;t responded yet</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Reminders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingGuests.slice(0, 50).map((pg, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{pg.guestName}</span>
                          {pg.isVip && <Badge className="bg-amber-500 text-[10px] px-1 py-0">VIP</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{pg.guestPhone}</TableCell>
                      <TableCell>{pg.eventName}</TableCell>
                      <TableCell className="text-xs">{pg.side}</TableCell>
                      <TableCell className="text-xs">{pg.group || "—"}</TableCell>
                      <TableCell className="text-xs">{pg.reminderCount}x sent</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
