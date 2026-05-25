import { Link } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              R
            </div>
            <span className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
              Regional Carpool
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Board
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:py-10">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>Connecting regional Australia, one ride at a time.</p>
        </div>
      </footer>
    </div>
  );
}
