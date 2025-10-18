export default function ForbiddenPage() {
  return (
    <main className="container mx-auto flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-semibold">403 - Forbidden</h1>
      <p className="text-foreground/70">You do not have permission to access this page.</p>
    </main>
  );
}
