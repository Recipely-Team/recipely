import fs from 'node:fs';
import path from 'node:path';

/**
 * The custom route context, read as text.
 *
 * `require.context` does not exist under Jest, so importing the module would
 * throw before the regex could be looked at. The regex is the whole contract,
 * and it is a literal — reading it back out of the source is enough.
 */
const contextSource = (): string =>
  fs.readFileSync(
    path.join(process.cwd(), 'src/presentation/navigation/route-context.js'),
    'utf8',
  );

const admittedFiles = (): RegExp => {
  const literal = /require\.context\([\s\S]*?,\s*(?:true|false),\s*(\/.*\/)[gimsuy]*\s*,/.exec(
    contextSource(),
  )?.[1];
  if (literal === undefined) throw new Error('route-context.js has no require.context regex');
  return new RegExp(literal.slice(1, -1));
};

describe('the custom expo-router route context', () => {
  // The symptom: sharing a reel from Instagram on iOS opened the app on
  // "Unmatched Route — recipely-dev://dataUrl=recipely-devShareKey?nonce=…".
  //
  // `+native-intent.tsx` exists precisely to rewrite that URL, and it was
  // written and correct the whole time. It never ran: this context excluded it
  // (copying the exclusion list from expo-router's WEB context), and
  // expo-router finds `redirectSystemPath` by looking the file up in the very
  // context we replaced — `getLinkingConfig` does
  // `ctx.keys().find(k => k.match(/^\.\/\+native-intent\.[tj]sx?$/))`. A hidden
  // file is not a missing route here, it is a missing hook.
  it('admits +native-intent, which carries redirectSystemPath', () => {
    expect(admittedFiles().test('./+native-intent.tsx')).toBe(true);
  });

  it('admits the files that are real routes', () => {
    const admits = admittedFiles();
    for (const key of [
      './index.tsx',
      './_layout.tsx',
      './recipes/index.tsx',
      './recipes/[recipeId]/index.tsx',
      './+not-found.tsx',
    ]) {
      expect(admits.test(key)).toBe(true);
    }
  });

  // The reason this context exists at all: page code sits NEXT TO its page, and
  // the stock catch-all context would turn every one of those files into a
  // broken route.
  it('hides co-located page code', () => {
    const admits = admittedFiles();
    for (const key of [
      './create-recipe/body/prompt-phase.tsx',
      './import-recipe/hooks/use-import-recipe.ts',
      './recipes/model/recipe-sort-type.ts',
      './my-recipes/__tests__/my-recipes.test.tsx',
    ]) {
      expect(admits.test(key)).toBe(false);
    }
  });

  // The symptom: the app died on an emulator that walked its routes —
  // "TypeError: Cannot read property 'origin' of undefined" at SystemInfo,
  // fatal, reported by Crashlytics against 1.1.0 (863) and reachable since
  // 1.0.45. SystemInfo belongs to expo-router's own development sitemap, which
  // the router appends whenever this context supplies no `_sitemap` of its
  // own; that screen reads `window.location.origin`, and native has no
  // `window.location`. Hiding the file here does not hide a route, it hands
  // the route back to the screen that crashes.
  it('admits _sitemap, so our redirect replaces the crashing dev screen', () => {
    expect(admittedFiles().test('./_sitemap.tsx')).toBe(true);
  });

  // `+html` is the web export's document shell, and upstream excludes it from
  // every platform context. Unlike `+native-intent`, nothing reads it back.
  it('still hides +html', () => {
    expect(admittedFiles().test('./+html.tsx')).toBe(false);
  });
});
