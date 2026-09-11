import Foundation
internal import RecipelyAssistantKit

/// The one place an intent turns itself into a request the app can run.
///
/// - Note: **Eleven intents, one spelling.** Each of them needs the same four
///   keys in the same shapes, and each writing its own dictionary literal is how
///   a renamed key stops working in ten places and keeps working in the
///   eleventh. `check:structure` rule W reads the literals that remain here and
///   refuses any word the app's vocabulary does not contain.
/// - Note: **An intent never performs the action itself.** It records what was
///   asked and lets the app do it, because the actions drive screens — a draft
///   field, a scroll position, a confirmation sheet — and none of that exists in
///   the process Siri launched. The queue survives until the app drains it, so
///   an intent that runs while the app is closed is not lost.
enum RecipelyRequest {
  /// Records one request for the app to run when it next has a screen.
  ///
  /// - Parameters:
  ///   - id: the catalogue entry, which is what the app logs and reasons about.
  ///   - action: the assistant action word, or `nil` for the open-ended entry
  ///     where the assistant itself decides what to do.
  ///   - arg: the single argument the registry's handlers take.
  static func enqueue(id: String, action: String?, arg: String?) {
    // An absent value is an ABSENT KEY, never a null one. `UserDefaults` stores
    // property lists only, and Swift bridges `Optional.none as Any` to
    // `NSNull` — which is not a property-list type, so `set(_:forKey:)` raises
    // `NSInvalidArgumentException` and the process dies. Two intents pass a nil:
    // "Ask Recipely", the first of the ten phrases, and the timer.
    var request: [String: Any] = [
      "id": id,
      "invocationId": UUID().uuidString,
      "at": Date().timeIntervalSince1970 * 1000,
    ]
    if let action { request["action"] = action }
    if let arg { request["arg"] = arg }
    RecipelyAssistantStore.enqueue(request)
  }
}
