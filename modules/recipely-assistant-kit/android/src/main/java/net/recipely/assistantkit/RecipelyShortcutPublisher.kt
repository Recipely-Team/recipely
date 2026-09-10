package net.recipely.assistantkit

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.net.URLEncoder
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat

/**
 * Publishes the app's recipes as dynamic shortcuts.
 *
 * The Android answer to iOS's `AppEntity` catalogue: what the user can name out
 * loud has to exist on the device before the app runs, and on Android that
 * store is the shortcut list. `pushDynamicShortcut` is what makes them eligible
 * for Google's own surfaces rather than only the launcher's long-press menu.
 *
 * Faz 0 scope: proves the mechanism with the entity catalogue the JS side has
 * already written. The static capability bindings are generated in Faz 4.
 */
object RecipelyShortcutPublisher {
  private const val ENTITY_KIND = "recipe"

  /** Android caps dynamic shortcuts per app; the rest are simply not published. */
  private const val MAX_SHORTCUTS = 8

  fun publish(context: Context) {
    val entries = RecipelyAssistantStore.entities(context, ENTITY_KIND)
    ShortcutManagerCompat.removeAllDynamicShortcuts(context)

    val limit = minOf(entries.length(), MAX_SHORTCUTS)
    for (index in 0 until limit) {
      val entry = entries.optJSONObject(index) ?: continue
      val id = entry.optString("id").ifEmpty { continue }
      val title = entry.optString("title").ifEmpty { continue }

      val shortcut = ShortcutInfoCompat.Builder(context, "recipe-$id")
        .setShortLabel(title)
        .setLongLabel(title)
        .setIcon(IconCompat.createWithResource(context, context.applicationInfo.icon))
        .setIntent(
          Intent(Intent.ACTION_VIEW, Uri.parse(deepLink(context, id)))
            .setPackage(context.packageName),
        )
        .build()

      ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
    }
  }

  /** The scheme differs per variant, so it is read rather than compiled in. */
  private fun deepLink(context: Context, recipeId: String): String {
    val scheme = RecipelyAssistantConfig.scheme(context)
    val arg = URLEncoder.encode(recipeId, "UTF-8")
    return "$scheme://assistant/run?action=openRecipe&arg=$arg"
  }
}
