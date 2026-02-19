const fs = require("fs");
const path = require("path");
const dir = "c:/Users/davide.sarti_flyabil/Desktop/Perso/pokedex-interface-design/components/gecko-dex";

function r(file, replacements) {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, "utf8");
  let ch = 0;
  for (const [a, b] of replacements) {
    const n = c.split(a).length - 1;
    if (n > 0) { c = c.split(a).join(b); ch += n; }
  }
  if (ch > 0) { fs.writeFileSync(fp, c); console.log(file + ": " + ch); }
}

r("stats-grid.tsx", [
  ["bg-gb-darkest p-5", "bg-gb-darkest p-2.5"],
  ["mb-3 border", "mb-1.5 border"],
  ["pb-2 tracking", "pb-1 tracking"],
  ["flex-col gap-2", "flex-col gap-1"],
  ["w-[118px]", "w-[60px]"],
  ['width="11" height="11"', 'width="6" height="6"'],
  ["ml-2 shrink", "ml-1 shrink"],
]);

r("dog-stats.tsx", [
  ["bg-gb-darkest p-5", "bg-gb-darkest p-2.5"],
  ["mb-3 border", "mb-1.5 border"],
  ["pb-2 tracking", "pb-1 tracking"],
  ["flex-col gap-2", "flex-col gap-1"],
  ["w-[118px]", "w-[60px]"],
  ['width="11" height="11"', 'width="6" height="6"'],
  ["ml-2 shrink", "ml-1 shrink"],
]);

r("beetle-stats.tsx", [
  ["bg-gb-darkest p-5", "bg-gb-darkest p-2.5"],
  ["mb-3 border", "mb-1.5 border"],
  ["pb-2 tracking", "pb-1 tracking"],
  ["flex-col gap-2", "flex-col gap-1"],
  ["w-[118px]", "w-[60px]"],
  ['width="11" height="11"', 'width="6" height="6"'],
  ["ml-2 shrink", "ml-1 shrink"],
]);

r("basic-info.tsx", [
  ["bg-gb-darkest p-5", "bg-gb-darkest p-2.5"],
  ["mb-3 border", "mb-1.5 border"],
  ["pb-2 tracking", "pb-1 tracking"],
  ["flex-col gap-2", "flex-col gap-1"],
  ["-mx-2 px-2", "-mx-1 px-1"],
  ["max-w-[430px]", "max-w-[215px]"],
]);

r("select-bar.tsx", [
  ["items-center gap-2", "items-center gap-1"],
  ["py-2 text-[7px]", "py-1 text-[7px]"],
]);

r("animal-card.tsx", [
  ["bg-gb-darkest p-5 flex flex-col items-center gap-4", "bg-gb-darkest p-2.5 flex flex-col items-center gap-2"],
  ["top-3 right-3 w-10 h-10", "top-1.5 right-1.5 w-5 h-5"],
  ["bottom-[4px] right-[6px]", "bottom-[2px] right-[3px]"],
  ["px-[6px] py-[2px]", "px-[3px] py-[1px]"],
]);

r("grid-view.tsx", [
  ["p-6 flex flex-col gap-5", "p-3 flex flex-col gap-2.5"],
  ["grid-cols-2 gap-6", "grid-cols-2 gap-3"],
  ["gap-4 border-2 border-dashed", "gap-2 border-2 border-dashed"],
]);

r("pokedex-shell.tsx", [
  ["p-6 flex flex-col gap-5", "p-3 flex flex-col gap-2.5"],
]);

for (const f of ["gecko-sprite.tsx", "dog-sprite.tsx", "beetle-sprite.tsx"]) {
  r(f, [
    ["bg-gb-darkest p-[6px]", "bg-gb-darkest p-[3px]"],
    ["w-[150px] h-[125px]", "w-[75px] h-[63px]"],
    ["p-5 rounded", "p-2.5 rounded"],
    ["mb-4 border", "mb-2 border"],
    ["space-y-3 mb-4", "space-y-1.5 mb-2"],
    ["w-[400px]", "w-[200px]"],
    ["gap-3 text-[7px]", "gap-1.5 text-[7px]"],
    ["w-7 h-7", "w-3.5 h-3.5"],
  ]);
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, "utf8");
  c = c.split("width={150}").join("width={75}");
  c = c.split("height={125}").join("height={63}");
  fs.writeFileSync(fp, c);
  console.log(f + ": image dims");
}

r("beetle-sprite.tsx", [
  ["w-[344px]", "w-[172px]"],
]);

console.log("Done");
