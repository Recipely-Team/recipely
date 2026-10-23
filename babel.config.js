/**
 * Babel for Metro and Jest.
 *
 * Metro needs nothing beyond `babel-preset-expo`: `experiments.reactCompiler`
 * in app.json makes the preset run the React Compiler on app code. Jest calls
 * Babel without that signal, so the tests would exercise code the app never
 * ships — renders a compiled component skips would still happen under test,
 * and a Profiler count would measure the wrong program. Under Jest the
 * compiler is added here, for `src/` only, with the options the preset uses.
 */
module.exports = function babelConfig(api) {
  const isTest = api.env('test');
  return {
    presets: ['babel-preset-expo'],
    overrides: isTest
      ? [
          {
            // App code only: a test's jest.mock factories may not reference the runtime the compiler imports.
            test: (file) =>
              typeof file === 'string' &&
              file.includes('/src/') &&
              !file.includes('/node_modules/') &&
              !/\/__(tests|mocks|fixtures)__\/|\.test\.[jt]sx?$/.test(file),
            plugins: [['babel-plugin-react-compiler', { target: '19', panicThreshold: 'none' }]],
          },
        ]
      : [],
  };
};
