// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const oneDeclarationPerFile = require('./eslint-rules/one-declaration-per-file');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'public/**', 'eslint-rules/**'],
  },
  {
    // Repo standard (CLAUDE.md §Mandatory coding standards #1): one top-level
    // class / interface / type alias / enum per file.
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      recipely: {
        rules: { 'one-declaration-per-file': oneDeclarationPerFile },
      },
    },
    rules: {
      'recipely/one-declaration-per-file': 'error',
    },
  },
  {
    // The React Compiler inference rules that eslint-config-expo 57 newly turns
    // on. They are off until the compiler itself is on (app.json `experiments`
    // has only `typedRoutes`), because without it they report 244 findings and
    // the two largest groups are false positives about libraries the compiler
    // does not model:
    //
    // - `refs` (206) — the recipe detail view-model exposes `scrollViewRef`, so
    //   reading `vm.scrollViewRef.current` taints `vm` and every later `vm.x`
    //   read is reported as a ref access during render. One design decision,
    //   eighty errors.
    // - `immutability` (11) — `scale.value = withTiming(...)` inside an
    //   `onPressIn` is how Reanimated shared values are written. The rule reads
    //   them as refs and forbids the assignment the library documents.
    //
    // That leaves 27, all read one by one and all deliberate: 14
    // `set-state-in-effect` (external-state syncs, each behind an early return
    // — the SSR hydration guard in `useIsHydrated`, the per-URI reset in
    // `RecipeImage`, and so on), 10 `preserve-manual-memoization` (which only
    // says "Compilation Skipped" and means nothing while the compiler is off),
    // 2 `globals` and 1 `purity` — and those last three are scoped rather than
    // switched off, below. The enumeration is in PR #452; the COUNT is the
    // load-bearing part, because nothing new will ever be reported under a rule
    // that is off, so a reader can only tell whether this list has grown.
    // Turning the compiler on is its own piece of work, and these rules are
    // worth having then — that is when the 244 get answered rather than muted.
    //
    // `rules-of-hooks` and `exhaustive-deps` predate the compiler, were already
    // enforced here, and stay on.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    // `globals` and `purity` are narrower than the other four, so they are
    // scoped rather than switched off: both findings under `globals` are test
    // harnesses reassigning a captured `rerender`, and `purity` has exactly ONE
    // site, carrying its own inline disable. Left on everywhere else, they still
    // catch the next Math.random() in a render or the next module-level write.
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'react-hooks/globals': 'off',
    },
  },
  {
    // Test scaffolding (local stub configs, harness option interfaces) is not
    // part of the layered architecture; declaration files carry no runtime code.
    files: [
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.d.ts',
    ],
    rules: {
      'recipely/one-declaration-per-file': 'off',
    },
  },
]);
