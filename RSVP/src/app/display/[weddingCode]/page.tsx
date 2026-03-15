"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface EventData {
  name: string;
  date: string;
  attending: number;
  declined: number;
  pending: number;
  totalInvited: number;
}

interface DisplayData {
  brideName: string;
  groomName: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  events: EventData[];
  lastUpdated: string;
}

export default function LiveDisplayPage() {
  const params = useParams<{ weddingCode: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevAttending, setPrevAttending] = useState<Map<string, number>>(new Map());
  const [celebration, setCelebration] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("No display token provided. Add ?token=xxx to the URL.");
      return;
    }

    try {
      const res = await fetch(`/api/display/${params.weddingCode}?token=${token}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error);
        return;
      }

      const newData: DisplayData = json.data;

      // Check for new RSVPs to trigger celebration animation
      if (data) {
        for (const ev of newData.events) {
          const prev = prevAttending.get(ev.name) || 0;
          if (ev.attending > prev) {
            setCelebration(ev.name);
            setTimeout(() => setCelebration(null), 3000);
          }
        }
      }

      // Store current attending counts for next comparison
      const newPrev = new Map<string, number>();
      newData.events.forEach((ev) => newPrev.set(ev.name, ev.attending));
      setPrevAttending(newPrev);

      setData(newData);
      setError(null);
    } catch {
      setError("Failed to connect. Retrying...");
    }
  }, [token, params.weddingCode, data, prevAttending]);

  // Poll every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  // Only depend on token/weddingCode to avoid re-creating interval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.weddingCode]);

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-xl">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  const totalAttending = data.events.reduce((s, e) => s + e.attending, 0);
  const totalInvited = data.events.reduce((s, e) => s + e.totalInvited, 0);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 py-12"
      style={{
        background: `linear-gradient(135deg, ${data.primaryColorHex}20, #000000 50%, ${data.secondaryColorHex}20)`,
      }}
    >
      {/* Celebration animation */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <div className="rounded-2xl bg-white/10 px-12 py-8 text-center backdrop-blur-lg">
              <motion.p
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-6xl"
              >
                🎉
              </motion.p>
              <p className="mt-4 text-2xl font-bold text-white">
                New RSVP for {celebration}!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <p className="text-sm font-medium uppercase tracking-[0.4em] text-white/50">
          Live RSVP Tracker
        </p>
        <h1 className="mt-3 text-5xl font-bold text-white md:text-6xl">
          {data.brideName}{" "}
          <span style={{ color: data.primaryColorHex }}>&</span>{" "}
          {data.groomName}
        </h1>
        <p className="mt-4 text-xl text-white/60">
          {totalAttending} of {totalInvited} confirmed
        </p>
      </motion.div>

      {/* Event cards */}
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.events.map((ev, i) => {
          const pct = ev.totalInvited > 0 ? Math.round((ev.attending / ev.totalInvited) * 100) : 0;
          return (
            <motion.div
              key={ev.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <h2 className="text-xl font-bold text-white">{ev.name}</h2>
              <p className="mt-1 text-sm text-white/40">
                {new Date(ev.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </p>

              {/* Progress ring simulation */}
              <div className="mt-6 flex items-center gap-6">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="34"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6" fill="none"
                    />
                    <circle
                      cx="40" cy="40" r="34"
                      stroke={data.primaryColorHex}
                      strokeWidth="6" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 213.6} 213.6`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-white">
                    {pct}%
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    {ev.attending} attending
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    {ev.declined} declined
                  </div>
                  <div className="flex items-center gap-2 text-yellow-400">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    {ev.pending} pending
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Last updated */}
      <p className="mt-8 text-xs text-white/30">
        Auto-refreshes every 10s &middot; Last updated{" "}
        {new Date(data.lastUpdated).toLocaleTimeString("en-IN")}
      </p>
    </div>
  );
}
