package net.recipely.assistantkit

import android.util.Base64
import java.security.GeneralSecurityException
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * The AES-256-GCM envelope every `/api/v1` request travels inside, for the path
 * where JavaScript does not exist.
 *
 * The Android counterpart of `Envelope.swift`, deliberately the same shape and
 * the same refusals. A shortcut or an AppFunction can answer without the app
 * being launched, so there is no bridge to borrow `aes-envelope.ts` from; the
 * backend accepts no other format, so the format is spoken natively.
 *
 * Parity is pinned by `__fixtures__/aes-gcm-vectors.json` (bytes from OpenSSL),
 * not by reading the three implementations side by side — they agree until the
 * first multibyte character, which is why the fixture carries a Turkish one.
 *
 * Two shapes, on purpose:
 * - the `ByteArray` half is the cipher, and it touches no Android API, so a
 *   plain JVM unit test can drive it. `android.util.Base64` throws the
 *   "not mocked" stub in unit tests, and a cipher that can only be tested on a
 *   device is a cipher that is tested after it ships.
 * - the `String` half is the wire format, and base64 lives only there.
 *   `android.util.Base64` rather than `java.util.Base64` because the latter is
 *   API 26+ and this module supports minSdk 24.
 */
object Envelope {
  /** AES-256 takes a 32-byte key; the "256" is bits. */
  const val KEY_BYTES = 32
  /** GCM's standard nonce length. The backend writes 12 and reads 12. */
  const val IV_BYTES = 12
  /** GCM tag length, appended to the ciphertext rather than carried beside it. */
  const val AUTH_TAG_BYTES = 16

  private const val TRANSFORMATION = "AES/GCM/NoPadding"
  private const val ALGORITHM = "AES"
  private const val TAG_BITS = AUTH_TAG_BYTES * 8
  private const val HEX_RADIX = 16
  private const val HEX_CHARS_PER_BYTE = 2

  sealed class Failure(message: String) : Exception(message) {
    object BadKeyLength : Failure("key must be 32 bytes of hex")
    object BadIvLength : Failure("iv must be 12 bytes")
    object PayloadShorterThanTag : Failure("payload cannot hold an auth tag")
    object NotBase64 : Failure("payload or iv is not base64")
    object AuthenticationFailed : Failure("auth tag did not verify")
  }

  /** What a sealed envelope looks like on the wire. */
  data class Sealed(val payload: String, val iv: String)

  /** Parses the 64-character hex form the app and CI both carry the key in. */
  fun keyFromHex(hex: String): SecretKeySpec {
    if (hex.length != KEY_BYTES * HEX_CHARS_PER_BYTE) throw Failure.BadKeyLength
    val bytes = ByteArray(KEY_BYTES)
    for (i in 0 until KEY_BYTES) {
      val at = i * HEX_CHARS_PER_BYTE
      val byte = hex.substring(at, at + HEX_CHARS_PER_BYTE).toIntOrNull(HEX_RADIX) ?: throw Failure.BadKeyLength
      bytes[i] = byte.toByte()
    }
    return SecretKeySpec(bytes, ALGORITHM)
  }

  /**
   * Seals JSON text for the wire, drawing a fresh nonce per call — reusing one
   * under the same key is the mistake GCM never recovers from. The nonce is
   * generated here rather than left to the provider, because `Cipher.init`
   * without parameters picks its own and only some providers hand it back.
   */
  fun seal(json: String, key: SecretKeySpec): Sealed {
    val iv = ByteArray(IV_BYTES).also { SecureRandom().nextBytes(it) }
    return Sealed(payload = encode(sealBytes(json, key, iv)), iv = encode(iv))
  }

  /** Opens a payload the backend sealed and returns the JSON text inside. */
  fun open(payload: String, iv: String, key: SecretKeySpec): String =
    openBytes(decode(payload), decode(iv), key)

  /**
   * The cipher itself, with the nonce supplied.
   *
   * `internal` because a caller who chooses the nonce can repeat it, and one
   * repeated nonce under a fixed key is enough to lose the key's integrity
   * guarantee. The parity test needs it: a supplied nonce is what makes the
   * sealed bytes comparable to the fixture byte for byte, which is the only way
   * to check the ENCRYPT direction rather than a round trip that would pass
   * against two implementations of the same mistake.
   */
  internal fun sealBytes(json: String, key: SecretKeySpec, iv: ByteArray): ByteArray {
    if (iv.size != IV_BYTES) throw Failure.BadIvLength
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(TAG_BITS, iv))
    // doFinal appends the tag, which is the wire format: ciphertext || tag.
    return cipher.doFinal(json.toByteArray(Charsets.UTF_8))
  }

  internal fun openBytes(sealed: ByteArray, iv: ByteArray, key: SecretKeySpec): String {
    // Both lengths are checked before the cipher sees them: a short nonce is
    // silently accepted by some providers, which turns a malformed message into
    // a plausible-looking failure much further downstream.
    if (iv.size != IV_BYTES) throw Failure.BadIvLength
    if (sealed.size <= AUTH_TAG_BYTES) throw Failure.PayloadShorterThanTag

    return try {
      val cipher = Cipher.getInstance(TRANSFORMATION)
      cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(TAG_BITS, iv))
      String(cipher.doFinal(sealed), Charsets.UTF_8)
    } catch (_: GeneralSecurityException) {
      // A tag mismatch and a malformed box mean the same thing to the caller:
      // do not trust these bytes.
      throw Failure.AuthenticationFailed
    }
  }

  private fun encode(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.NO_WRAP)

  private fun decode(value: String): ByteArray =
    try {
      Base64.decode(value, Base64.DEFAULT)
    } catch (_: IllegalArgumentException) {
      throw Failure.NotBase64
    }
}
