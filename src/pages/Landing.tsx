import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggleMenuItem } from "@/components/ThemeToggleMenuItem";
import { api } from "@/convex/_generated/api";
import type {
  CachedResultRow,
  Signal,
  SymbolListResult,
} from "@/convex/screener";
import { useAuth } from "@/hooks/use-auth";
import { FALLBACK_FO_SYMBOLS } from "@/lib/fo-symbols";
import { useAction, useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const BATCH_SIZE = 50;
const CONCURRENT_BATCHES = 3;

/** Results fresher than this are served from cache without a Yahoo fetch. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const LOOKBACK_OPTIONS = [
  { value: 1, label: "Today" },
  { value: 3, label: "3 days" },
  { value: 5, label: "5 days" },
  { value: 10, label: "10 days" },
  { value: 30, label: "30 days" },
];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Signed percent, e.g. "+1.24%", "-0.85%", "0.00%". */
function fmtPct(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function fmtUpdated(t: number): string {
  const d = new Date(t);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? time
    : `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
}

function tradingViewUrl(symbol: string): string {
  return `https://www.tradingview.com/chart/?symbol=NSE:${encodeURIComponent(symbol)}`;
}

/** First + last word initials, e.g. "Rahul Sharma" -> "RS", "Rahul" -> "R". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/**
 * EMA alignment stack: how many of the 10 / 20 / 50 / 200-day averages are
 * stacked in ascending order (10 above 20 above 50 above 200). Returns the
 * longest aligned prefix, e.g. "10.20.50.200" for a full stack.
 *
 * Partial data is fine — a newly listed stock with only its 10-day average
 * available shows "10" instead of "—". The prefix stops at the first missing
 * average or the first break in the ascending order.
 */
function emaStack(s: Signal): { text: string; level: number } {
  const labels = ["10", "20", "50", "200"] as const;
  const values = [s.ema10, s.ema20, s.ema50, s.ema200];
  let count = 0;
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v) || v <= 0) break;
    if (prev !== null && v > prev) break;
    count += 1;
    prev = v;
  }
  if (count === 0) return { text: "—", level: 0 };
  return {
    text: labels.slice(0, count).join("."),
    level: count,
  };
}

/** Stable sort: completed breakouts first (most recent), then pending signals. */
function sortSignals(list: Signal[]): Signal[] {
  return [...list].sort((a, b) => {
    const aHas = a.breakoutDate !== null ? 1 : 0;
    const bHas = b.breakoutDate !== null ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas;
    if (a.breakoutDate && b.breakoutDate) {
      return b.breakoutDate.localeCompare(a.breakoutDate);
    }
    return b.signalDate.localeCompare(a.signalDate) || a.symbol.localeCompare(b.symbol);
  });
}

/**
 * Pagination items. A 5-page sliding window around the current page is always
 * visible, so at least 5 page selectors are on screen. On wider screens the
 * first/last pages and ellipses are added around the window (head/tail) so the
 * ends of the range stay reachable; on small screens those extras are hidden
 * to keep the bar compact.
 */
function pagerWindow(current: number, total: number): {
  head: (number | null)[];
  window: number[];
  tail: (number | null)[];
} {
  if (total <= 5) {
    return {
      head: [],
      window: Array.from({ length: total }, (_, i) => i + 1),
      tail: [],
    };
  }
  let start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  start = Math.max(1, end - 4);
  const window = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const head: (number | null)[] = [];
  if (start > 1) {
    head.push(1);
    if (start > 2) head.push(null);
  }
  const tail: (number | null)[] = [];
  if (end < total) {
    if (end < total - 1) tail.push(null);
    tail.push(total);
  }
  return { head, window, tail };
}

type Phase = "idle" | "loading" | "scanning" | "done";

