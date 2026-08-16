"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { CircleUserRound, Clapperboard, ImageIcon, LogOut, Megaphone, Plus, Scissors, Sparkles } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Navigation({ pathname }: { pathname: string }) {
  const links = [
    { href: "/clipper" as const, icon: Sparkles, label: "AI Clipper" },
    { href: "/generate/video" as const, icon: Clapperboard, label: "AI video generator" },
    { href: "/generate/image" as const, icon: ImageIcon, label: "AI image generator" },
    { href: "/remove-background" as const, icon: Scissors, label: "Background remover" },
    { href: "/creative-studio" as const, icon: Megaphone, label: "AI ad generator" },
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
      <div className="px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">Clip projects</div>
      <Link
        href="/clipper#new-project"
        className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Plus className="size-4" /> New clip project
      </Link>
      <div className="px-3 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">Account</div>
      <Link href={"/account" as Route} className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><CircleUserRound className="size-4" /> Settings & billing</Link>
    </nav>
  );
}

function UserFooter({ account }: { account: { avatarUrl: string | null; email: string; name: string; plan: string } }) {
  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center gap-3 px-1">
        <Avatar className="size-8">
          <AvatarImage src={account.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">{account.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{account.name}</p>
          <p className="text-[11px] capitalize text-muted-foreground">{account.plan} workspace</p>
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

export function AppShell({ children, account }: { children: React.ReactNode; account: { avatarUrl: string | null; email: string; name: string; plan: string } }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[240px] flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <Navigation pathname={pathname} />
        <div className="mt-auto"><UserFooter account={account} /></div>
      </aside>

      <div className="lg:col-start-2">{children}</div>
    </div>
  );
}
