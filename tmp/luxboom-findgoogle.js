const fs = require("fs");
const path = require("path");

const roots = ["node_modules/@convex-dev/auth/dist"];
const needle = /google|accounts\.|domain|applicationID|split\(["']\.["'']\)|provider.*id/i;

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (p.endsWith(".js") || p.endsWith(".mjs") || p.endsWith(".cjs")) files.push(p);
  }
})(roots[0]);

for (const f of files) {
  let s;
  try {
    s = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const lines = s.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/google|accounts\.google/i.test(l)) {
      console.log(
        path.relative("node_modules/@convex-dev/auth", f) +
          ":" +
          (i + 1) +
          "  " +
          lines.slice(Math.max(0, i - 1), i + 3).map((x) => x.trim().slice(0, 180)).join(" || "),
      );
    }
  }
}
