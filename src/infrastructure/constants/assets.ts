// Central registry of bundled binary assets (sounds, images used from code).
// Consumers import these constants instead of writing require() paths; the
// `@assets/*` alias (tsconfig paths, resolved by Metro and mapped in Jest)
// keeps the paths anchored at the repo root.
export const ALARM_SOUND_ASSET: number = require('@assets/sounds/alarm.mp3') as number;
export const APP_ICON_ASSET: number = require('@assets/images/icon.png') as number;
