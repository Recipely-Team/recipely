/**
 * Writes expo-router's typed-routes declarations without starting Metro.
 *
 * @remarks
 * - **Why.** `typedRoutes` makes `Href` a union of the real routes, but Expo
 *   only writes `.expo/types/router.d.ts` while a dev server or export runs.
 *   A fresh checkout (CI) had none, so `Href` there was a plain string and
 *   type-aware lint judged the `as Href` casts differently from a developer's
 *   machine: green locally, red in CI.
 * - **How.** Calls the same generator `@expo/cli` uses, through the copy that
 *   ships with the installed `expo`, so it always matches the SDK.
 * - Runs as `prelint`, so every `npm run lint` sees the same types.
 *
 * Usage: node scripts/generate-typed-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const appRoot = path.join(root, 'src/presentation/app');
process.env.EXPO_ROUTER_APP_ROOT = appRoot;

const fromExpo = createRequire(createRequire(path.join(root, 'package.json')).resolve('expo/package.json'));
const fromCli = createRequire(fromExpo.resolve('@expo/cli/package.json'));
const { requireContext } = fromCli('expo-router/internal/testing');
const { EXPO_ROUTER_CTX_IGNORE } = fromCli('expo-router/_ctx-shared');
const { getTypedRoutesDeclarationFile } = fromCli('@expo/router-server/build/typed-routes/generate');

const declarations = getTypedRoutesDeclarationFile(requireContext(appRoot, true, EXPO_ROUTER_CTX_IGNORE), {});
if (!declarations) {
  console.error('generate-typed-routes: the generator returned nothing');
  process.exit(1);
}

const typesDir = path.join(root, '.expo/types');
fs.mkdirSync(typesDir, { recursive: true });
fs.writeFileSync(path.join(typesDir, 'router.d.ts'), declarations);
const envFile = path.join(root, 'expo-env.d.ts');
if (!fs.existsSync(envFile)) fs.writeFileSync(envFile, '/// <reference types="expo/types" />\n');
console.log('generate-typed-routes: wrote .expo/types/router.d.ts');
