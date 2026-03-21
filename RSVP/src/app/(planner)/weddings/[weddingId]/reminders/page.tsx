"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Send, Bell } from "lucide-react";

interface ReminderSchedule {
  id: string;
  dayOffset: number;
  channel: string;
  template: string;
  isActive: boolean;
}

export default function RemindersPage() {
  const params = useParams<{ weddingId: string }>();
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blasting, setBlasting] = useState(false);

  const [form, setForm] = useState({
    dayOffset: 1,
    channel: "WHATSAPP" as string,
    template: "Hi {guest_name}, you're invited to {event_name} on {event_date}! Please RSVP here: {rsvp_link}",
    isActive: true,
  });

  const [blastChannel, setBlastChannel] = useState("WHATSAPP");
  const [blastMessage, setBlastMessage] = useState(
    "Hi {guest_name}, we'd love to have you at our celebration! Please RSVP: {rsvp_link}"
  );

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/reminders`);
      const json = await res.json();
      if (json.success) setSchedules(json.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [params.weddingId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  async function handleAddSchedule() {
    setSaving(true);
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Reminder schedule saved");
        fetchSchedules();
        setForm((f) => ({ ...f, dayOffset: f.dayOffset + 2 }));
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleBlast() {
    if (!confirm("Send a reminder to ALL guests who haven't responded?")) return;
    setBlasting(true);
    try {
      const res = await fetch(`/api/weddings/${params.weddingId}/reminders/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: blastChannel, message: blastMessage }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Sent ${json.data.sent} reminders. ${json.data.failed} failed.`);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to send reminders");
    } finally {
      setBlasting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-[#d4a017]/10">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-6">
          <Link href={`/weddings/${params.weddingId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-lg font-bold font-display">Reminder Engine</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8 bg-mesh">
        {/* Blast to all pending */}
        <Card className="border-[#d4a017]/20 bg-[#d4a017]/5 dark:border-[#d4a017]/30 dark:bg-[#d4a017]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" /> Blast to All Pending
            </CardTitle>
            <CardDescription>
              Send a reminder to every guest who hasn&apos;t responded yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={blastChannel} onValueChange={(v) => setBlastChannel(v ?? "WHATSAPP")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Message Template</Label>
                <Textarea
                  value={blastMessage}
                  onChange={(e) => setBlastMessage(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Variables: {"{guest_name}"}, {"{event_name}"}, {"{event_date}"}, {"{rsvp_link}"}
            </p>
            <Button onClick={handleBlast} disabled={blasting} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
              {blasting ? "Sending..." : "Send to All Pending Guests"}
            </Button>
          </CardContent>
        </Card>

        {/* Add schedule */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Automated Reminder Schedules
            </CardTitle>
            <CardDescription>
              Configure when automatic reminders are sent after invitations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Day After Invite</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.dayOffset}
                  onChange={(e) => setForm((f) => ({ ...f, dayOffset: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v ?? "WHATSAPP" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-y-2 sm:col-span-2">
                <Button onClick={handleAddSchedule} disabled={saving} className="w-full bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Add Schedule"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea
                value={form.template}
                onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Existing schedules */}
            {schedules.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-muted-foreground">Current Schedules</Label>
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Day {s.dayOffset}</Badge>
                      <Badge variant="outline">{s.channel}</Badge>
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {s.template.slice(0, 60)}...
                      </span>
                    </div>
                    <Badge variant={s.isActive ? "default" : "secondary"}>
                      {s.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
