const fs = require("fs");
const path = require("path");

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (p.endsWith(".js")) files.push(p);
  }
})("node_modules/@convex-dev/auth/dist");

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (/applicationID|\.domain|domain\.split|first segment|providerId =/.test(s)) {
    const lines = s.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/applicationID|\.domain|domain\.split|providerId\s*=|id\s*:\s*/.test(l)) {
        console.log(
          path.relative("node_modules/@convex-dev/auth", f) +
            ":" +
            (i + 1) +
            "  " +
            lines.slice(Math.max(0, i - 1), i + 3).map((x) => x.trim().slice(0, 160)).join(" || "),
        );
      }
    }
  }
}
