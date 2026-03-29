import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/12 blur-3xl" />
      <div className="mx-auto flex min-h-[68vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center md:px-8">
        <div className="fx-card rounded-3xl border border-smoke bg-obsidian/75 p-10 backdrop-blur md:p-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/45 bg-void/70 text-gold">
            <Compass className="h-6 w-6" />
          </div>
          <p className="mt-5 font-ui text-xs tracking-[0.22em] text-gold">ERROR 404</p>
          <h1 className="mt-3 font-title text-6xl leading-none text-ivory md:text-7xl">Lost In The Stacks</h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-stone">
            The page you requested could not be found. It may have moved, or the link may be outdated.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="fx-button inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-6 py-3 font-ui text-xs tracking-[0.16em] text-void transition hover:bg-gold-dim"
            >
              <Home className="h-4 w-4" />
              BACK HOME
            </Link>
            <Link
              href="/books"
              className="fx-button rounded-full border border-smoke bg-void px-6 py-3 font-ui text-xs tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold"
            >
              BROWSE BOOKS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
