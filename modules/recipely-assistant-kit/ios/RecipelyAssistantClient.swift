import Foundation

/// Asks the backend a question, from an intent, with no app running.
///
/// - Note: **The whole reason the envelope was ported to Swift.** Every request
///   under `/api/v1` travels inside an AES-256-GCM envelope, so a native caller
///   either speaks it or cannot speak at all. The bytes are built by
///   `RecipelyAssistantWire`, which the parity harness checks against the shape
///   the backend's `decrypt-body` requires.
/// - Note: **It carries the intent token, never the session JWT.** The narrow
///   token reaches the assistant endpoints and nothing else, which is what makes
///   it safe to leave in a shared container that native code reads without any
///   refresh flow of its own.
/// - Note: **Absence is an answer.** No token, no key, no base URL and no
///   network all mean the same thing to the caller: `nil`, and the intent opens
///   the app instead. They are not distinguished because there is nothing
///   different the caller could do, and a thrown error here would make Siri say
///   "something went wrong" where opening the app actually works.
/// - Note: **Fifteen seconds, not the app's ninety.** Running out of time opens
///   the app only if THIS gives up before Siri does; if Siri's own deadline came
///   first it would kill `perform` and say something went wrong instead. That
///   deadline is unmeasured, so the budget errs short: a slow answer costs a
///   trip into the app, never an error.
public enum RecipelyAssistantClient {
  private static let messagePath = "assistant/message"
  private static let timeout: TimeInterval = 15

  public static func ask(_ question: String) async -> RecipelyAssistantWire.Reply? {
    guard let base = RecipelyAssistantStore.apiBaseUrl,
          let keyHex = RecipelyAssistantStore.envelopeKeyHex,
          let token = RecipelyAssistantStore.token,
          let key = try? Envelope.key(fromHex: keyHex)
    else { return nil }

    let language = RecipelyAssistantStore.languageCode
    guard let body = try? RecipelyAssistantWire.request(message: question, languageCode: language, key: key)
    else { return nil }

    var request = URLRequest(url: base.appendingPathComponent(messagePath))
    request.httpMethod = "POST"
    request.timeoutInterval = timeout
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue(language, forHTTPHeaderField: "Accept-Language")
    request.httpBody = body

    guard let (data, response) = try? await URLSession.shared.data(for: request),
          let http = response as? HTTPURLResponse,
          (200..<300).contains(http.statusCode)
    else { return nil }

    return RecipelyAssistantWire.reply(from: data, key: key)
  }
}
