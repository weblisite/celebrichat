export default function AdminPage() {
  return (
    <main className="container mx-auto flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
      <p className="text-foreground/70">Only admins should see this.</p>
    </main>
  );
}
