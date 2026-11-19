import { openingRanges } from '../src/content/openingRanges';
import { openingRangeNotesRu } from '../src/content/openingRangesRu';
import { scenarios } from '../src/content/scenarios';
import { scenarioExplanationsRu } from '../src/content/scenarios/explanationsRu';

const CARD = /^[AKQJT98765432][shdc]$/;
const ROW = /^[R.]{13}$/;
const ACTION = /^(UTG|MP|CO|BTN|SB|BB) (folds|(calls|raises) \d+(\.\d+)?bb)$/;
const errors: string[] = [];

for (const [position, { grid }] of Object.entries(openingRanges)) {
  if (grid.length !== 13) errors.push(`${position} grid has ${grid.length} rows, expected 13`);
  grid.forEach((row, i) => {
    if (!ROW.test(row)) errors.push(`${position} grid row ${i} "${row}" is not 13 chars of R or .`);
  });
  if (!openingRangeNotesRu[position as keyof typeof openingRangeNotesRu]?.trim()) errors.push(`${position}: Russian note is missing`);
}

const seenIds = new Set<string>();
for (const s of scenarios) {
  if (seenIds.has(s.id)) errors.push(`duplicate scenario id ${s.id}`);
  seenIds.add(s.id);
  for (const card of s.heroCards) {
    if (!CARD.test(card)) errors.push(`${s.id}: card "${card}" does not parse`);
  }
  if (s.heroCards[0] === s.heroCards[1]) errors.push(`${s.id}: hero cards repeat (${s.heroCards[0]})`);
  if (new Set(s.options).size !== s.options.length) errors.push(`${s.id}: options repeat`);
  if (!(s.options as readonly string[]).includes(s.bestAction)) {
    errors.push(`${s.id}: bestAction "${s.bestAction}" is not in options`);
  }
  for (const line of s.actionHistory) {
    if (!ACTION.test(line)) errors.push(`${s.id}: action "${line}" does not match "<seat> folds|calls Nbb|raises Nbb"`);
  }
  if (s.explanation.trim() === '') errors.push(`${s.id}: explanation is empty`);
  if (!scenarioExplanationsRu[s.id]?.trim()) errors.push(`${s.id}: Russian explanation is missing`);
}

if (!scenarios.some((s) => s.level === 1)) errors.push('no level-1 scenario');

for (const id of Object.keys(scenarioExplanationsRu)) {
  if (!seenIds.has(id)) errors.push(`${id}: Russian explanation has no scenario`);
}

if (errors.length > 0) {
  console.error(`Content validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}

console.log(`Content OK: ${scenarios.length} scenarios`);
