// The app's entry point, and the ONLY reason it exists is the line order below.
//
// `package.json` used to point `main` straight at `expo-router/entry`. Crash
// reporting was then installed from inside `AppBootstrap`'s effect — after the
// router had mounted and the tree had rendered once — so anything that threw
// before that first render went to React Native's default handler and reached
// Firebase as nothing at all. This is the same idea as wrapping `runApp` in
// `runZonedGuarded` in a Flutter `main()`: the guard goes on before the app
// does, not somewhere inside it.
//
// Everything else stays where it was; `expo-router/entry` is still what starts
// the app on the next line.
const { installCrashHandlers } = require('./src/infrastructure/firebase/install-crash-handlers');

installCrashHandlers();

require('expo-router/entry');
