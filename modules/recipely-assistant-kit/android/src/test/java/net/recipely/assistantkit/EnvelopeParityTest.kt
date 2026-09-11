package net.recipely.assistantkit

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.io.File
import java.util.Base64
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

/**
 * The Kotlin third of the envelope parity suite.
 *
 * The same fixture is read by `envelope-parity.test.ts` (@noble/ciphers) and by
 * `scripts/verify-swift-envelope.swift` (CryptoKit); the bytes in it came from
 * OpenSSL, which is a fourth implementation and none of the three under test.
 *
 * Why this file exists at all: a headless shortcut answers with no React Native
 * bridge (finding D2), so these bytes are produced by Kotlin and read by the
 * backend with nothing of ours in between. "It works in JS" is not evidence
 * about this path.
 *
 * `java.util.Base64` here and `android.util.Base64` in the code under test is
 * deliberate: the test runs on a JVM where the Android class is a throwing stub,
 * and using the JDK one keeps the test honest about the bytes rather than
 * agreeing with whatever the production encoder did.
 */
class EnvelopeParityTest {
  private val fixture: JsonObject = JsonParser.parseString(findFixture().readText()).asJsonObject
  private val key = Envelope.keyFromHex(fixture["keyHex"].asString)

  @Test
  fun `opens every payload OpenSSL sealed`() {
    for (vector in fixture["vectors"].asJsonArray.map { it.asJsonObject }) {
      val opened = Envelope.openBytes(
        sealed = decode(vector["payloadBase64"].asString),
        iv = decode(vector["ivBase64"].asString),
        key = key,
      )

      assertEquals(vector["name"].asString, vector["plaintext"].asString, opened)
    }
  }

  @Test
  fun `seals the same bytes OpenSSL did, given the same nonce`() {
    for (vector in fixture["vectors"].asJsonArray.map { it.asJsonObject }) {
      val sealed = Envelope.sealBytes(
        json = vector["plaintext"].asString,
        key = key,
        iv = decode(vector["ivBase64"].asString),
      )

      // Byte-exact, not a round trip: a round trip passes against two
      // implementations of the same mistake. The Turkish vector is the one that
      // fails here if the encoding is ever anything but UTF-8.
      assertArrayEquals(vector["name"].asString, decode(vector["payloadBase64"].asString), sealed)
    }
  }

  /**
   * Asserts the NAMED refusal, not merely that something was thrown.
   *
   * Measured: deleting the IV-length guard from `Envelope.kt` left all four of
   * these tests green, because `javax.crypto` tolerates an arbitrary GCM IV
   * length and fails the tag instead — a different refusal that satisfied an
   * assertion asking only for `Envelope.Failure`. The fixture now names the
   * expected one, so the three implementations are pinned to refuse for the same
   * REASON rather than merely to refuse.
   */
  @Test
  fun `refuses what every implementation must refuse, for the named reason`() {
    for (reject in fixture["rejects"].asJsonArray.map { it.asJsonObject }) {
      val sealed = decode(reject["payloadBase64"].asString)
      val iv = decode(reject["ivBase64"].asString)
      val name = reject["name"].asString

      val thrown = assertThrows(name, Envelope.Failure::class.java) {
        Envelope.openBytes(sealed, iv, key)
      }

      assertEquals(name, expectedFailure(reject["failure"].asString), thrown)
    }
  }

  @Test
  fun `refuses a key that is not 32 bytes of hex`() {
    assertThrows(Envelope.Failure::class.java) { Envelope.keyFromHex("abc") }
    assertThrows(Envelope.Failure::class.java) { Envelope.keyFromHex("z".repeat(64)) }
    // Both are 64 characters and both used to parse: `"-1".toIntOrNull(16)` is -1
    // and became the byte 0xFF, and Swift accepted the `"+a"` form for the same
    // reason. A key nobody typed is worse than a refused one.
    assertThrows(Envelope.Failure::class.java) { Envelope.keyFromHex("-1".repeat(32)) }
    assertThrows(Envelope.Failure::class.java) { Envelope.keyFromHex("+a".repeat(32)) }
  }

  private fun decode(value: String): ByteArray = Base64.getDecoder().decode(value)

  /**
   * Maps the fixture's refusal name onto this implementation's failure.
   *
   * An unknown name throws rather than skipping: a fixture that grows a case this
   * side cannot answer must fail loudly, not quietly verify two of three.
   */
  private fun expectedFailure(name: String): Envelope.Failure =
    when (name) {
      "authenticationFailed" -> Envelope.Failure.AuthenticationFailed
      "badIvLength" -> Envelope.Failure.BadIvLength
      "payloadShorterThanTag" -> Envelope.Failure.PayloadShorterThanTag
      "notBase64" -> Envelope.Failure.NotBase64
      else -> throw IllegalArgumentException("fixture names a refusal this test cannot map: \$name")
    }

  /**
   * Walks up from the working directory rather than hard-coding a depth: Gradle
   * does not promise which directory a unit test starts in, and a path that is
   * right today breaks silently — as a skipped file, not a failure — the first
   * time the module moves.
   */
  private fun findFixture(): File {
    var dir: File? = File(".").absoluteFile
    while (dir != null) {
      val candidate = File(dir, "__fixtures__/aes-gcm-vectors.json")
      if (candidate.isFile) return candidate
      dir = dir.parentFile
    }
    throw IllegalStateException("aes-gcm-vectors.json not found above ${File(".").absolutePath}")
  }
}
