export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Editorial split: oversized wordmark bleeding off-screen behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-1/2 hidden -translate-y-1/2 select-none font-serif text-[18rem] font-semibold leading-none text-primary/[0.06] lg:block"
      >
        Codex
      </div>
      <div className="w-full max-w-md animate-fade-in-up">{children}</div>
    </div>
  );
}
