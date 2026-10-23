// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const oneDeclarationPerFile = require('./eslint-rules/one-declaration-per-file');

// Expo inlines EXPO_PUBLIC_* variables only when read with a dot (`process.env.EXPO_PUBLIC_X`); a
// bracket read compiles and ships undefined. They are declared in process-env.d.ts, so the dot form type-checks.
const EXPO_PUBLIC_BRACKET_READ = {
  selector:
    "MemberExpression[computed=true][object.type='MemberExpression'][object.object.name='process'][object.property.name='env'][property.value=/^EXPO_PUBLIC_/]",
  message: 'Read EXPO_PUBLIC_* with a dot (process.env.EXPO_PUBLIC_X): Expo does not inline bracket reads.',
};

const VECTOR_ICONS_ROOT = {
  name: '@expo/vector-icons',
  message: "Import the family's own path, e.g. '@expo/vector-icons/Ionicons' — the root index bundles every icon font.",
};

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
    files: ['*.ts'],
    rules: { 'no-restricted-syntax': ['error', EXPO_PUBLIC_BRACKET_READ] },
  },
  {
    // An assistant action's failure reason is a vocabulary the model reads and
    // the app branches on (AssistantActionError / DiaryArgError); spelled as a
    // string at a call site, a typo was a silently different reason. Tests may
    // still assert the wire value.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/__tests__/**', '**/__fixtures__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        EXPO_PUBLIC_BRACKET_READ,
        {
          selector: "Property[key.name='error'] > Literal[value=/^[a-z]+(_[a-z]+)*$/]",
          message: 'Use AssistantActionError.* (or the feature vocabulary) instead of a string literal for an error reason.',
        },
      ],
    },
  },
  {
    // Rule 5: a number in code is a named value. Literals live only where values
    // are DEFINED — theme tokens, constants modules, a page's model/, and files
    // that are themselves a named table (*-metrics, *-sizes, *-geometry,
    // *-limits, *-constants, *-defaults, *-animation). Everywhere else reads
    // ValueConstants (zero / one / two / three / minusOne / percent) or a name.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: [
      '**/__tests__/**',
      '**/__fixtures__/**',
      '**/__mocks__/**',
      'src/presentation/i18n/locales/**',
      'src/presentation/base/theme/**',
      'src/core/constants/**',
      'src/infrastructure/constants/**',
      'src/presentation/base/constants/**',
      '**/model/**',
      '**/*-metrics.ts',
      '**/*-sizes.ts',
      '**/*-geometry.ts',
      '**/*-limits.ts',
      '**/*-constants.ts',
      '**/*-defaults.ts',
      '**/*-animation.ts',
    ],
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [],
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },
  {
    // Icon fonts are bundled per family IMPORTED, not per glyph used: the root
    // `@expo/vector-icons` index pulls in every family, so importing Ionicons
    // from it shipped all 19 fonts (4.1 MB in the iOS build; 0.4 MB are used).
    // Import the family from its own path: `@expo/vector-icons/Ionicons`.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', { paths: [VECTOR_ICONS_ROOT] }],
    },
  },
  {
    // The language is state. A component, hook or text helper that reads it
    // from the global `t()` during render is cached by the React Compiler on
    // its other inputs and keeps the old language after a switch. Components
    // and hooks read `useTranslations()`; helpers take the catalogue as their
    // first parameter. Only code that runs at event time — toasts, alerts, the
    // alarm notifications, the class error boundary — reads the global.
    files: ['src/presentation/**/*.ts', 'src/presentation/**/*.tsx'],
    ignores: [
      '**/__tests__/**',
      '**/__mocks__/**',
      'src/presentation/base/test-support/**',
      'src/presentation/i18n/**',
      'src/presentation/base/feedback/show-toast.ts',
      'src/presentation/base/feedback/photo-pick-feedback.ts',
      'src/presentation/base/hooks/recipes/owner-status-toast.ts',
      'src/presentation/base/timers/timer-controls.ts',
      'src/presentation/base/utils/ask-pick-source.ts',
      'src/presentation/base/widgets/feedback/app-error-boundary.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            VECTOR_ICONS_ROOT,
            ...['@presentation/i18n', '@presentation/i18n/i18n'].map((name) => ({
              name,
              importNames: ['t'],
              message: 'Read text with useTranslations() in a component or hook, or take the catalogue as a parameter in a helper.',
            })),
          ],
        },
      ],
    },
  },
  {
    // The React Compiler's rules (`refs`, `immutability`, `set-state-in-effect`,
    // `preserve-manual-memoization`, `purity`, `globals`, …) are ON everywhere in
    // src/: the compiler skips any component they would flag, so a finding is a
    // component left unoptimised. Tests are the exception below — a harness that
    // counts renders or captures `rerender` writes outside the component on purpose.
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'react-hooks/globals': 'off',
      // A render-count probe increments a counter from inside a component on purpose.
      'react-hooks/immutability': 'off',
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
