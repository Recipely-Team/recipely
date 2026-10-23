/**
 * The tests run the program the app ships: compiled by the React Compiler.
 *
 * Metro compiles app code because app.json turns `experiments.reactCompiler`
 * on; Jest only does because `babel.config.js` adds the plugin under test. If
 * that override ever stopped matching, every render-count test would go on
 * passing while measuring code no user runs — so this checks the transform
 * itself, on a component and on a test file.
 */
import { transformFileSync } from '@babel/core';
import path from 'node:path';

const root = path.resolve(__dirname, '../../../..');

/** The compiled module importing the compiler's memo-cache runtime. */
const USES_COMPILER_RUNTIME = /require\("react\/compiler-runtime"\)/;

const compiled = (file: string): string =>
  transformFileSync(path.join(root, file), { cwd: root, envName: 'test', babelrc: false, configFile: path.join(root, 'babel.config.js') })?.code ?? '';

it('compiles app components with the React Compiler under Jest', () => {
  expect(compiled('src/presentation/base/widgets/cards/web-recipe-card.tsx')).toMatch(USES_COMPILER_RUNTIME);
});

it('leaves test files uncompiled, so jest.mock factories keep their hoisting rules', () => {
  expect(compiled('src/presentation/bootstrap/__tests__/react-compiler-in-tests.test.ts')).not.toMatch(USES_COMPILER_RUNTIME);
});
