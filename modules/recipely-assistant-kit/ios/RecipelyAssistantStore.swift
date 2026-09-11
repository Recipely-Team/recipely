import Foundation

/// The one place the app and its App Intents exchange state.
///
/// - Note: **Why a shared container and not a network call.** An intent that
///   resolves "open the köfte recipe" runs before the app exists — no session,
///   no store, often no network. Whatever the user can name out loud has to be
///   on disk already, so the app writes its catalogue here whenever it changes
///   and the intent only ever reads.
/// - Note: **The App Group identifier is not compiled in.** There are two
///   variants with two bundle identifiers, and a constant here would have sent
///   the dev build's intents into the production container. The plugin writes
///   the variant's group into `Info.plist` and this reads it back, which is the
///   same trick `app.config.ts` already plays for the Google URL scheme.
/// - Note: **The queue is not consumed by reading it.** JavaScript removes an
///   entry once it has actually dispatched the action. A read that drained the
///   queue would lose the request whenever the app was killed in between —
///   which, for an app launched by Siri and then swiped away, is common.
public enum RecipelyAssistantStore {
  private static let appGroupInfoKey = "RecipelyAssistantAppGroup"
  private static let apiBaseUrlInfoKey = "RecipelyAssistantApiBaseUrl"
  private static let envelopeKeyInfoKey = "RecipelyAssistantEnvelopeKey"
  private static let queueKey = "recipely.assistant.invocationQueue"
  private static let entityKeyPrefix = "recipely.assistant.entities."
  private static let tokenKey = "recipely.assistant.token"
  private static let languageKey = "recipely.assistant.language"

  /// Newer requests are dropped rather than growing without bound: an intent
  /// queue is a to-do list for the next launch, not a history.
  private static let queueLimit = 16

  public static var appGroupIdentifier: String? {
    Bundle.main.object(forInfoDictionaryKey: appGroupInfoKey) as? String
  }

  /// The envelope key, or `nil` when this build was made without one.
  ///
  /// - Note: There is deliberately no fallback. A wrong key and a missing key
  ///   look identical to a caller that defaults, and the symptom would be every
  ///   headless request failing its auth tag while the code blames the network.
  ///   `nil` means "answer by opening the app" — worse for the user, and honest.
  public static var envelopeKeyHex: String? {
    guard let hex = Bundle.main.object(forInfoDictionaryKey: envelopeKeyInfoKey) as? String,
          hex.count == Envelope.keyBytes * 2
    else { return nil }
    return hex
  }

  /// Which backend the intents talk to. Written per variant at prebuild, because
  /// an intent runs with no JavaScript and cannot be told at runtime.
  public static var apiBaseUrl: URL? {
    guard let raw = Bundle.main.object(forInfoDictionaryKey: apiBaseUrlInfoKey) as? String else {
      return nil
    }
    return URL(string: raw)
  }

  public static var defaults: UserDefaults? {
    guard let identifier = appGroupIdentifier else { return nil }
    return UserDefaults(suiteName: identifier)
  }

  // MARK: - Invocation queue

  public static func enqueue(_ invocation: [String: Any]) {
    guard let defaults else { return }
    var queue = defaults.array(forKey: queueKey) as? [[String: Any]] ?? []
    queue.append(invocation)
    if queue.count > queueLimit {
      queue.removeFirst(queue.count - queueLimit)
    }
    defaults.set(queue, forKey: queueKey)
  }

  public static func pendingInvocations() -> [[String: Any]] {
    defaults?.array(forKey: queueKey) as? [[String: Any]] ?? []
  }

  public static func removeInvocation(invocationId: String) {
    guard let defaults else { return }
    let queue = pendingInvocations().filter { $0["invocationId"] as? String != invocationId }
    defaults.set(queue, forKey: queueKey)
  }

  public static func clearInvocations() {
    defaults?.removeObject(forKey: queueKey)
  }

  // MARK: - Entity catalogue

  public static func setEntities(kind: String, entries: [[String: Any]]) {
    defaults?.set(entries, forKey: entityKeyPrefix + kind)
  }

  public static func entities(kind: String) -> [[String: Any]] {
    defaults?.array(forKey: entityKeyPrefix + kind) as? [[String: Any]] ?? []
  }

  // MARK: - Credentials

  /// - Note: This is a scoped assistant token, never the app's session JWT, and
  ///   that is what makes a shared-container write acceptable: the blast radius
  ///   of the container being read is the assistant endpoints, not the account.
  public static func setCredentials(token: String?, languageCode: String) {
    guard let defaults else { return }
    if let token {
      defaults.set(token, forKey: tokenKey)
    } else {
      defaults.removeObject(forKey: tokenKey)
    }
    defaults.set(languageCode, forKey: languageKey)
  }

  public static var token: String? { defaults?.string(forKey: tokenKey) }

  public static var languageCode: String { defaults?.string(forKey: languageKey) ?? "en" }
}
