package net.recipely.assistantkit

import android.content.Context
import android.content.pm.PackageManager

/**
 * The build-time facts the native side needs but must not compile in.
 *
 * There are two variants with two package names and two URL schemes, so a
 * constant here would have sent the dev build's shortcuts at the production
 * app. `plugins/withAssistantKit.js` writes them into the manifest as
 * `meta-data` at prebuild and this reads them back — the same trick the iOS
 * half plays with `Info.plist`, and the same one `app.config.ts` already plays
 * for the Google URL scheme.
 */
object RecipelyAssistantConfig {
  private const val SCHEME_META_DATA = "net.recipely.assistantkit.SCHEME"
  private const val ENVELOPE_KEY_META_DATA = "net.recipely.assistantkit.ENVELOPE_KEY"
  private const val FALLBACK_SCHEME = "recipely"

  fun scheme(context: Context): String = metaData(context)?.getString(SCHEME_META_DATA) ?: FALLBACK_SCHEME

  /**
   * The envelope key, or `null` when this build was made without one.
   *
   * There is deliberately no fallback. A wrong key and a missing key look
   * identical to a caller that defaults, and the symptom would be every headless
   * request failing its auth tag while the code reports a network problem. Null
   * means "answer by opening the app", which is worse for the user and honest.
   */
  fun envelopeKeyHex(context: Context): String? =
    metaData(context)?.getString(ENVELOPE_KEY_META_DATA)?.takeIf { it.length == Envelope.KEY_BYTES * 2 }

  private fun metaData(context: Context) = runCatching {
    context.packageManager
      .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
      .metaData
  }.getOrNull()
}
