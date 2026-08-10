"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { CircleUserRound, CreditCard, ImageIcon, LayoutDashboard, LogOut, Menu, Scissors, ShieldCheck, Video } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type HeaderAccount = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  isAdmin: boolean;
  username: string;
} | null;

const appLinks = [
  { href: "/dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { href: "/generate/video" as const, icon: Video, label: "AI video" },
  { href: "/generate/image" as const, icon: ImageIcon, label: "AI image" },
  { href: "/remove-background" as const, icon: Scissors, label: "Background remover" },
];

export function SiteHeader({ account }: { account: HeaderAccount }) {
  const pathname = usePathname();
  const initials = (account?.displayName || account?.username || account?.email || "EA").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/88 shadow-sm shadow-black/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {account && (
            <Sheet>
              <SheetTrigger asChild><Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-[290px] bg-sidebar p-4">
                <SheetTitle className="sr-only">Editing App navigation</SheetTitle>
                <Brand className="mb-8 px-2" />
                <nav className="space-y-1">{appLinks.map((item) => <Link key={item.href} href={item.href as Route} className={cn("flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", pathname === item.href && "bg-sidebar-accent text-foreground")}><item.icon className="size-4" />{item.label}</Link>)}</nav>
              </SheetContent>
            </Sheet>
          )}
          <Brand />
        </div>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/70 p-1 text-sm text-muted-foreground shadow-sm md:flex">
          <Link href="/#features" className="rounded-full px-4 py-2 transition hover:bg-muted hover:text-foreground">Features</Link>
          <Link href="/#pricing" className="rounded-full px-4 py-2 transition hover:bg-muted hover:text-foreground">Pricing</Link>
        </nav>

        {account ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link href="/dashboard">Workspace</Link></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Open account menu">
                  <Avatar><AvatarImage src={account.avatarUrl ?? undefined} alt="" /><AvatarFallback className="bg-primary/10 text-xs text-primary">{initials}</AvatarFallback></Avatar>
                  <span className="hidden max-w-28 truncate text-sm sm:block">@{account.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel><span className="block truncate text-foreground">{account.displayName}</span><span className="block truncate font-normal">{account.email}</span></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="py-2"><Link href={"/account" as Route}><CircleUserRound /> Account settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2"><Link href={"/account#billing" as Route}><CreditCard /> Billing & subscription</Link></DropdownMenuItem>
                {account.isAdmin ? <DropdownMenuItem asChild className="py-2"><Link href={"/editingappadmin" as Route}><ShieldCheck /> Admin dashboard</Link></DropdownMenuItem> : null}
                <DropdownMenuSeparator />
                <form action={signOut}><DropdownMenuItem asChild className="py-2"><button type="submit" className="w-full"><LogOut /> Sign out</button></DropdownMenuItem></form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2"><Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button><Button asChild><Link href="/login?mode=signup">Create account</Link></Button></div>
        )}
      </div>
    </header>
  );
}
