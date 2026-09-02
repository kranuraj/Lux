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

// 1. Table width -> sum of the new column widths (700px)
replace(
  '<Table className="table-fixed" style={{ width: 580 }}>',
  '<Table className="table-fixed" style={{ width: 700 }}>',
  "table width 700",
);

// 2. Colgroup: GD 72, BO 72, LTP 88, %CHANGE 84, EMA 116, ADR% 68, RSI 60
replace(
  `                  <colgroup>
                    <col className="w-8" />
                    <col className="w-[100px]" />
                    <col className="w-[56px]" />
                    <col className="w-[56px]" />
                    <col className="w-[108px]" />
                    <col className="w-[64px]" />
                    <col className="w-[100px]" />
                    <col className="w-[48px]" />
                    <col className="w-[40px]" />
                  </colgroup>`,
  `                  <colgroup>
                    <col className="w-8" />
                    <col className="w-[100px]" />
                    <col className="w-[76px]" />
                    <col className="w-[76px]" />
                    <col className="w-[88px]" />
                    <col className="w-[84px]" />
                    <col className="w-[116px]" />
                    <col className="w-[68px]" />
                    <col className="w-[60px]" />
                  </colgroup>`,
  "colgroup widths",
);

// 3. Header cells (each disambiguated by its label)
replace(
  'w-[56px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        GD',
  'w-[76px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        GD',
  "GD head 76",
);
replace(
  'w-[56px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        BO',
  'w-[76px] px-1 py-2.5 text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        BO',
  "BO head 76",
);
replace(
  'w-[108px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        LTP',
  'w-[88px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        LTP',
  "LTP head 88",
);
replace(
  'w-[64px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs"\n                        title="% change today"',
  'w-[84px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs"\n                        title="% change today"',
  "% CHANGE head 84",
);
replace(
  'w-[100px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        EMA',
  'w-[116px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        EMA',
  "EMA head 116",
);
replace(
  'w-[48px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        ADR%',
  'w-[68px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        ADR%',
  "ADR% head 68",
);
replace(
  'w-[40px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        RSI',
  'w-[60px] px-1 py-2.5 text-right text-[13px] font-medium text-muted-foreground sm:px-1.5 sm:py-2 sm:text-xs">\n                        RSI',
  "RSI head 60",
);

fs.writeFileSync(p, s);
console.log("PATCHED " + applied + " replacements");
