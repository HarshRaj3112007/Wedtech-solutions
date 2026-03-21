"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { weddingSchema, type WeddingInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewWeddingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WeddingInput>({
    resolver: zodResolver(weddingSchema),
    defaultValues: {
      primaryColorHex: "#B8860B",
      secondaryColorHex: "#800020",
      timezone: "Asia/Kolkata",
    },
  });

  const primaryColor = watch("primaryColorHex");
  const secondaryColor = watch("secondaryColorHex");

  async function onSubmit(data: WeddingInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error);
        setLoading(false);
        return;
      }

      toast.success("Wedding created successfully!");
      router.push(`/weddings/${json.data.id}`);
    } catch {
      toast.error("Failed to create wedding");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-[#d4a017]/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold font-display">Create New Wedding</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 bg-mesh">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Couple Names */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Couple Details</CardTitle>
              <CardDescription>
                The names that will appear on all invitations and guest-facing pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brideName">Bride&apos;s Name</Label>
                <Input id="brideName" className="input-neu" placeholder="Ananya" {...register("brideName")} />
                {errors.brideName && (
                  <p className="text-sm text-destructive">{errors.brideName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="groomName">Groom&apos;s Name</Label>
                <Input id="groomName" className="input-neu" placeholder="Rohan" {...register("groomName")} />
                {errors.groomName && (
                  <p className="text-sm text-destructive">{errors.groomName.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wedding Code & Location */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Wedding Details</CardTitle>
              <CardDescription>
                The wedding code becomes the URL slug for all invite links.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="weddingCode">Wedding Code (URL slug)</Label>
                <Input
                  id="weddingCode"
                  className="input-neu"
                  placeholder="ananya-rohan-2026"
                  {...register("weddingCode")}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only. This appears in invite URLs.
                </p>
                {errors.weddingCode && (
                  <p className="text-sm text-destructive">{errors.weddingCode.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" className="input-neu" placeholder="Udaipur" {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue</Label>
                  <Input id="venueName" className="input-neu" placeholder="The Leela Palace" {...register("venueName")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theming */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Colour Theme</CardTitle>
              <CardDescription>
                These colours will be used on all guest-facing invite and portal pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColorHex">Primary Colour</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-10 cursor-pointer rounded border"
                      value={primaryColor}
                      onChange={(e) => {
                        const event = { target: { name: "primaryColorHex", value: e.target.value } };
                        register("primaryColorHex").onChange(event);
                      }}
                    />
                    <Input id="primaryColorHex" {...register("primaryColorHex")} className="font-mono input-neu" />
                  </div>
                  {errors.primaryColorHex && (
                    <p className="text-sm text-destructive">{errors.primaryColorHex.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColorHex">Secondary Colour</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-10 cursor-pointer rounded border"
                      value={secondaryColor}
                      onChange={(e) => {
                        const event = { target: { name: "secondaryColorHex", value: e.target.value } };
                        register("secondaryColorHex").onChange(event);
                      }}
                    />
                    <Input id="secondaryColorHex" {...register("secondaryColorHex")} className="font-mono input-neu" />
                  </div>
                  {errors.secondaryColorHex && (
                    <p className="text-sm text-destructive">{errors.secondaryColorHex.message}</p>
                  )}
                </div>
              </div>
              {/* Preview swatch */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <div
                  className="h-8 w-16 rounded"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" className="input-neu" {...register("timezone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvpDeadline">RSVP Deadline (optional)</Label>
                <Input
                  id="rsvpDeadline"
                  className="input-neu"
                  type="datetime-local"
                  {...register("rsvpDeadline")}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-3">
              <Link href="/dashboard">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding hover:shadow-wedding-lg transition-all">
                {loading ? "Creating..." : "Create Wedding"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
