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

  /**
   * How many of the four launcher slots the static shortcuts already hold.
   *
   * `shortcuts.xml` is generated from the catalogue entries marked
   * `launcherShortcut`, and static and dynamic shortcuts share one budget — so
   * publishing up to the platform maximum would push the static ones out of the
   * menu they were written for.
   */
  private const val STATIC_SHORTCUT_COUNT = 4

  fun publish(context: Context) {
    val entries = RecipelyAssistantStore.entities(context, ENTITY_KIND)
    ShortcutManagerCompat.removeAllDynamicShortcuts(context)

    // Asked of the platform rather than guessed: the cap differs by API level
    // and by launcher, and a hard-coded one is wrong on both sides — it either
    // wastes slots or silently drops the recipes past it.
    val budget = ShortcutManagerCompat.getMaxShortcutCountPerActivity(context) -
      STATIC_SHORTCUT_COUNT
    val limit = minOf(entries.length(), maxOf(budget, 0))
    for (index in 0 until limit) {
      val entry = entries.optJSONObject(index) ?: continue
      val id = entry.optString("id")
      val title = entry.optString("title")
      // `continue` inside an inline lambda (`ifEmpty { continue }`) needs
      // Kotlin language version 2.2, which this project is below; it compiles
      // nowhere that matters and no JavaScript gate would have said so.
      if (id.isEmpty() || title.isEmpty()) continue

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

  /**
   * The link a recipe shortcut opens, spelled the way `parseOsIntentLink` reads.
   *
   * The catalogue id comes FIRST and is not optional: the parser refuses a link
   * without one, because the open-ended entry has no action and a link that
   * spelled its absence as text would ask the registry to run a word called
   * "null". The scheme differs per variant, so it is read rather than compiled in.
   */
  private fun deepLink(context: Context, recipeId: String): String {
    val scheme = RecipelyAssistantConfig.scheme(context)
    val arg = URLEncoder.encode(recipeId, "UTF-8")
    return "$scheme://assistant/run?id=openRecipe&action=openRecipe&arg=$arg"
  }
}
