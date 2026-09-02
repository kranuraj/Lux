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

// LTP column: 88px -> 80px (2 occurrences: colgroup col + TableHead)
replace("w-[88px]", "w-[80px]", "LTP width 80");
// Table width: keep equal to the sum of the column widths (700 - 8 = 692)
replace(
  '<Table className="table-fixed" style={{ width: 700 }}>',
  '<Table className="table-fixed" style={{ width: 692 }}>',
  "table width 692",
);
// Hover tooltip on the LTP cell so a wide price is never silently clipped
replace(
  '<TableCell className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs">\n                            {inr.format(s.lastClose)}\n                          </TableCell>',
  '<TableCell\n                              title={inr.format(s.lastClose)}\n                              className="overflow-hidden px-1 py-2.5 text-right text-[13px] tabular-nums sm:px-1.5 sm:py-2 sm:text-xs"\n                            >\n                            {inr.format(s.lastClose)}\n                          </TableCell>',
  "LTP cell title",
);

fs.writeFileSync(p, s);
console.log("PATCHED " + applied + " replacements");
