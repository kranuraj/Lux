const fs = require("fs");
const path = require("path");

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d)) {
    const p = path.join(d, e);
    let s;
    try {
      s = fs.statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(p);
    else if (p.endsWith(".js") || p.endsWith(".mjs") || p.endsWith(".cjs")) files.push(p);
  }
})("node_modules/convex/dist");

for (const f of files) {
  let s;
  try {
    s = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }
  if (!/accounts\.google|googleusercontent/i.test(s)) continue;
  const lines = s.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/google|applicationID|auth\.config|OAuthProvider|domain/i.test(lines[i])) {
      console.log(
        path.relative("node_modules/convex", f) +
          ":" +
          (i + 1) +
          "  " +
          lines.slice(Math.max(0, i - 1), i + 4).map((x) => x.trim().slice(0, 170)).join(" || "),
      );
    }
  }
}
