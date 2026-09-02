import fs from "fs";

const file = "src/pages/Landing.tsx";
const changes = [
  [
    `function todayLabel(): string {\n  return new Date().toLocaleDateString("en-IN", {\n    weekday: "long",\n    day: "numeric",\n    month: "long",\n    year: "numeric",\n  });\n}\n\nfunction fmtUpdated(t: number): string {`,
    `function fmtUpdated(t: number): string {`,
  ],
  [
    `                {/* Fixed column widths: table-fixed + a <colgroup> with exact\n                    pixel widths keep every column the same width in every\n                    section (search, F&O, lookback, pagination), so the table\n                    never jumps or moves. The widths are sized for the compact\n                    13px mobile cells (px-1) — content hugs the column edges\n                    with no dead space. */}\n                {/* Fixed table width (sum of the column widths): the numeric`,
    `                {/* Fixed table width (sum of the column widths): the numeric`,
  ],
];

let s = fs.readFileSync(file, "utf8");
let failures = 0;
for (const [oldStr, newStr] of changes) {
  if (!s.includes(oldStr)) {
    console.log("ALREADY_CLEAN");
    continue;
  }
  s = s.replace(oldStr, newStr);
  console.log("CLEANED");
}
fs.writeFileSync(file, s);
console.log(failures === 0 ? "CLEANUP_OK" : `CLEANUP_FAILURES=${failures}`);
process.exit(failures === 0 ? 0 : 1);
