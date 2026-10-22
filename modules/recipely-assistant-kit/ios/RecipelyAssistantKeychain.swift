import Foundation
import Security

/// The assistant's intent token, kept in the Keychain.
///
/// - Note: **Why not the App Group `UserDefaults` it used to live in.** That
///   container is a plain plist, included in device backups and readable from
///   one. A Keychain item marked `AfterFirstUnlockThisDeviceOnly` never leaves
///   the phone in a backup, and is still readable when Siri runs an intent on a
///   locked phone that has been unlocked once since boot.
/// - Note: **No access group.** App Intents run in the app's own process, so
///   the app's default Keychain group is the one they read; no entitlement is
///   needed. The share extension never reads the token.
enum RecipelyAssistantKeychain {
  private static let service = "net.recipely.assistant"
  private static let account = "intent-token"

  private static var baseQuery: [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
    ]
  }

  static func read() -> String? {
    var query = baseQuery
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
          let data = item as? Data
    else { return nil }
    return String(data: data, encoding: .utf8)
  }

  /// Replaces the stored token; `nil` deletes it.
  @discardableResult
  static func write(_ token: String?) -> Bool {
    SecItemDelete(baseQuery as CFDictionary)
    guard let token, let data = token.data(using: .utf8) else { return true }
    var attributes = baseQuery
    attributes[kSecValueData as String] = data
    attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    return SecItemAdd(attributes as CFDictionary, nil) == errSecSuccess
  }
}
