"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
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

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
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
            <path d="M100 20 Q130 70 180 100 Q130 130 100 180 Q70 130 20 100 Q70 70 100 20Z"/>
            <ellipse cx="100" cy="100" rx="45" ry="90"/>
            <ellipse cx="100" cy="100" rx="90" ry="45"/>
            <path d="M33 33 L167 167 M167 33 L33 167"/>
            <path d="M100 5 L100 195 M5 100 L195 100"/>
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

      {/* Gold shimmer streak */}
      <div className="pointer-events-none absolute left-0 top-1/3 h-px w-full animate-shimmer-gold" />
      <div className="pointer-events-none absolute left-0 top-2/3 h-px w-full animate-shimmer-gold" style={{ animationDelay: '1.5s' }} />

      {/* Floating gold particles */}
      <div className="pointer-events-none absolute left-[15%] top-[20%] h-2 w-2 rounded-full bg-[#d4a017]/20 animate-float" />
      <div className="pointer-events-none absolute right-[20%] top-[30%] h-1.5 w-1.5 rounded-full bg-[#8b1a34]/15 animate-float" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute left-[70%] bottom-[25%] h-2.5 w-2.5 rounded-full bg-[#d4a017]/15 animate-float" style={{ animationDelay: '4s' }} />
      <div className="pointer-events-none absolute left-[30%] bottom-[15%] h-1 w-1 rounded-full bg-[#8b1a34]/20 animate-float" style={{ animationDelay: '1s' }} />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b1a34] to-[#b42a4a] shadow-wedding-lg">
            <svg className="h-8 w-8 text-[#f5c518]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#5c1a2a]">
            WedTech RSVP
          </h1>
          <p className="mt-1 text-sm text-[#8b6969]">Wedding Planning Platform</p>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
        </div>

        {/* Login Card */}
        <div className="card-3d">
          <Card className="card-3d-inner shadow-wedding-lg overflow-hidden"
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
            {/* Gold accent line at top of card */}
            <div className="h-1 w-full bg-gradient-to-r from-[#8b1a34] via-[#d4a017] to-[#8b1a34]" />

            <CardHeader className="pb-4 pt-6 text-center">
              <CardTitle className="font-display text-2xl font-bold text-[#5c1a2a]">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-[#8b6969]">
                Sign in to your planner dashboard
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4 px-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#5c1a2a] font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="input-neu h-11 rounded-lg"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#5c1a2a] font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="input-neu h-11 rounded-lg"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 px-6 pb-6">
                <Button
                  type="submit"
                  className="h-11 w-full rounded-lg bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-sm font-semibold text-[#f5e6d0] shadow-wedding transition-all duration-300 hover:-translate-y-0.5 hover:from-[#6d1529] hover:to-[#8b1a34] hover:shadow-wedding-lg"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="mx-auto h-px w-full bg-gradient-to-r from-transparent via-[#d4a017]/20 to-transparent" />

                <p className="text-center text-sm text-[#8b6969]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-[#8b1a34] underline-offset-4 hover:text-[#d4a017] hover:underline transition-colors"
                  >
                    Register
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Footer ornament */}
        <div className="mt-8 text-center">
          <div className="mx-auto flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4a017]/30" />
            <span className="text-xs text-[#d4a017]/40">&#9830;</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4a017]/30" />
          </div>
        </div>
      </div>
    </main>
  );
}
