import { Link, useLocation } from "wouter";
import { HeartPulse, ShieldCheck, UserCircle2 } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isMedical = location.startsWith("/medical");
  const isAdmin = location.startsWith("/admin");

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
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${!isMedical && !isAdmin ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              data-testid="nav-board"
            >
              Board
            </Link>
            <Link
              href="/medical"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${isMedical && location !== "/medical/portal" ? "text-teal-700 bg-teal-50" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              data-testid="nav-medical"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Medical
            </Link>
            <Link
              href="/medical/portal"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${location === "/medical/portal" ? "text-teal-700 bg-teal-50" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              data-testid="nav-portal"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              My Dashboard
            </Link>
            <Link
              href="/admin"
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${isAdmin ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              data-testid="nav-admin"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
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
