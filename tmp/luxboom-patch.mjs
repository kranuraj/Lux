import fs from "fs";

const files = {
  "src/convex/schema.ts": [
    [
      `  lastDate: v.string(),\n  lastClose: v.number(),\n  changePct: v.number(),`,
      `  lastDate: v.string(),\n  lastClose: v.number(),\n  // % change of the latest close vs the previous session (today's move).\n  changeTodayPct: v.union(v.null(), v.number()),\n  changePct: v.number(),`,
    ],
  ],
  "src/convex/screener.ts": [
    [
      `  lastDate: string;\n  lastClose: number;\n  /** % change from the crossover close to the last close. */\n  changePct: number;`,
      `  lastDate: string;\n  lastClose: number;\n  /** % change of the latest close vs the previous session (today's move). */\n  changeTodayPct: number;\n  /** % change from the crossover close to the last close. */\n  changePct: number;`,
    ],
    [`  if (n < 60) return null;`, `  if (n < 35) return null;`],
    [
      `  const lastClose = closes[n - 1];\n  const changePct = (lastClose / closes[cross] - 1) * 100;\n\n  return {\n    symbol,\n    signalDate: dates[cross],\n    barsSinceSignal: n - 1 - cross,\n    signalHigh,\n    breakoutDate: breakout === -1 ? null : dates[breakout],\n    lastDate: dates[n - 1],\n    lastClose,\n    changePct,`,
      `  const lastClose = closes[n - 1];\n  const changePct = (lastClose / closes[cross] - 1) * 100;\n  const prevClose = closes[n - 2];\n  const changeTodayPct = prevClose > 0 ? (lastClose / prevClose - 1) * 100 : NaN;\n\n  return {\n    symbol,\n    signalDate: dates[cross],\n    barsSinceSignal: n - 1 - cross,\n    signalHigh,\n    breakoutDate: breakout === -1 ? null : dates[breakout],\n    lastDate: dates[n - 1],\n    lastClose,\n    changeTodayPct,\n    changePct,`,
    ],
    [`  if (dates.length < 60) return null;`, `  if (dates.length < 30) return null;`],
    [
      `function emaLast(values: number[], period: number): number {\n  if (values.length < period) return NaN;\n  const k = 2 / (period + 1);\n  let prev = 0;\n  for (let j = 0; j < period; j++) prev += values[j];\n  prev /= period;\n  for (let i = period; i < values.length; i++) {\n    prev = values[i] * k + prev * (1 - k);\n  }\n  return prev;\n}`,
      `function emaLast(values: number[], period: number): number {\n  // Seed over the first window of \`period\` consecutive finite values — the\n  // same rule \`ema\` uses — so a series with leading gaps still yields a\n  // value whenever enough data exists.\n  let seedStart = -1;\n  let run = 0;\n  for (let i = 0; i < values.length; i++) {\n    run = Number.isFinite(values[i]) ? run + 1 : 0;\n    if (run === period) {\n      seedStart = i - period + 1;\n      break;\n    }\n  }\n  if (seedStart === -1) return NaN;\n  const k = 2 / (period + 1);\n  let prev = 0;\n  for (let j = seedStart; j < seedStart + period; j++) prev += values[j];\n  prev /= period;\n  for (let i = seedStart + period; i < values.length; i++) {\n    prev = values[i] * k + prev * (1 - k);\n  }\n  return prev;\n}`,
    ],
    [
      `    lastDate: s.lastDate,\n    lastClose: s.lastClose,\n    changePct: s.changePct,`,
      `    lastDate: s.lastDate,\n    lastClose: s.lastClose,\n    changeTodayPct: Number.isFinite(s.changeTodayPct) ? s.changeTodayPct : null,\n    changePct: s.changePct,`,
    ],
    [
      `    lastDate: st.lastDate,\n    lastClose: st.lastClose,\n    changePct: st.changePct,`,
      `    lastDate: st.lastDate,\n    lastClose: st.lastClose,\n    changeTodayPct: st.changeTodayPct ?? NaN,\n    changePct: st.changePct,`,
    ],
  ],
  "src/pages/Landing.tsx": [
    [
      `function fmtDate(iso: string): string {\n  const d = new Date(iso + "T00:00:00Z");\n  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });\n}`,
      `function fmtDate(iso: string): string {\n  const d = new Date(iso + "T00:00:00Z");\n  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });\n}\n\n/** Signed percent, e.g. "+1.24%", "-0.85%", "0.00%". */\nfunction fmtPct(v: number): string {\n  return \`\${v > 0 ? "+" : ""}\${v.toFixed(2)}%\`;\n}`,
    ],
    [
      `function todayLabel(): string {\n  return new Date().toLocaleDateString("en-IN", {\n    weekday: "long",\n    day: "numeric",\n    month: "long",\n    year: "numeric",\n  });\n}\n\nfunction fmtUpdated(t: number): string {`,
      `function fmtUpdated(t: number): string {`,
    ],
    [
      `            As of {todayLabel()}\n            {updatedAt ? <> · Updated {fmtUpdated(updatedAt)}</> : null}`,
      `            {updatedAt ? <>Last Updated {fmtUpdated(updatedAt)}</> : null}`,
    ],
    [
      `                <Table className="table-fixed min-w-[528px]">\n                  <colgroup>\n                    <col className="w-8" />\n                    <col className="w-[88px]" />\n                    <col className="w-[56px]" />\n                    <col className="w-[56px]" />\n                    <col className="w-[108px]" />\n                    <col className="w-[100px]" />\n                    <col className="w-[48px]" />\n                    <col className="w-[40px]" />\n                  </colgroup>`,
      `                {/* Fixed table width (sum of the column widths): the numeric\n                    columns hug the left and any spare container space stays\n                    empty on the right instead of stretching the columns. */}\n                <Table className="table-fixed" style={{ width: 580 }}>\n                  <colgroup>\n                    <col className="w-8" />\n                    <col className="w-[100px]" />\n                    <col className="w-[56px]" />\n                    <col className="w-[56px]" />\n                    <col className="w-[108px]" />\n                    <col className="w-[64px]" />\n                    <col className="w-[100px]" />\n                    <col className="w-[48px]" />\n                    <col className="w-[40px]" />\n                  </colgroup>`,
    ],
    [
      `                      <TableHead className="w-[88px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        Ticker\n                      </TableHead>`,
      `                      <TableHead className="w-[100px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        Ticker\n                      </TableHead>`,
    ],
    [
      `                      <TableHead className="w-[108px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        LTP\n                      </TableHead>\n                      <TableHead className="w-[100px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        EMA\n                      </TableHead>`,
      `                      <TableHead className="w-[108px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        LTP\n                      </TableHead>\n                      <TableHead\n                        className="w-[64px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs"\n                        title="% change today"\n                      >\n                        % CHANGE\n                      </TableHead>\n                      <TableHead className="w-[100px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        EMA\n                      </TableHead>`,
    ],
    [
      `                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">\n                            {inr.format(s.lastClose)}\n                          </TableCell>`,
      `                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">\n                            {inr.format(s.lastClose)}\n                          </TableCell>\n                          <TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">\n                            {Number.isFinite(s.changeTodayPct) ? (\n                              <span\n                                title="% change today vs the previous close"\n                                className="font-medium"\n                                style={{\n                                  color:\n                                    s.changeTodayPct > 0\n                                      ? "var(--positive)"\n                                      : s.changeTodayPct < 0\n                                        ? "var(--destructive)"\n                                        : undefined,\n                                }}\n                              >\n                                {fmtPct(s.changeTodayPct)}\n                              </span>\n                            ) : (\n                              "—"\n                            )}\n                          </TableCell>`,
    ],
    [
      `        for (const r of rows) {\n          if (r.signal) seeded.set(r.symbol, r.signal);\n          if (r.fetchedAt >= freshCutoff) freshSymbols.add(r.symbol);\n          if (!r.ok && r.fetchedAt >= freshCutoff) failed.push(r.symbol);\n          if (r.fetchedAt > maxFetched) maxFetched = r.fetchedAt;\n        }`,
      `        for (const r of rows) {\n          if (r.signal) seeded.set(r.symbol, r.signal);\n          // Signals cached before the today's-% change metric existed lack\n          // it — treat them as stale so they're refetched once with the new\n          // value included instead of showing "—" for up to the cache TTL.\n          const hasTodayChange = r.signal\n            ? Number.isFinite(r.signal.changeTodayPct)\n            : true;\n          if (r.fetchedAt >= freshCutoff && hasTodayChange)\n            freshSymbols.add(r.symbol);\n          if (!r.ok && r.fetchedAt >= freshCutoff) failed.push(r.symbol);\n          if (r.fetchedAt > maxFetched) maxFetched = r.fetchedAt;\n        }`,
    ],
  ],
};

let failures = 0;
for (const [file, changes] of Object.entries(files)) {
  const p = file.startsWith("src/") ? file : `src/${file}`;
  let s = fs.readFileSync(p, "utf8");
  for (const [oldStr, newStr] of changes) {
    if (s.includes(newStr)) {
      console.log(`ALREADY  ${file}`);
      continue;
    }
    if (!s.includes(oldStr)) {
      console.error(`ANCHOR_MISSING in ${file}`);
      console.error(`  needle: ${JSON.stringify(oldStr.slice(0, 90))}...`);
      failures++;
      continue;
    }
    s = s.replace(oldStr, newStr);
    console.log(`APPLIED  ${file}`);
  }
  fs.writeFileSync(p, s);
}
console.log(failures === 0 ? "PATCH_OK" : `PATCH_FAILURES=${failures}`);
process.exit(failures === 0 ? 0 : 1);
