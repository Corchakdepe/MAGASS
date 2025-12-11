// app/history/page.tsx
export default function HistoryPage() {
  // Main shell is rendered by RootLayout -> AppLayout.
  // The important part is the URL (/history) so SidebarHistory switches mode.
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">Simulation History</h1>
      <p className="text-sm text-muted-foreground">
        Use the right sidebar to select a past simulation and load its results.
      </p>
    </main>
  );
}
