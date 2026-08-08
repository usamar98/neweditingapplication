"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Clapperboard, ImageIcon, LayoutDashboard, LogOut, Menu, Plus, Video } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function Navigation({ pathname }: { pathname: string }) {
  const links = [
    { href: "/dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { href: "/generate/video" as const, icon: Clapperboard, label: "AI video generator" },
    { href: "/generate/image" as const, icon: ImageIcon, label: "AI image generator" },
  ];

  return (
    <nav className="space-y-1">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href as Route}
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <item.icon className="size-4" /> {item.label}
        </Link>
      ))}
      <div className="px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">Video editor</div>
      <Link
        href="/dashboard#new-project"
        className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Plus className="size-4" /> New project
      </Link>
    </nav>
  );
}

function UserFooter({ email }: { email: string }) {
  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center gap-3 px-1">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs text-primary">{email.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{email}</p>
          <p className="text-[11px] text-muted-foreground">Starter workspace</p>
        </div>
        <form action={signOut}>
          <Button type="submit" size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const pathname = usePathname();
  const workspace = pathname === "/generate/video"
    ? { detail: "Model-routed cinematic creation", icon: Clapperboard, title: "AI video studio" }
    : pathname === "/generate/image"
      ? { detail: "Campaign-grade visual creation", icon: ImageIcon, title: "AI image studio" }
      : { detail: "AI editing pipeline", icon: Video, title: "Video workspace" };
  const WorkspaceIcon = workspace.icon;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <Brand className="mb-8 px-2" />
        <Navigation pathname={pathname} />
        <div className="mt-auto"><UserFooter email={email} /></div>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.06] bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[280px] flex-col bg-sidebar p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand className="mb-8 px-2" />
                <Navigation pathname={pathname} />
                <div className="mt-auto"><UserFooter email={email} /></div>
              </SheetContent>
            </Sheet>
            <div className="hidden size-8 place-items-center rounded-lg bg-primary/10 text-primary sm:grid"><WorkspaceIcon className="size-4" /></div>
            <div>
              <p className="text-sm font-medium">{workspace.title}</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">{workspace.detail}</p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/dashboard#new-project"><Plus className="size-4" /> New video</Link>
          </Button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
