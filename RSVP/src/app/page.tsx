import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 15% 5%, rgba(139, 26, 52, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 90% 95%, rgba(212, 160, 23, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 40%, rgba(245, 230, 208, 0.5) 0%, transparent 70%),
            linear-gradient(170deg, #fdfcfa 0%, #f5e6d0 35%, #faf8f5 65%, #fdf2f4 100%)
          `
        }}
      >
        {/* Floating mandala top-left */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-[450px] w-[450px] opacity-[0.04]"
          style={{ animation: 'mandala-rotate 120s linear infinite' }}>
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

        {/* Floating mandala bottom-right */}
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[550px] w-[550px] opacity-[0.03]"
          style={{ animation: 'mandala-rotate 180s linear infinite reverse' }}>
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

        {/* Gold glow blob */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#d4a017]/15 via-[#d4a017]/05 to-transparent blur-3xl" />

        {/* Shimmer streaks */}
        <div className="pointer-events-none absolute left-0 top-[30%] h-px w-full animate-shimmer-gold" />
        <div className="pointer-events-none absolute left-0 top-[70%] h-px w-full animate-shimmer-gold" style={{ animationDelay: '1.5s' }} />

        {/* Floating particles */}
        <div className="pointer-events-none absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-[#d4a017]/20 animate-float" />
        <div className="pointer-events-none absolute right-[15%] top-[25%] h-1.5 w-1.5 rounded-full bg-[#8b1a34]/15 animate-float" style={{ animationDelay: '2s' }} />
        <div className="pointer-events-none absolute left-[75%] bottom-[20%] h-2.5 w-2.5 rounded-full bg-[#d4a017]/15 animate-float" style={{ animationDelay: '4s' }} />
        <div className="pointer-events-none absolute left-[25%] bottom-[12%] h-1 w-1 rounded-full bg-[#8b1a34]/20 animate-float" style={{ animationDelay: '1s' }} />
        <div className="pointer-events-none absolute right-[35%] top-[12%] h-1.5 w-1.5 rounded-full bg-[#d4a017]/10 animate-float" style={{ animationDelay: '3s' }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Brand logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b1a34] to-[#b42a4a] shadow-wedding-lg animate-float">
            <svg className="h-8 w-8 text-[#f5c518]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <p className="mb-4 font-display text-sm font-medium uppercase tracking-[0.3em] text-[#8b1a34]/60">
            Events by Athea
          </p>

          <h1 className="font-display max-w-3xl text-4xl font-bold tracking-tight text-[#5c1a2a] sm:text-5xl md:text-6xl">
            Wedding RSVP{" "}
            <span className="bg-gradient-to-r from-[#8b1a34] via-[#d4a017] to-[#8b1a34] bg-clip-text text-transparent bg-[length:200%_100%]"
              style={{ animation: 'shimmer-gold 4s ease-in-out infinite' }}>
              Platform
            </span>
          </h1>

          <div className="mx-auto mt-4 h-px w-32 bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />

          <p className="mt-6 max-w-xl text-lg text-[#8b6969] mx-auto">
            Premium digital invitations, real-time RSVP tracking, guest management,
            and event-day check-in — built for Indian destination weddings at scale.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="px-8 h-12 bg-gradient-to-r from-[#8b1a34] to-[#b42a4a] text-[#f5e6d0] shadow-wedding-lg hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(139,26,52,0.25)] text-base font-semibold">
                Planner Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="px-8 h-12 border-[#d4a017]/30 text-[#5c1a2a] hover:bg-[#d4a017]/10 hover:border-[#d4a017]/50 transition-all duration-300 text-base font-semibold">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="mt-20 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mx-auto">
            {[
              { title: "Digital Invites", desc: "Themed, animated, multilingual", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { title: "RSVP Engine", desc: "Per-event with dietary & plus-ones", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
              { title: "Check-In App", desc: "QR scan + manual, works offline", icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" },
              { title: "Live Analytics", desc: "Headcounts, dietary, exports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            ].map((f) => (
              <div key={f.title} className="card-3d">
                <div className="card-3d-inner rounded-xl p-5 text-left group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(212, 160, 23, 0.12)',
                    boxShadow: '0 2px 8px rgba(139, 26, 52, 0.04), 0 8px 24px rgba(139, 26, 52, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#faf8f5] to-[#f5e6d0] transition-all duration-300 group-hover:from-[#8b1a34] group-hover:to-[#b42a4a] group-hover:shadow-gold-glow">
                    <svg className="h-5 w-5 text-[#8b1a34] transition-colors duration-300 group-hover:text-[#f5c518]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="font-display font-semibold text-[#5c1a2a]">{f.title}</h3>
                  <p className="mt-1 text-sm text-[#8b6969]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-6 text-center">
        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#d4a017]/30" />
          <span className="text-[#d4a017]/40 text-xs">&#9830;</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#d4a017]/30" />
        </div>
        <p className="text-sm text-[#8b6969]">
          &copy; {new Date().getFullYear()} Events by Athea &middot; WedTech
          Innovation Challenge
        </p>
      </footer>
    </main>
  );
}
