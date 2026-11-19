import { loadItem, saveItem } from './storage';

const WORDS = [
  'amber', 'apple', 'arch', 'atlas', 'aunt', 'axis', 'bacon', 'badge', 'baker', 'bald', 'band', 'bank', 'barn', 'basil', 'beach',
  'bean', 'bear', 'bell', 'belt', 'bench', 'berry', 'bird', 'bison', 'blade', 'blaze', 'bloom', 'blue', 'boat', 'bolt', 'bone',
  'book', 'boot', 'brave', 'bread', 'brick', 'bridge', 'brook', 'broom', 'brush', 'cabin', 'cable', 'cake', 'calm', 'camel',
  'camp', 'candy', 'canoe', 'cape', 'card', 'cargo', 'carp', 'cedar', 'chalk', 'charm', 'chess', 'chief', 'chili', 'cider', 'city',
  'clam', 'clay', 'cliff', 'cloud', 'clove', 'coal', 'coast', 'cobra', 'cocoa', 'coin', 'comet', 'coral', 'corn', 'couch', 'crab',
  'crane', 'creek', 'crow', 'crown', 'cube', 'cup', 'curl', 'daisy', 'dawn', 'deer', 'delta', 'denim', 'desk', 'dew', 'dice',
  'dingo', 'disk', 'dock', 'dove', 'drift', 'drum', 'duck', 'dune', 'dusk', 'eagle', 'earth', 'echo', 'eel', 'elbow', 'elk', 'elm',
  'ember', 'fable', 'fawn', 'fern', 'ferry', 'field', 'fig', 'finch', 'fire', 'fjord', 'flag', 'flame', 'flint', 'flute', 'foam',
  'fog', 'forest', 'fox', 'frost', 'fudge', 'gale', 'garden', 'gecko', 'gem', 'ghost', 'giant', 'ginger', 'glade', 'glass',
  'globe', 'goat', 'gold', 'goose', 'grape', 'grass', 'gravel', 'grove', 'gull', 'hail', 'harbor', 'harp', 'hawk', 'hazel',
  'heart', 'heron', 'hill', 'honey', 'hood', 'horn', 'horse', 'husky', 'iris', 'iron', 'island', 'ivory', 'ivy', 'jade', 'jam',
  'jazz', 'jelly', 'jet', 'kayak', 'kelp', 'kettle', 'kiwi', 'koala', 'lace', 'lake', 'lamb', 'lamp', 'lark', 'lava', 'leaf',
  'lemon', 'lilac', 'lily', 'lime', 'linen', 'lion', 'llama', 'lodge', 'lotus', 'lynx', 'maple', 'marble', 'marsh', 'meadow',
  'melon', 'mesa', 'mint', 'mist', 'moon', 'moose', 'moss', 'moth', 'mule', 'navy', 'nest', 'nickel', 'noble', 'nova', 'oak',
  'oasis', 'ocean', 'olive', 'onyx', 'opal', 'orbit', 'orca', 'otter', 'owl', 'palm', 'panda', 'paper', 'peach', 'pearl', 'pecan',
  'pepper', 'perch', 'piano', 'pier', 'pine', 'plum', 'pond', 'pony', 'poppy', 'prism', 'puma', 'quail', 'quartz', 'quill', 'rain',
  'raven', 'reef', 'ridge', 'river', 'robin', 'rock', 'rose', 'ruby', 'rust', 'sage', 'salt', 'sand', 'satin', 'scarf', 'seal',
  'shell', 'silk', 'silver', 'sky', 'sloth', 'snow', 'solar', 'spark', 'spruce', 'squid', 'star', 'stone', 'storm', 'sugar', 'sun',
  'swan', 'tango', 'tea', 'tiger', 'toast', 'topaz', 'torch', 'tower', 'trail', 'tulip', 'tuna', 'valley', 'velvet', 'violet',
  'wave', 'whale', 'wheat', 'willow', 'wind', 'wolf', 'wren', 'yak', 'zebra', 'zinc',
];

const PHRASE_PATTERN = /^[a-z]+-[a-z]+-[a-z]+-\d{2}$/;

function randomInt(max: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! % max;
}

export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase();
}

export function isValidPhrase(phrase: string): boolean {
  return PHRASE_PATTERN.test(normalizePhrase(phrase));
}

export function generatePhrase(): string {
  const words = Array.from({ length: 3 }, () => WORDS[randomInt(WORDS.length)]!);
  return [...words, String(randomInt(100)).padStart(2, '0')].join('-');
}

export async function userIdFromPhrase(phrase: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizePhrase(phrase)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function loadPhrase(): string | null {
  const phrase = loadItem('phrase');
  return typeof phrase === 'string' && phrase ? phrase : null;
}

export function savePhrase(phrase: string): void {
  saveItem('phrase', normalizePhrase(phrase));
}
