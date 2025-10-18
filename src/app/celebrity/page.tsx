import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CelebrityPage() {
  return (
    <main className="container mx-auto flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-semibold">Celebrity Area</h1>
      <p className="text-foreground/70">Celebrities and admins can access this area.</p>
      <Link href="/celebrity/dashboard"><Button>Go to Dashboard</Button></Link>
    </main>
  );
}
