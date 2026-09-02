// Snapshot the current project source into /tmp/luxboom-backup-<stamp>/
const fs = require("fs");
const path = require("path");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = "/tmp/luxboom-backup-" + stamp;
fs.mkdirSync(dest, { recursive: true });

function cp(s, d) {
  const st = fs.statSync(s);
  if (st.isDirectory()) {
    fs.mkdirSync(d, { recursive: true });
    for (const e of fs.readdirSync(s)) cp(path.join(s, e), path.join(d, e));
  } else {
    fs.copyFileSync(s, d);
  }
}

const items = [
  "src",
  "index.html",
  "package.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "vite.config.ts",
  "convex.json",
  ".gitignore",
];

for (const f of items) {
  if (fs.existsSync(f)) cp(f, path.join(dest, f));
}

console.log("BACKUP_OK:", dest);
console.log("FILES:", fs.readdirSync(dest).join(", "));
