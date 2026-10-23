/**
 * Every component and hook in src/ is compiled by the React Compiler.
 *
 * The compiler skips a function it cannot prove safe, and says so to nobody:
 * the app builds, the tests pass, and that component simply re-renders the way
 * it did before the compiler existed. Twenty functions were skipped this way
 * when the compiler was switched on — a `try … finally`, an `eslint-disable`
 * comment, a prop default that read another prop — among them the feed's web
 * card and the recipe list. This runs the compiler over every app file and
 * fails on any function it refused.
 *
 * A function that must not be compiled says so with the `'use no memo'`
 * directive and a comment giving the reason; those are reported, not failed.
 *
 * Runs from `npm run check:structure`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');

const files = execSync("git ls-files 'src/**/*.ts' 'src/**/*.tsx'; git ls-files --others --exclude-standard 'src/**/*.ts' 'src/**/*.tsx'", {
  encoding: 'utf8',
})
  .split('\n')
  .filter((file) => file && fs.existsSync(file) && !/__tests__|__mocks__|__fixtures__|test-support|\.d\.ts$/.test(file));

const failures = [];
const optedOut = [];
let compiled = 0;

for (const file of new Set(files)) {
  const source = fs.readFileSync(file, 'utf8');
  if (!/<|use[A-Z]/.test(source)) continue;
  const optsOut = source.includes("'use no memo'");
  const logEvent = (_filename, event) => {
    if (event.kind === 'CompileSuccess') compiled += 1;
    if (event.kind !== 'CompileError' && event.kind !== 'CompileSkip' && event.kind !== 'PipelineError') return;
    const detail = event.detail ?? {};
    const reason = String(detail.reason ?? detail.options?.reason ?? event.kind).split('\n')[0];
    const line = detail.loc?.start?.line ?? detail.options?.loc?.start?.line ?? event.fnLoc?.start?.line ?? '?';
    (optsOut ? optedOut : failures).push(`${file}:${line} — ${reason}`);
  };
  babel.transformSync(source, {
    filename: file,
    babelrc: false,
    configFile: false,
    presets: [['babel-preset-expo', {}]],
    plugins: [['babel-plugin-react-compiler', { target: '19', panicThreshold: 'none', logger: { logEvent } }]],
  });
}

for (const line of optedOut) console.log(`assert-react-compiler — opted out: ${line}`);
if (failures.length > 0) {
  console.error(`assert-react-compiler — ${String(failures.length)} function(s) the React Compiler skipped:\n`);
  for (const line of failures) console.error('  ' + line);
  console.error("\nFix the construct it names, or add 'use no memo' with a one-line reason (CLAUDE.md rule 8).");
  process.exit(1);
}
console.log(`assert-react-compiler — OK (${String(compiled)} functions compiled)`);
