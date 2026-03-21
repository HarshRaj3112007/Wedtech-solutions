"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeddingCard } from "@/lib/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [weddings, setWeddings] = useState<WeddingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weddings");
        const json = await res.json();
        if (json.success) {
          setWeddings(json.data);
        }
      } catch {
        // handled by empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[#d4a017]/10 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-bold tracking-tight">
              WedTech RSVP
            </h1>
            <Badge variant="secondary" className="text-xs">
              Planner
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="bg-mesh mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Your Weddings
            </h2>
            <p className="text-[#8b6969]">
              Manage invitations, RSVPs, and guest logistics
            </p>
          </div>
          <Link href="/weddings/new">
            <Button className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">Create Wedding</Button>
          </Link>
        </div>

        {/* Wedding cards grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}

          {!loading && weddings.length === 0 && (
            <Card className="bg-mandala col-span-full border-dashed">
              <CardHeader className="items-center text-center">
                <CardTitle className="font-display text-xl">No weddings yet</CardTitle>
                <CardDescription>
                  Create your first wedding to start managing invitations and
                  RSVPs.
                </CardDescription>
                <Link href="/weddings/new" className="mt-4">
                  <Button className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">Create Your First Wedding</Button>
                </Link>
              </CardHeader>
            </Card>
          )}

          {!loading &&
            weddings.map((w) => (
              <Link key={w.id} href={`/weddings/${w.id}`}>
                <div className="card-3d">
                  <Card className="card-3d-inner glass-card cursor-pointer transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-lg">
                            {w.brideName} & {w.groomName}
                          </CardTitle>
                          <CardDescription>
                            {w.city ?? "Location TBD"}
                          </CardDescription>
                        </div>
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: w.primaryColorHex }}
                          title="Wedding colour"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Guests</p>
                          <p className="text-lg font-semibold">{w.guestCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">RSVP Rate</p>
                          <p className="text-lg font-semibold">
                            {w.responseRate}%
                          </p>
                        </div>
                      </div>
                      {w.upcomingEventDate && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Next event:{" "}
                          {new Date(w.upcomingEventDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
}
