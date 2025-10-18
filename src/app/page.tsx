import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden>
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-brand/40 to-brand/10 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
        />
      </div>

      <section className="container mx-auto flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-8 text-center">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-foreground/60">Starter Kit</p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Next.js 14 App Router + Tailwind + TS
          </h1>
          <p className="container-prose mx-auto max-w-2xl text-foreground/70">
            A minimal, batteries-included baseline featuring TypeScript, TailwindCSS, ESLint, Prettier, and
            testing setup (Jest/Testing Library + Playwright). Use this as a starting point for your next app.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link href="https://nextjs.org" target="_blank" rel="noreferrer">
            <Button>Next.js Docs</Button>
          </Link>
          <Link href="https://tailwindcss.com/docs" target="_blank" rel="noreferrer">
            <Button variant="outline">Tailwind Docs</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
