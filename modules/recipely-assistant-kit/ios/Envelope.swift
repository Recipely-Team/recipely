import CryptoKit
import Foundation

/// The AES-256-GCM envelope every `/api/v1` request travels inside, implemented
/// for the path where JavaScript does not exist.
///
/// - Note: **Why a second implementation at all.** An intent that answers
///   without opening the app runs with no React Native bridge (see
///   `docs/os-assistants-plan.md` finding D2), so it cannot borrow
///   `aes-envelope.ts`. The backend will not accept anything else, so the
///   format has to be spoken natively.
/// - Note: **Parity is pinned by a fixture, not by reading both files.**
///   `__fixtures__/aes-gcm-vectors.json` holds bytes produced by OpenSSL; this
///   implementation, the JS one and the Kotlin one are each checked against it.
///   Two implementations of a cipher that were only ever reviewed side by side
///   agree right up to the first multibyte character.
/// - Note: **UTF-8 is part of the contract.** The plaintext is JSON text, and
///   the ASCII vector cannot tell a UTF-8 implementation from a UTF-16 one —
///   which is exactly why the fixture carries a Turkish one.
public enum Envelope {
  /// AES-256 takes a 32-byte key; the "256" is bits.
  public static let keyBytes = 32
  /// GCM's standard nonce length. The backend writes 12 and reads 12.
  public static let ivBytes = 12
  /// GCM tag length, appended to the ciphertext rather than carried beside it.
  public static let authTagBytes = 16

  /// Lowercase and uppercase only — not `Character.isHexDigit`, which also admits
  /// full-width and other Unicode digit forms.
  private static let hexAlphabet = Set("0123456789abcdefABCDEF")

  public enum Failure: Error, Equatable {
    case badKeyLength
    case badIvLength
    case payloadShorterThanTag
    case notBase64
    case authenticationFailed
    case notUtf8
  }

  /// Parses the 64-character hex form the app and CI both carry the key in.
  ///
  /// - Note: The alphabet is checked, not only the length. `UInt8("+a", radix: 16)`
  ///   succeeds — Swift's integer initialisers accept a leading sign — so a length
  ///   check alone accepted `"+a"` repeated 32 times as a key, silently producing
  ///   bytes nobody typed. Kotlin's `toIntOrNull(16)` had the same hole pointing the
  ///   other way (`"-1"` became `0xFF`) and the JS half refused both: three parsers
  ///   with three answers, for a value that must be one key everywhere.
  public static func key(fromHex hex: String) throws -> SymmetricKey {
    guard hex.count == keyBytes * 2, hex.allSatisfy({ hexAlphabet.contains($0) }) else {
      throw Failure.badKeyLength
    }
    var bytes = Data(capacity: keyBytes)
    var index = hex.startIndex
    while index < hex.endIndex {
      let next = hex.index(index, offsetBy: 2)
      guard let byte = UInt8(hex[index ..< next], radix: 16) else { throw Failure.badKeyLength }
      bytes.append(byte)
      index = next
    }
    return SymmetricKey(data: bytes)
  }

  /// Seals JSON text, drawing a fresh nonce per call — reusing one under the
  /// same key is the mistake GCM never recovers from.
  public static func seal(json: String, key: SymmetricKey) throws -> (payload: String, iv: String) {
    try seal(json: json, key: key, nonce: AES.GCM.Nonce())
  }

  /// The same seal with the nonce supplied.
  ///
  /// - Note: Not `public`, because a caller who chooses the nonce can repeat it,
  ///   and one repeated nonce under a fixed key is enough to lose the integrity
  ///   guarantee. The parity harness needs it: a supplied nonce is what makes
  ///   the sealed bytes comparable to the fixture byte for byte, which checks
  ///   the ENCRYPT direction rather than a round trip — and a round trip passes
  ///   happily against two implementations of the same mistake.
  static func seal(json: String, key: SymmetricKey, nonce: AES.GCM.Nonce) throws -> (payload: String, iv: String) {
    guard let plaintext = json.data(using: .utf8) else { throw Failure.notUtf8 }
    let box = try AES.GCM.seal(plaintext, using: key, nonce: nonce)
    // `combined` would prepend the nonce; the wire format carries it in its own
    // field, so the payload is ciphertext || tag and nothing else.
    return (
      payload: (box.ciphertext + box.tag).base64EncodedString(),
      iv: Data(box.nonce).base64EncodedString()
    )
  }

  /// Opens a payload the backend sealed and returns the JSON text inside.
  public static func open(payload: String, iv: String, key: SymmetricKey) throws -> String {
    guard let ivData = Data(base64Encoded: iv), let sealed = Data(base64Encoded: payload) else {
      throw Failure.notBase64
    }
    // Both lengths are checked before the cipher sees them: a short nonce is
    // silently padded by some implementations, which turns a malformed message
    // into a plausible-looking decryption failure much further downstream.
    guard ivData.count == ivBytes else { throw Failure.badIvLength }
    guard sealed.count > authTagBytes else { throw Failure.payloadShorterThanTag }

    let tagAt = sealed.count - authTagBytes
    do {
      let box = try AES.GCM.SealedBox(
        nonce: try AES.GCM.Nonce(data: ivData),
        ciphertext: sealed.prefix(tagAt),
        tag: sealed.suffix(authTagBytes)
      )
      let plaintext = try AES.GCM.open(box, using: key)
      guard let json = String(data: plaintext, encoding: .utf8) else { throw Failure.notUtf8 }
      return json
    } catch let failure as Failure {
      throw failure
    } catch {
      // CryptoKit reports a tag mismatch and a malformed box the same way, and
      // the caller can act on neither differently: the answer is "do not trust
      // these bytes".
      throw Failure.authenticationFailed
    }
  }
}
