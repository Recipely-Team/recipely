import CoreSpotlight
import ExpoModulesCore

/// Opens the recipe behind a Spotlight result.
///
/// - Note: **Why it re-opens a URL instead of routing itself.** A Spotlight tap
///   arrives as `CSSearchableItemActionType`, which nothing in the JavaScript
///   half can see: React Native's linking only speaks URLs. Handing the app its
///   own scheme puts the request back on the one road every other deep link
///   already travels — `expo-linking`'s subscriber, `Linking.getInitialURL`, the
///   router's `/recipes/[recipeId]`. Posting into `expo-linking`'s own registry
///   would be shorter and would bind this module to another module's internals.
/// - Note: **The scheme is read from the bundle**, so the dev build opens
///   `recipely-dev://` and production `recipely://` without either being named
///   here. A build with no scheme at all does nothing rather than guessing.
public class RecipelySpotlightSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([any UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    guard #available(iOS 15.1, *),
          userActivity.activityType == CSSearchableItemActionType,
          let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
          let recipeId = RecipelySpotlightIndex.recipeId(fromSearchableItemIdentifier: identifier),
          let scheme = Self.firstURLScheme(),
          let url = RecipelySpotlightIndex.recipeURL(recipeId: recipeId, scheme: scheme)
    else {
      return false
    }

    application.open(url, options: [:], completionHandler: nil)
    return true
  }

  /// The first scheme the app declares: `recipely` in production, `recipely-dev` in the dev build.
  static func firstURLScheme() -> String? {
    guard let types = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]],
          let schemes = types.first?["CFBundleURLSchemes"] as? [String]
    else {
      return nil
    }
    return schemes.first
  }
}
