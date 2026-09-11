import CryptoKit
import Foundation

/// The bytes a native caller puts on the wire for `/assistant/message`, and reads back.
///
/// - Note: **Separate from the transport so it can be checked.** This file needs
///   nothing but Foundation and `Envelope`, which is what lets
///   `scripts/verify-swift-envelope.sh` compile it beside the parity harness. The
///   transport around it — the shared container, `URLSession` — cannot run there.
/// - Note: **The plaintext is `{ data: <body> }`, not the body.** The backend's
///   `decrypt-body` middleware refuses any plaintext without a `data` key, and the
///   JS client wraps before it seals for exactly that reason. The first draft of
///   this file sealed the bare body, which would have turned every headless answer
///   into a 400 that the intent then reported as "open the app".
/// - Note: **The reply is read the way `AssistantMessenger` reads it.** An empty
///   action name is no action, so an answer that only speaks is never mistaken for
///   an instruction to drive the app. An answer with neither words nor an action
///   is `nil`: Siri would otherwise show an empty dialog, where opening the app
///   at least puts the question in front of the assistant.
public enum RecipelyAssistantWire {
  /// What the assistant answered, and what it wants the app to do about it.
  public struct Reply: Sendable, Equatable {
    public let text: String
    public let action: String?
    public let arg: String?

    /// The words worth saying, or `nil` when there are none. An answer that acts
    /// arrives with empty text, and a blank Siri dialog reads as a failure.
    public var spokenText: String? {
      text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : text
    }
  }

  public static func request(message: String, languageCode: String, key: SymmetricKey) throws -> Data {
    let plain: [String: Any] = ["data": ["message": message, "languageCode": languageCode]]
    let json = String(decoding: try JSONSerialization.data(withJSONObject: plain), as: UTF8.self)
    let sealed = try Envelope.seal(json: json, key: key)
    return try JSONSerialization.data(withJSONObject: ["payload": sealed.payload, "iv": sealed.iv])
  }

  public static func reply(from data: Data, key: SymmetricKey) -> Reply? {
    guard let wire = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let payload = wire["payload"] as? String,
          let iv = wire["iv"] as? String,
          let plain = try? Envelope.open(payload: payload, iv: iv, key: key),
          let root = try? JSONSerialization.jsonObject(with: Data(plain.utf8)) as? [String: Any],
          let body = root["data"] as? [String: Any]
    else { return nil }

    let action = body["action"] as? [String: Any]
    let name = nonEmpty(action?["name"])
    let reply = Reply(
      text: body["reply"] as? String ?? "",
      action: name,
      arg: name == nil ? nil : nonEmpty(action?["arg"])
    )
    return reply.action == nil && reply.spokenText == nil ? nil : reply
  }

  private static func nonEmpty(_ value: Any?) -> String? {
    guard let string = value as? String, !string.isEmpty else { return nil }
    return string
  }
}
