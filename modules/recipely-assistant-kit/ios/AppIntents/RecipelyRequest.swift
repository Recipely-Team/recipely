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
    RecipelyAssistantStore.enqueue([
      "id": id,
      "invocationId": UUID().uuidString,
      "action": action as Any,
      "arg": arg as Any,
      "at": Date().timeIntervalSince1970 * 1000,
    ])
  }
}
