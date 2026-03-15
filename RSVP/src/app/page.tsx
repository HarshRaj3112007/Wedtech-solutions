import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        {/* Decorative gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-200/30 to-transparent blur-3xl dark:from-amber-900/20" />

        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Events by Athea
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Wedding RSVP{" "}
          <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
            Platform
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Premium digital invitations, real-time RSVP tracking, guest management,
          and event-day check-in — built for Indian destination weddings at scale.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="px-8">
              Planner Login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="px-8">
              Create Account
            </Button>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-20 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Digital Invites", desc: "Themed, animated, multilingual" },
            { title: "RSVP Engine", desc: "Per-event with dietary & plus-ones" },
            { title: "Check-In App", desc: "QR scan + manual, works offline" },
            { title: "Live Analytics", desc: "Headcounts, dietary, exports" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Events by Athea &middot; WedTech
        Innovation Challenge
      </footer>
    </main>
  );
}
