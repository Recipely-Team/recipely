package net.recipely.assistantkit

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.TileService

/**
 * A Quick Settings tile that opens the cooking assistant.
 *
 * The surface this feature exists for. A launcher shortcut still needs the home
 * screen, the right page and an accurate long-press; the Quick Settings shade is
 * one pull and one tap from anywhere, including over another app and from the
 * lock screen. For someone whose hands are covered in flour that is the whole
 * difference.
 *
 * It opens the same deep link the launcher shortcuts use — the assistant panel,
 * with no question — so there is one route in and one thing to keep working.
 */
class RecipelyAssistantTileService : TileService() {
  override fun onClick() {
    super.onClick()

    val scheme = RecipelyAssistantConfig.scheme(this)
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("$scheme://$ASSISTANT_LINK"))
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    // `startActivityAndCollapse(Intent)` was deprecated in API 34 and throws
    // `UnsupportedOperationException` there — it is not merely discouraged, so
    // the branch is required rather than tidy.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startActivityAndCollapse(
        PendingIntent.getActivity(
          this,
          REQUEST_CODE,
          intent,
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        ),
      )
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(intent)
    }
  }

  private companion object {
    /** The same link the `askRecipely` launcher shortcut opens. */
    const val ASSISTANT_LINK = "assistant/run?id=askRecipely"
    const val REQUEST_CODE = 0
  }
}
