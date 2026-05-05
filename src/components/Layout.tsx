import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Plus, Users, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/novo-plano", label: "Novo plano", icon: Plus },
  { to: "/familia", label: "Família", icon: Users },
] as const;

export function Layout() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();

  async function handleSignOut() {
    await signOut();
    nav({ to: "/" });
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Link to="/dashboard"><Logo size="sm" /></Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              activeProps={{
                className: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-primary text-primary-foreground",
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 px-3 text-xs">
            <div className="font-medium text-foreground">{profile?.nome ?? "—"}</div>
            <div className="text-muted-foreground">{profile?.email}</div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="w-full justify-start">
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
          <Link to="/dashboard"><Logo size="sm" /></Link>
          <Button onClick={handleSignOut} variant="ghost" size="icon" aria-label="Sair">
            <LogOut size={18} />
          </Button>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-card lg:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs text-muted-foreground"
              activeProps={{
                className: "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs text-primary",
              }}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>

        <main className="container mx-auto max-w-5xl px-6 py-6 pb-24 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
