"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error);
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 10%, rgba(139, 26, 52, 0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 80% at 85% 90%, rgba(212, 160, 23, 0.10) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 50% 50%, rgba(245, 230, 208, 0.5) 0%, transparent 80%),
          linear-gradient(160deg, #fdfcfa 0%, #f5e6d0 40%, #faf8f5 70%, #fdf2f4 100%)
        `
      }}
    >
      {/* Floating mandala decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] opacity-[0.04]"
        style={{ animation: 'mandala-rotate 150s linear infinite' }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#d4a017" strokeWidth="0.5">
            <circle cx="100" cy="100" r="20"/><circle cx="100" cy="100" r="35"/>
            <circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="65"/>
            <circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="95"/>
            <path d="M100 5 Q150 50 195 100 Q150 150 100 195 Q50 150 5 100 Q50 50 100 5Z"/>
            <ellipse cx="100" cy="100" rx="45" ry="90"/>
            <ellipse cx="100" cy="100" rx="90" ry="45"/>
          </g>
        </svg>
      </div>
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] opacity-[0.03]"
        style={{ animation: 'mandala-rotate 200s linear infinite reverse' }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#8b1a34" strokeWidth="0.4">
            <circle cx="100" cy="100" r="25"/><circle cx="100" cy="100" r="45"/>
            <circle cx="100" cy="100" r="65"/><circle cx="100" cy="100" r="85"/>
            <path d="M100 10 Q140 55 190 100 Q140 145 100 190 Q60 145 10 100 Q60 55 100 10Z"/>
            <ellipse cx="100" cy="100" rx="50" ry="85"/>
            <ellipse cx="100" cy="100" rx="85" ry="50"/>
          </g>
        </svg>
      </div>

      {/* Gold shimmer streaks */}
      <div className="pointer-events-none absolute left-0 top-1/4 h-px w-full animate-shimmer-gold" />
      <div className="pointer-events-none absolute left-0 top-3/4 h-px w-full animate-shimmer-gold" style={{ animationDelay: '1.5s' }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b1a34] to-[#b42a4a] shadow-wedding-lg">
            <svg className="h-7 w-7 text-[#f5c518]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#5c1a2a]">
            Get Started
          </h1>
          <div className="mx-auto mt-3 h-px w-20 bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
        </div>

        {/* Register Card */}
        <div className="card-3d">
          <Card className="card-3d-inner overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(212, 160, 23, 0.15)',
              boxShadow: `
                0 2px 4px rgba(139, 26, 52, 0.06),
                0 8px 16px rgba(139, 26, 52, 0.05),
                0 24px 48px rgba(139, 26, 52, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.8)
              `
            }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#8b1a34] via-[#d4a017] to-[#8b1a34]" />

            <CardHeader className="pb-3 pt-5 text-center">
              <CardTitle className="font-display text-xl font-bold text-[#5c1a2a]">
                Create Account
              </CardTitle>
              <CardDescription className="text-[#8b6969]">
                Set up your wedding planning dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-3.5 px-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[#5c1a2a] font-medium text-sm">Full Name</Label>
                  <Input id="name" placeholder="Your name" className="input-neu h-10 rounded-lg" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#5c1a2a] font-medium text-sm">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" className="input-neu h-10 rounded-lg" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[#5c1a2a] font-medium text-sm">Phone (optional)</Label>
                  <Input id="phone" placeholder="+91 98765 43210" className="input-neu h-10 rounded-lg" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[#5c1a2a] font-medium text-sm">Password</Label>
                  <Input id="password" type="password" placeholder="At least 8 characters" className="input-neu h-10 rounded-lg" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-[#5c1a2a] font-medium text-sm">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Re-enter your password" className="input-neu h-10 rounded-lg" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 px-6 pb-5">
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-sm font-semibold text-[#f5e6d0] shadow-wedding transition-all duration-300 hover:-translate-y-0.5 hover:from-[#6d1529] hover:to-[#8b1a34] hover:shadow-wedding-lg"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <div className="mx-auto h-px w-full bg-gradient-to-r from-transparent via-[#d4a017]/20 to-transparent" />
                <p className="text-center text-sm text-[#8b6969]">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-[#8b1a34] underline-offset-4 hover:text-[#d4a017] hover:underline transition-colors">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
