/**
 * Fails when iOS or Android would resolve @live-assistant/audio through its
 * package.json `browser` field.
 *
 * That field swaps the microphone and the player for their `.web.js` twins, and
 * Metro reads it on the phones too. The released apps shipped the web
 * microphone: it asked no permission, reported "Recipely needs the microphone"
 * even with access granted, and played nothing. `metro.config.js` resolves that
 * package without `browser` on native; this proves it still does, and that the
 * web still gets its own build.
 *
 * Usage: node scripts/assert-native-audio.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const config = require('../metro.config.js');

const WEB_ONLY_FIELD = 'browser';
const origin = path.resolve('src/application/di/register.ts');

const fieldsFor = (moduleName, platform, originModulePath = origin) => {
  let seen = null;
  const context = {
    originModulePath,
    mainFields: ['react-native', WEB_ONLY_FIELD, 'main'],
    resolveRequest: (ctx) => {
      seen = ctx.mainFields;
      return { type: 'empty' };
    },
  };
  config.resolver.resolveRequest(context, moduleName, platform);
  return seen ?? [];
};

const inside = path.resolve('node_modules/@live-assistant/audio/dist/index.js');
const failures = [];
for (const platform of ['ios', 'android']) {
  if (fieldsFor('@live-assistant/audio', platform).includes(WEB_ONLY_FIELD)) {
    failures.push(`${platform}: '@live-assistant/audio' resolves through "browser"`);
  }
  if (fieldsFor('./microphone', platform, inside).includes(WEB_ONLY_FIELD)) {
    failures.push(`${platform}: its './microphone' resolves through "browser" — the web microphone`);
  }
}
if (!fieldsFor('./microphone', 'web', inside).includes(WEB_ONLY_FIELD)) {
  failures.push(`web: './microphone' no longer resolves through "browser" — the web would get the native one`);
}

if (failures.length > 0) {
  console.error(`assert-native-audio — ${String(failures.length)} problem(s):\n  · ${failures.join('\n  · ')}`);
  process.exit(1);
}
console.log('assert-native-audio: phones get the native microphone and player');
