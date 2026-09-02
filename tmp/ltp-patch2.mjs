import fs from "fs";

const p = "src/pages/Landing.tsx";
let s = fs.readFileSync(p, "utf8");
let applied = 0;

function replace(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.error("ANCHOR_MISSING: " + label);
    process.exit(1);
  }
  s = s.split(oldStr).join(newStr);
  applied += 1;
  console.log("OK: " + label);
}

// LTP column: 80px -> 72px (2 occurrences: colgroup col + TableHead)
replace("w-[80px]", "w-[72px]", "LTP width 72");
// Table width: keep equal to the sum of the column widths (692 - 8 = 684)
replace(
  '<Table className="table-fixed" style={{ width: 692 }}>',
  '<Table className="table-fixed" style={{ width: 684 }}>',
  "table width 684",
);

fs.writeFileSync(p, s);
console.log("PATCHED " + applied + " replacements");
