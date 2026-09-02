// Find the OAuth callback path served by the installed @convex-dev/auth
const fs = require("fs");
const path = require("path");

const root = "node_modules/@convex-dev/auth/dist";
const hits = [];

function walk(d) {
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (p.endsWith(".js")) {
      const s = fs.readFileSync(p, "utf8");
      const m = s.match(/callback[^'"`\s]{0,50}/g);
      if (m) hits.push(path.relative("node_modules/@convex-dev/auth", p) + " => " + m.slice(0, 8).join(" | "));
    }
  }
}

walk(root);
console.log(hits.slice(0, 25).join("\n"));
console.log("--- google provider id ---");
const files = [];
(function walk2(d) {
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk2(p);
    else if (p.endsWith(".js")) files.push(p);
  }
})(root);
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (/google/i.test(s)) {
    const lines = s.split("\n").filter((l) => /google|providerId/i.test(l)).slice(0, 5);
    console.log(path.relative("node_modules/@convex-dev/auth", f));
    console.log("  " + lines.map((l) => l.trim().slice(0, 140)).join("\n  "));
  }
}
