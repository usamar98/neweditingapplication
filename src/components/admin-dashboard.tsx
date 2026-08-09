"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Globe2,
  LogIn,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminDashboardData, AdminUserRow } from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const planLabels: Record<string, string> = {
  business: "Business",
  creator: "Creator",
  starter: "Starter",
  studio: "Studio",
};

type UserFilter = "all" | "inactive" | "new" | "online" | "paid";

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function relativeTime(value: string | null, generatedAt: string) {
  if (!value) return "No activity yet";
  const seconds = Math.max(0, Math.round((Date.parse(generatedAt) - Date.parse(value)) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function countryFlag(code: string | null) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "◌";
  return String.fromCodePoint(...[...code].map((character) => character.charCodeAt(0) + 127397));
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone = "primary",
  value,
}: {
  detail: string;
  icon: typeof UsersRound;
  label: string;
  tone?: "blue" | "primary" | "purple" | "yellow";
  value: string;
}) {
  const tones = {
    blue: "bg-blue-400/10 text-blue-300 ring-blue-400/15",
    primary: "bg-primary/10 text-primary ring-primary/15",
    purple: "bg-violet-400/10 text-violet-300 ring-violet-400/15",
    yellow: "bg-amber-400/10 text-amber-300 ring-amber-400/15",
  };
  return (
    <Card className="border-white/[0.04] bg-card/65 shadow-xl shadow-black/10">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.045em]">{value}</p>
          </div>
          <span className={cn("grid size-10 place-items-center rounded-xl ring-1", tones[tone])}><Icon className="size-5" /></span>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function GrowthChart({ growth }: Pick<AdminDashboardData, "growth">) {
  const width = 760;
  const height = 250;
  const padding = { bottom: 36, left: 44, right: 14, top: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxCumulative = Math.max(1, ...growth.map((point) => point.cumulative));
  const maxSignups = Math.max(1, ...growth.map((point) => point.signups));
  const x = (index: number) => padding.left + (index / Math.max(1, growth.length - 1)) * chartWidth;
  const y = (value: number) => padding.top + chartHeight - (value / maxCumulative) * chartHeight;
  const points = growth.map((point, index) => `${x(index).toFixed(2)},${y(point.cumulative).toFixed(2)}`).join(" ");
  const area = `${padding.left},${padding.top + chartHeight} ${points} ${padding.left + chartWidth},${padding.top + chartHeight}`;
  const labelIndexes = [0, 7, 14, 21, 29].filter((index) => index < growth.length);

  return (
    <div className="mt-3 w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-labelledby="growth-title growth-description">
        <title id="growth-title">Thirty-day user growth</title>
        <desc id="growth-description">Daily signups shown as bars with cumulative users shown as a line.</desc>
        <defs>
          <linearGradient id="admin-growth-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const gridY = padding.top + chartHeight - fraction * chartHeight;
          return (
            <g key={fraction}>
              <line x1={padding.left} x2={width - padding.right} y1={gridY} y2={gridY} stroke="currentColor" className="text-white/[0.07]" />
              <text x={padding.left - 9} y={gridY + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{Math.round(maxCumulative * fraction)}</text>
            </g>
          );
        })}
        {growth.map((point, index) => {
          const barHeight = (point.signups / maxSignups) * (chartHeight * 0.34);
          return <rect key={point.date} x={x(index) - 4} y={padding.top + chartHeight - barHeight} width="8" height={barHeight} rx="2" className="fill-blue-400/25" />;
        })}
        <polygon points={area} fill="url(#admin-growth-area)" />
        <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {growth.map((point, index) => (
          point.signups > 0 ? <circle key={point.date} cx={x(index)} cy={y(point.cumulative)} r="3.5" fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth="2" /> : null
        ))}
        {labelIndexes.map((index) => <text key={growth[index].date} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === growth.length - 1 ? "end" : "middle"} className="fill-muted-foreground text-[10px]">{growth[index].label}</text>)}
      </svg>
      <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded bg-primary" /> Total users</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-blue-400/40" /> Daily signups</span>
      </div>
    </div>
  );
}