export default function Landing() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [listSource, setListSource] = useState<"live" | "fallback">("live");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failures, setFailures] = useState<string[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [lookback, setLookback] = useState(5);
  const [query, setQuery] = useState("");
  const [foOnly, setFoOnly] = useState(false);
  const [foSymbols, setFoSymbols] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const signalsRef = useRef(new Map<string, Signal>());
  const symbolsRef = useRef<string[]>([]);
  const failuresRef = useRef<string[]>([]);
  const cancelledRef = useRef(false);
  const autoStartedRef = useRef(false);

  const listSymbolsAction = useAction(api.screener.listSymbols);
  const scanBatchAction = useAction(api.screener.scanBatch);
  const getCachedScanAction = useAction(api.screener.getCachedScan);
  const recordScan = useMutation(api.usage.recordScan);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const greetingName = useMemo(() => {
    const raw =
      user?.name?.trim() ||
      (user?.email ? user.email.split("@")[0] : "trader");
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [user?.name, user?.email]);

  const userInitials = useMemo(
    () => (user?.name ? initialsOf(user.name) : ""),
    [user?.name],
  );

  /**
   * Scan a set of symbols. Pass `list: null` to scan the full universe.
   * Results are cache-first; only missing/stale symbols hit Yahoo unless
   * `force` is set. When `merge` is false the table is cleared first and
   * symbols no longer in the universe are pruned.
   */
  const runScan = useCallback(
    async (list: string[] | null, opts: { force?: boolean; merge?: boolean } = {}) => {
      cancelledRef.current = false;
      setPhase("loading");

      let symbols: string[];
      if (list && list.length > 0) {
        symbols = list;
      } else if (symbolsRef.current.length > 0) {
        symbols = [...symbolsRef.current];
      } else {
        try {
          const result = await listSymbolsAction();
          symbols = result.symbols;
          symbolsRef.current = symbols;
          setFoSymbols(result.foSymbols ?? []);
          setListSource(result.source);
        } catch {
          setPhase("idle");
          return;
        }
      }

      const scannedSet = new Set(symbols);
      if (!opts.merge) {
        signalsRef.current.clear();
        setSignals([]);
      }
      setFailures([]);
      failuresRef.current = [];
      setProgress({ done: 0, total: symbols.length });
      setPhase("scanning");

      const batches: string[][] = [];
      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        batches.push(symbols.slice(i, i + BATCH_SIZE));
      }

      let doneCount = 0;
      let latestFetchedAt = 0;
      const failed: string[] = [];

      const worker = async () => {
        while (!cancelledRef.current) {
          const batch = batches.shift();
          if (batch === undefined) return;
          try {
            const items = await scanBatchAction({
              symbols: batch,
              force: opts.force === true,
            });
            for (const item of items) {
              if (item.signal) signalsRef.current.set(item.symbol, item.signal);
              else if (!item.ok) failed.push(item.symbol);
              if (item.fetchedAt > latestFetchedAt) latestFetchedAt = item.fetchedAt;
            }
            if (!cancelledRef.current) {
              setSignals([...signalsRef.current.values()]);
            }
          } catch {
            if (!cancelledRef.current) failed.push(...batch);
          }
          doneCount += batch.length;
          if (!cancelledRef.current) {
            setProgress({ done: doneCount, total: symbols.length });
          }
        }
      };

      await Promise.all(Array.from({ length: CONCURRENT_BATCHES }, worker));

      // Attribute this screener run to the signed-in user (best-effort).
      void recordScan();

      if (!opts.merge) {
        // Drop symbols that are no longer in the universe (e.g. delisted).
        for (const sym of signalsRef.current.keys()) {
          if (!scannedSet.has(sym)) signalsRef.current.delete(sym);
        }
        setSignals([...signalsRef.current.values()]);
      }

      setFailures(failed);
      failuresRef.current = failed;
      if (latestFetchedAt > 0) setUpdatedAt(latestFetchedAt);
      setPhase("done");
    },
    [listSymbolsAction, scanBatchAction, recordScan],
  );

  // On mount: restore the last scan from the cache instantly, then refresh
  // only the symbols that are missing or stale, in the background.
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    void (async () => {
      try {
        let rows: CachedResultRow[] = [];
        let listInfo: (SymbolListResult & { updatedAt: number }) | null = null;
        let cursor = 0;
        for (;;) {
          const pageData = await getCachedScanAction({ cursor, limit: 400 });
          rows = rows.concat(pageData.results);
          listInfo = pageData.list;
          if (!pageData.hasMore) break;
          cursor += 400;
        }

        if (rows.length === 0) {
          await runScan(null, {});
          return;
        }

        const freshCutoff = Date.now() - CACHE_TTL_MS;
        const seeded = new Map<string, Signal>();
        const freshSymbols = new Set<string>();
        const failed: string[] = [];
        let maxFetched = 0;
        for (const r of rows) {
          if (r.signal) seeded.set(r.symbol, r.signal);
          // Signals cached before the today's-% change metric existed lack
          // it — treat them as stale so they're refetched once with the new
          // value included instead of showing "—" for up to the cache TTL.
          const hasTodayChange = r.signal
            ? Number.isFinite(r.signal.changeTodayPct)
            : true;
          if (r.fetchedAt >= freshCutoff && hasTodayChange)
            freshSymbols.add(r.symbol);
          if (!r.ok && r.fetchedAt >= freshCutoff) failed.push(r.symbol);
          if (r.fetchedAt > maxFetched) maxFetched = r.fetchedAt;
        }

        signalsRef.current = seeded;
        setSignals([...seeded.values()]);
        setFailures(failed);
        failuresRef.current = failed;
        if (listInfo) {
          symbolsRef.current = listInfo.symbols;
          setFoSymbols(listInfo.foSymbols ?? []);
          setListSource(listInfo.source);
        }
        setUpdatedAt(maxFetched || Date.now());

        const stale: string[] = [];
        for (const sym of listInfo?.symbols ?? []) {
          if (!freshSymbols.has(sym)) stale.push(sym);
        }
        if (stale.length > 0) await runScan(stale, { merge: true });
        else setPhase("done");
      } catch {
        await runScan(null, {});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, lookback, foOnly]);

  const cancelScan = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  /**
   * F&O universe: the backend's weekly NSE derivatives list when available,
   * otherwise the bundled fallback snapshot — so the filter always works.
   */
  const foSet = useMemo(
    () => new Set(foSymbols.length > 0 ? foSymbols : FALLBACK_FO_SYMBOLS),
    [foSymbols],
  );

  /**
   * Rows to show. Without a query this is limited to the selected signal
   * window; typing a query searches the ENTIRE scanned universe (every
   * window and every page), so a ticker is findable no matter when its
   * signal fired. Switching the universe to F&O keeps only tickers with
   * active derivatives contracts.
   */
  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    return sortSignals(
      signals.filter((s) => {
        const inWindow = s.barsSinceSignal <= lookback;
        const matchesQuery = q === "" || s.symbol.includes(q);
        const inFo = !foOnly || foSet.has(s.symbol);
        return q !== "" ? matchesQuery && inFo : inWindow && inFo;
      }),
    );
  }, [signals, lookback, query, foOnly, foSet]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const rows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Selection helpers (per current page + row checkboxes).
  const pageSymbols = rows.map((r) => r.symbol);
  const allPageSelected =
    pageSymbols.length > 0 && pageSymbols.every((s) => selected.has(s));
  const somePageSelected = pageSymbols.some((s) => selected.has(s));

  const toggleSymbol = (symbol: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageSymbols.forEach((s) => next.delete(s));
      } else {
        pageSymbols.forEach((s) => next.add(s));
      }
      return next;
    });
  };

  const handleCopy = async () => {
    if (selected.size === 0) return;
    const text = [...selected].sort().join(",");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API can be blocked inside iframes — fall back to a hidden
      // textarea + execCommand so copy still works in the preview.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast(`Copied ${selected.size} ticker${selected.size === 1 ? "" : "s"}`);
  };

  const scanning = phase === "scanning" || phase === "loading";
  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const allFailed =
    phase === "done" &&
    progress.total > 0 &&
    progress.done === progress.total &&
    failures.length === progress.total;

  const pager = pagerWindow(currentPage, pages);

  const renderPageBtn = (item: number, hiddenOnMobile = false) => (
    <button
      key={item}
      onClick={() => setPage(item)}
      aria-current={item === currentPage ? "page" : undefined}
      className={
        "inline-flex size-8 items-center justify-center rounded-md text-xs tabular-nums transition-colors " +
        (hiddenOnMobile ? "hidden sm:inline-flex " : "") +
        (item === currentPage
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground")
      }
    >
      {item}
    </button>
  );

  const renderGap = (key: string, hiddenOnMobile = false) => (
    <span
      key={key}
      className={
        "px-1.5 text-xs text-muted-foreground " +
        (hiddenOnMobile ? "hidden sm:inline" : "")
      }
    >
      …
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="mx-auto w-full max-w-[800px] px-4 py-6 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
              Hello, {greetingName}!
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Account menu"
                >
                  {userInitials ? (
                    <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold tracking-wide text-background">
                      {userInitials}
                    </span>
                  ) : (
                    <User className="size-4.5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5">
                <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-2.5">
                  <span className="truncate text-sm font-semibold normal-case">
                    {greetingName}
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {user?.email ?? ""}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer px-3 py-2 text-sm"
                >
                  Usage dashboard
                </DropdownMenuItem>
                <ThemeToggleMenuItem />
                <DropdownMenuItem
                  onClick={() => void handleSignOut()}
                  variant="destructive"
                  className="cursor-pointer px-3 py-2 text-sm"
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h1 className="mt-1.5 text-3xl font-light tracking-tight sm:text-4xl">
            LuxBoom Screener
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
            {updatedAt ? <>Last Updated {fmtUpdated(updatedAt)}</> : null}
          </p>
        </header>

        {/* Controls */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all tickers"
              className="pl-9"
              aria-label="Search all tickers"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Signal within
            </label>
            <Select
              value={String(lookback)}
              onValueChange={(v) => setLookback(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[110px]" aria-label="Signal window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOOKBACK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(phase === "done" || phase === "idle") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void runScan(null, { merge: true, force: true })}
                className="h-8 text-xs"
                title="Fetch fresh prices for every symbol"
              >
                <RefreshCw className="size-3.5" />
                Refresh data
              </Button>
            )}
          </div>
        </div>

        {/* Scan area */}
        <div className="mt-5">
          {phase === "idle" && (
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => void runScan(null, {})}
                className="h-10 w-full rounded-md bg-foreground text-background hover:bg-foreground/90 sm:w-auto sm:px-8"
              >
                Run screen
              </Button>
              <p className="text-[11px] leading-5 text-muted-foreground/80">
                Screens every listed equity (~2,100 symbols). The first run
                fetches a year of daily prices for each ticker; results are
                cached for a few hours, so repeat scans are instant.
              </p>
            </div>
          )}

          {(phase === "loading" || phase === "scanning") && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-sm">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  <span>
                    {phase === "loading"
                      ? "Loading…"
                      : `${signals.length > 0 ? "Refreshing" : "Scanning"} ${progress.done.toLocaleString("en-IN")} of ${progress.total.toLocaleString("en-IN")} equities`}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {signals.length} signal{signals.length === 1 ? "" : "s"}
                </span>
              </div>
              {phase === "scanning" && (
                <>
                  <Progress value={progressPct} className="mt-3 h-1" />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/80">
                      {progressPct}% · results update live
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelScan}
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {phase === "done" && listSource === "fallback" && (
            <p className="text-[11px] text-muted-foreground/70">
              Using the bundled symbol list — remote equity lists were
              unreachable.
            </p>
          )}
        </div>

        {/* Results */}
        <div className="mt-7">
          {scanning && signals.length > 0 && (
            <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {query.trim()
                ? `${visible.length} match${visible.length === 1 ? "" : "es"} across all windows`
                : `${foOnly ? "F&O · " : ""}${visible.length} in window`}
            </p>
          )}

          {rows.length > 0 ? (
            <>
              {/* Selection bar + All/F&O universe switcher */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    role="group"
                    aria-label="Market universe"
                    className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
                  >
                    {(
                      [
                        { key: false, label: "All" },
                        { key: true, label: "F&O" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setFoOnly(opt.key)}
                        aria-pressed={foOnly === opt.key}
                        className={
                          "rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors " +
                          (foOnly === opt.key
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {selected.size} selected
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopy()}
                  disabled={selected.size === 0}
                  className="h-8 text-xs"
                  title="Copy selected tickers, comma separated, to paste in TradingView"
                >
                  <Copy className="size-3.5" />
                  Copy tickers
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                {/* Fixed table width (sum of the column widths): the numeric
                    columns hug the left and any spare container space stays
                    empty on the right instead of stretching the columns. */}
                <Table className="table-fixed" style={{ width: 684 }}>
                  <colgroup>
                    <col className="w-8" />
                    <col className="w-[100px]" />
                    <col className="w-[76px]" />
                    <col className="w-[76px]" />
                    <col className="w-[72px]" />
                    <col className="w-[84px]" />
                    <col className="w-[116px]" />
                    <col className="w-[68px]" />
                    <col className="w-[60px]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="w-8 px-2 py-2.5 sm:px-1.5 sm:py-2">
                        <Checkbox
                          checked={
                            allPageSelected
                              ? true
                              : somePageSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={togglePage}
                          aria-label="Select all stocks on this page"
                        />
                      </TableHead>
                      <TableHead className="w-[100px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        Ticker
                      </TableHead>
                      <TableHead className="w-[76px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        GD
                      </TableHead>
                      <TableHead className="w-[76px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        BO
                      </TableHead>
                      <TableHead className="w-[72px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        LTP
                      </TableHead>
                      <TableHead
                        className="w-[84px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs"
                        title="% change today"
                      >
                        % CHANGE
                      </TableHead>
                      <TableHead className="w-[116px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        EMA
                      </TableHead>
                      <TableHead className="w-[68px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        ADR%
                      </TableHead>
                      <TableHead className="w-[60px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                        RSI
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((s) => {
                      const stack = emaStack(s);
                      const brokeToday =
                        s.breakoutDate !== null && s.breakoutDate === s.lastDate;
                      return (
                        <TableRow
                          key={s.symbol}
                          className="border-border/60 transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="px-2 py-2.5 sm:px-1.5 sm:py-2">
                            <Checkbox
                              checked={selected.has(s.symbol)}
                              onCheckedChange={() => toggleSymbol(s.symbol)}
                              aria-label={`Select ${s.symbol}`}
                            />
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-[13px] sm:px-1.5 sm:py-2 sm:text-xs">
                            <a
                              href={tradingViewUrl(s.symbol)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Open ${s.symbol} on TradingView`}
                              className="block truncate font-medium text-foreground underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
                            >
                              {s.symbol}
                            </a>
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-[13px] tabular-nums text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">
                            {fmtDate(s.signalDate)}
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">
                            {s.breakoutDate ? (
                              <span
                                title={
                                  brokeToday
                                    ? "Broke out on the latest session"
                                    : undefined
                                }
                                className={
                                  brokeToday
                                    ? "font-medium text-blue-600 dark:text-blue-400"
                                    : "text-foreground"
                                }
                              >
                                {fmtDate(s.breakoutDate)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell
                              title={inr.format(s.lastClose)}
                              className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs"
                            >
                            {inr.format(s.lastClose)}
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">
                            {Number.isFinite(s.changeTodayPct) ? (
                              <span
                                title="% change today vs the previous close"
                                className="font-medium"
                                style={{
                                  color:
                                    s.changeTodayPct > 0
                                      ? "var(--positive)"
                                      : s.changeTodayPct < 0
                                        ? "var(--destructive)"
                                        : undefined,
                                }}
                              >
                                {fmtPct(s.changeTodayPct)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">
                            <span
                              title={
                                stack.level === 4
                                  ? "10 > 20 > 50 > 200 day averages"
                                  : "EMA stack alignment"
                              }
                              className={
                                stack.level === 4
                                  ? "font-medium text-foreground"
                                  : stack.level === 3
                                    ? "text-foreground/80"
                                    : stack.level === 2
                                      ? "text-muted-foreground"
                                      : "text-muted-foreground/60"
                              }
                            >
                              {stack.text}
                            </span>
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">
                            {Number.isFinite(s.adrPct) ? (
                              s.adrPct > 4 ? (
                                <span
                                  className="font-medium"
                                  style={{ color: "var(--positive)" }}
                                >
                                  {s.adrPct.toFixed(1)}
                                </span>
                              ) : (
                                s.adrPct.toFixed(1)
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">
                            {Number.isFinite(s.rsi) ? (
                              s.rsi > 55 ? (
                                <span
                                  className="font-medium"
                                  style={{ color: "var(--positive)" }}
                                >
                                  {Math.round(s.rsi)}
                                </span>
                              ) : (
                                Math.round(s.rsi)
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pager */}
              {pages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-6 flex items-center justify-between gap-2"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                    className="h-8 px-2.5 text-xs"
                  >
                    <ChevronLeft className="size-3.5" />
                    Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    {pager.head.map((item, i) =>
                      item === null
                        ? renderGap(`head-gap-${i}`, true)
                        : renderPageBtn(item, true),
                    )}
                    {pager.window.map((item) => renderPageBtn(item))}
                    {pager.tail.map((item, i) =>
                      item === null
                        ? renderGap(`tail-gap-${i}`, true)
                        : renderPageBtn(item, true),
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pages}
                    onClick={() => setPage(currentPage + 1)}
                    className="h-8 px-2.5 text-xs"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </nav>
              )}
            </>
          ) : (
            !scanning && (
              <div className="rounded-lg border border-dashed border-border py-14 text-center">
                <p className="text-sm text-muted-foreground">
                  {allFailed
                    ? "Couldn't reach the price data source. Check your connection and try again."
                    : query.trim()
                      ? `No matches for “${query.trim()}” among all scanned tickers.`
                      : foOnly
                        ? "No F&O stocks with a signal in the selected window. Widen the window or switch to All."
                        : "No signals in the selected window. Widen the window or refresh data."}
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-5">
          <p className="text-[11px] leading-4 text-muted-foreground/70">
            For learning purposes only — not a stock suggestion or investment
            advice. LuxBoom is not registered with SEBI or any regulatory
            body. Always do your own research and consult a SEBI-registered
            advisor before investing.
          </p>
        </footer>
      </div>
    </motion.div>
  );
}
