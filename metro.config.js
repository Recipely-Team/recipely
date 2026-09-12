const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Page co-location under src/presentation/app/ (see architecture.md): expo-router
// scans the app dir with a catch-all require.context, which would turn every
// co-located body/items/hooks/model/test file into a broken route. We swap the
// router's context module for our own, whose regex only admits real route
// files (index.tsx, _layout.tsx, +special, [param]).
const routeContext = path.resolve(__dirname, 'src/presentation/navigation/route-context.js');

// The client entry imports the context as `expo-router/_ctx`, but the static
// web export (getServerManifest / renderStaticContent) imports the SAME module
// via the relative specifier `../../_ctx` from expo-router/build/static/*.
// Both must resolve to our custom context, or the server renders against the
// stock catch-all route set (co-located files become pages, hydration
// mismatches on every route).
const isRouterCtxRequest = (context, moduleName) =>
  moduleName === 'expo-router/_ctx' ||
  (moduleName === '../../_ctx' &&
    context.originModulePath.includes(`expo-router${path.sep}build${path.sep}`));

// The library packages resolve to their SOURCE while the app is developed, so
// editing one is visible on the next refresh. Their package.json points `main`
// at `dist/`, which is what an installer downloads from npm — without this, the
// app would bundle a build artifact and a change to a package would look like
// it did nothing until someone remembered to rebuild.
//
// Exact matches only: the deep specifiers into a package's own `src/` (the
// controller fixtures) already resolve through the workspace symlink, and
// rewriting those would point them at the index instead.
const PACKAGE_ENTRY = /^@live-assistant\/([a-z-]+)$/;
const packageSource = (moduleName) => {
  const match = PACKAGE_ENTRY.exec(moduleName);
  return match === null
    ? null
    : path.resolve(__dirname, 'packages', `assistant-${match[1]}`, 'src/index.ts');
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isRouterCtxRequest(context, moduleName)) {
    return context.resolveRequest(context, routeContext, platform);
  }
  const source = packageSource(moduleName);
  if (source !== null) {
    return context.resolveRequest(context, source, platform);
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