function PlanChart({ planMix, total }: { planMix: AdminDashboardData["planMix"]; total: number }) {
  let offset = 0;
  const segments = planMix.map((plan) => {
    const start = offset;
    offset += plan.share;
    return `${plan.color} ${start.toFixed(2)}% ${offset.toFixed(2)}%`;
  });
  const backgroundImage = total > 0 ? `conic-gradient(${segments.join(", ")})` : "conic-gradient(#334155 0 100%)";
  return (
    <div className="mt-6 grid items-center gap-7 sm:grid-cols-[160px_1fr] lg:grid-cols-1 xl:grid-cols-[160px_1fr]">
      <div className="relative mx-auto size-40 rounded-full p-[18px]" style={{ backgroundImage }} role="img" aria-label="Subscription plan distribution">
        <div className="grid size-full place-items-center rounded-full bg-card text-center shadow-inner">
          <div><p className="text-3xl font-semibold tracking-[-0.04em]">{total}</p><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">accounts</p></div>
        </div>
      </div>
      <div className="space-y-3">
        {planMix.map((plan) => (
          <div key={plan.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><span className="size-2.5 rounded-full" style={{ backgroundColor: plan.color }} />{plan.label}</span>
            <span className="font-medium">{plan.count} <span className="ml-1 text-xs font-normal text-muted-foreground">{formatNumber(plan.share, 1)}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountryChart({ countries }: Pick<AdminDashboardData, "countries">) {
  const max = Math.max(1, ...countries.map((country) => country.count));
  return (
    <div className="mt-5 space-y-4">
      {countries.map((country) => (
        <div key={country.code}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex min-w-0 items-center gap-2"><span className="text-base">{countryFlag(country.code === "unknown" ? null : country.code)}</span><span className="truncate text-muted-foreground">{country.name}</span></span>
            <span className="ml-3 font-medium">{country.count} <span className="text-[10px] font-normal text-muted-foreground">({formatNumber(country.share, 1)}%)</span></span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400" style={{ width: `${(country.count / max) * 100}%` }} /></div>
        </div>
      ))}
      {countries.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Country data appears after users return to the app.</p> : null}
    </div>
  );
}

function SubscriptionBadge({ user }: { user: AdminUserRow }) {
  if (user.plan === "starter") return <Badge variant="outline" className="border-white/10 text-muted-foreground">Starter</Badge>;
  const active = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";
  return (
    <div>
      <Badge className={cn("border-0", active ? "bg-primary/10 text-primary" : "bg-amber-400/10 text-amber-300")}>{planLabels[user.plan] ?? user.plan}</Badge>
      <p className="mt-1 text-[10px] capitalize text-muted-foreground">{user.subscriptionStatus?.replaceAll("_", " ") ?? "Unknown status"}</p>
    </div>
  );
}

function UsersTable({ generatedAt, users }: { generatedAt: string; users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = !deferredQuery || [user.displayName, user.email, user.username, user.countryName, user.plan]
      .some((value) => value.toLowerCase().includes(deferredQuery));
    const matchesFilter = filter === "all"
      || (filter === "online" && user.isOnline)
      || (filter === "new" && user.isNew)
      || (filter === "paid" && user.plan !== "starter")
      || (filter === "inactive" && user.accountStatus === "inactive");
    return matchesSearch && matchesFilter;
  }), [deferredQuery, filter, users]);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Card className="border-white/[0.04] bg-card/70 shadow-2xl shadow-black/15">
      <CardHeader className="border-b border-white/[0.06] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><UsersRound className="size-4 text-primary" /> User directory</CardTitle>
            <CardDescription className="mt-1">Account, login, location, and subscription status for every user.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search users, email, country…" className="h-9 pl-9" aria-label="Search users" /></div>
            <Select value={filter} onValueChange={(value) => { setFilter(value as UserFilter); setPage(1); }}>
              <SelectTrigger className="h-9 min-w-36"><SelectValue /></SelectTrigger>
              <SelectContent align="end"><SelectItem value="all">All users</SelectItem><SelectItem value="new">New users</SelectItem><SelectItem value="online">Online now</SelectItem><SelectItem value="paid">Paid plans</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">User</TableHead><TableHead>Activity</TableHead><TableHead>Subscription</TableHead><TableHead>Country</TableHead><TableHead>Joined</TableHead><TableHead className="pr-5 text-right">Account</TableHead></TableRow></TableHeader>
          <TableBody>
            {pageUsers.map((user) => (
              <TableRow key={user.id} className="border-white/[0.05]">
                <TableCell className="min-w-64 pl-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 ring-1 ring-white/10"><AvatarImage src={user.avatarUrl ?? undefined} alt="" /><AvatarFallback className="bg-primary/10 text-xs text-primary">{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="min-w-0"><div className="flex items-center gap-2"><p className="max-w-40 truncate font-medium">{user.displayName}</p>{user.isNew ? <Badge className="h-4 border-0 bg-blue-400/10 px-1.5 text-[9px] text-blue-300">NEW</Badge> : null}</div><p className="max-w-52 truncate text-xs text-muted-foreground">{user.email}</p><p className="mt-0.5 text-[10px] text-muted-foreground/70">@{user.username}</p></div>
                  </div>
                </TableCell>
                <TableCell><div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", user.isOnline ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : "bg-slate-600")} /><div><p className={cn("text-xs font-medium", user.isOnline && "text-primary")}>{user.isOnline ? "Online now" : relativeTime(user.lastSeenAt, generatedAt)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Login: {relativeTime(user.lastSignInAt, generatedAt)}</p></div></div></TableCell>
                <TableCell><SubscriptionBadge user={user} /></TableCell>
                <TableCell><div className="flex items-center gap-2"><span className="text-lg">{countryFlag(user.countryCode)}</span><span className="max-w-28 truncate text-xs text-muted-foreground">{user.countryName}</span></div></TableCell>
                <TableCell><p className="text-xs">{formatDate(user.joinedAt)}</p></TableCell>
                <TableCell className="pr-5 text-right"><Badge variant="outline" className={cn("capitalize", user.accountStatus === "active" ? "border-primary/20 text-primary" : "border-amber-400/20 text-amber-300")}>{user.accountStatus}</Badge></TableCell>
              </TableRow>
            ))}
            {pageUsers.length === 0 ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No users match this view.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {filteredUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users</p>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft className="size-3.5" /> Previous</Button><span className="px-2">{safePage} / {pageCount}</span><Button size="sm" variant="outline" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next <ArrowRight className="size-3.5" /></Button></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({ adminEmail, data }: { adminEmail: string; data: AdminDashboardData }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const { overview } = data;
  const updatedLabel = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(new Date(data.generatedAt));

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-black/10">
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-50" />
      <div className="relative mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2"><Badge className="border-0 bg-primary/10 text-primary"><ShieldCheck className="size-3" /> Admin console</Badge><span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-primary" /> Live operations</span></div>
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Business intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A secure command center for user growth, active sessions, subscriptions, and global reach.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs font-medium">{adminEmail}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Updated {updatedLabel}</p></div>
            <Button variant="outline" size="sm" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}><RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} /> Refresh data</Button>
          </div>
        </header>

        <section aria-label="Business overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Total users" value={formatNumber(overview.totalUsers)} detail="All registered accounts" icon={UsersRound} />
          <MetricCard label="New users" value={formatNumber(overview.newUsers)} detail="Joined in the last 7 days" icon={CalendarPlus} tone="blue" />
          <MetricCard label="Online now" value={formatNumber(overview.onlineUsers)} detail="Active in the last 5 minutes" icon={Activity} />
          <MetricCard label="Subscriptions" value={formatNumber(overview.activeSubscriptions)} detail={`${formatNumber(overview.conversionRate, 1)}% paid conversion`} icon={UserRoundCheck} tone="purple" />
          <MetricCard label="Active MRR" value={formatMoney(overview.monthlyRecurringRevenue)} detail="Based on active monthly plans" icon={BadgeDollarSign} tone="yellow" />
          <MetricCard label="Logins today" value={formatNumber(overview.loginsToday)} detail="Successful sign-ins since 00:00 UTC" icon={LogIn} tone="blue" />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_0.75fr]">
          <Card className="border-white/[0.04] bg-card/70 shadow-2xl shadow-black/15">
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> User growth</CardTitle><CardDescription className="mt-1">Cumulative accounts and daily signups over 30 days.</CardDescription></div>
              <Badge variant="outline" className="border-primary/15 text-primary"><Sparkles className="size-3" /> 30 days</Badge>
            </CardHeader>
            <CardContent><GrowthChart growth={data.growth} /></CardContent>
          </Card>
          <Card className="border-white/[0.04] bg-card/70 shadow-2xl shadow-black/15">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-4 text-violet-300" /> Plan mix</CardTitle><CardDescription>Current account distribution by subscription tier.</CardDescription></CardHeader>
            <CardContent><PlanChart planMix={data.planMix} total={overview.totalUsers} /></CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.75fr_1.65fr]">
          <Card className="border-white/[0.04] bg-card/70 shadow-2xl shadow-black/15">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="size-4 text-blue-300" /> Audience geography</CardTitle><CardDescription>Top countries from recent authenticated activity.</CardDescription></CardHeader>
            <CardContent><CountryChart countries={data.countries} /></CardContent>
          </Card>
          <Card className="border-white/[0.04] bg-gradient-to-br from-primary/[0.07] via-card/70 to-blue-400/[0.04] shadow-2xl shadow-black/15">
            <CardContent className="grid h-full min-h-72 content-center gap-7 p-7 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <Badge className="border-0 bg-primary/10 text-primary"><Clock3 className="size-3" /> Operating snapshot</Badge>
                <h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.035em]">Your acquisition and revenue signals in one clean view.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Country coverage improves automatically as signed-in users return. Online status is refreshed through a lightweight authenticated heartbeat and expires after five minutes.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-72">
                <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><ArrowDownRight className="size-4 rotate-180 text-primary" /><p className="mt-4 text-2xl font-semibold">{formatNumber(overview.conversionRate, 1)}%</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Conversion</p></div>
                <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><BadgeDollarSign className="size-4 text-amber-300" /><p className="mt-4 text-2xl font-semibold">{formatMoney(overview.monthlyRecurringRevenue)}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Active MRR</p></div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4"><UsersTable generatedAt={data.generatedAt} users={data.users} /></section>
        <footer className="mt-5 flex flex-col gap-2 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>Private admin data · Protected by verified Supabase authentication and server-side role checks.</p><p>MRR is estimated from active monthly plan prices and excludes refunds, tax, discounts, and annualized revenue.</p></footer>
      </div>
    </main>
  );
}
