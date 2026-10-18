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

// @live-assistant/audio maps its microphone and player to their `.web.js`
// twins through package.json `browser`, and Metro reads `browser` on iOS and
// Android too. The phones shipped the WEB microphone: getUserMedia does not
// exist there, so the assistant reported a denied microphone without ever
// asking, and played nothing. Native requests in or into that package resolve
// without `browser`; the web keeps it. Guarded by scripts/assert-native-audio.mjs.
// The library maps them back itself since 0.3.5; this stays as a second guard.
const NATIVE_MAIN_FIELDS = ['react-native', 'main'];
const isAssistantAudioRequest = (context, moduleName) =>
  moduleName.startsWith('@live-assistant/audio') ||
  context.originModulePath.includes(`@live-assistant${path.sep}audio${path.sep}`);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isRouterCtxRequest(context, moduleName)) {
    return context.resolveRequest(context, routeContext, platform);
  }
  if (platform !== 'web' && isAssistantAudioRequest(context, moduleName)) {
    return context.resolveRequest({ ...context, mainFields: NATIVE_MAIN_FIELDS }, moduleName, platform);
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
