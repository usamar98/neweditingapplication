import type { Route } from "next";
import Link from "next/link";
import {
  CircleUserRound,
  CreditCard,
  ImageIcon,
  LogOut,
  Menu,
  Scissors,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

type HeaderAccount = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  isAdmin: boolean;
  username: string;
} | null;

const appLinks = [
  { href: "/clipper" as const, icon: Sparkles, label: "AI Clipper" },
  { href: "/generate/video" as const, icon: Video, label: "AI video" },
  { href: "/generate/image" as const, icon: ImageIcon, label: "AI image" },
  { href: "/remove-background" as const, icon: Scissors, label: "Background remover" },
];

function AccountAvatar({ account, initials }: { account: NonNullable<HeaderAccount>; initials: string }) {
  if (!account.avatarUrl) {
    return <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-medium text-primary">{initials}</span>;
  }

  return (
    // User avatars come from private, short-lived storage URLs and are intentionally rendered without optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={account.avatarUrl} alt="" width="32" height="32" loading="lazy" decoding="async" className="size-8 rounded-full object-cover" />
  );
}

export function SiteHeader({ account }: { account: HeaderAccount }) {
  const initials = (account?.displayName || account?.username || account?.email || "EA").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/94 shadow-sm shadow-black/[0.03] supports-[backdrop-filter]:bg-background/88 supports-[backdrop-filter]:backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {account ? (
            <details className="group/navigation relative lg:hidden">
              <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden" aria-label="Open workspace navigation">
                <Menu className="size-5" />
              </summary>
              <nav aria-label="Workspace navigation" className="absolute left-0 top-12 w-72 space-y-1 rounded-xl border border-border bg-popover p-3 shadow-2xl">
                {appLinks.map((item) => (
                  <Link key={item.href} href={item.href as Route} className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    <item.icon className="size-4" />{item.label}
                  </Link>
                ))}
              </nav>
            </details>
          ) : null}
          <Brand />
        </div>

        <nav aria-label="Primary navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/70 p-1 text-sm text-muted-foreground shadow-sm md:flex">
          <Link href={"/features" as Route} className="rounded-full px-4 py-2 transition hover:bg-muted hover:text-foreground">Features</Link>
          <Link href={"/tools" as Route} className="rounded-full px-4 py-2 transition hover:bg-muted hover:text-foreground">AI tools</Link>
          <Link href={"/pricing" as Route} className="rounded-full px-4 py-2 transition hover:bg-muted hover:text-foreground">Pricing</Link>
        </nav>

        {account ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link href="/clipper">Workspace</Link></Button>
            <details className="group/account relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted [&::-webkit-details-marker]:hidden" aria-label="Open account menu">
                <AccountAvatar account={account} initials={initials} />
                <span className="hidden max-w-28 truncate sm:block">@{account.username}</span>
              </summary>
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-popover p-2 text-sm shadow-2xl">
                <div className="px-2 py-2"><span className="block truncate font-medium text-foreground">{account.displayName}</span><span className="block truncate text-xs text-muted-foreground">{account.email}</span></div>
                <div className="my-1 h-px bg-border" />
                <Link href={"/account" as Route} className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"><CircleUserRound className="size-4" /> Account settings</Link>
                <Link href={"/account#billing" as Route} className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"><CreditCard className="size-4" /> Billing & subscription</Link>
                {account.isAdmin ? <Link href={"/editingappadmin" as Route} className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"><ShieldCheck className="size-4" /> Admin dashboard</Link> : null}
                <div className="my-1 h-px bg-border" />
                <form action={signOut}><button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="size-4" /> Sign out</button></form>
              </div>
            </details>
          </div>
        ) : (
          <div className="flex items-center gap-2"><Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button><Button asChild><Link href="/login?mode=signup">Create account</Link></Button></div>
        )}
      </div>
    </header>
  );
}
