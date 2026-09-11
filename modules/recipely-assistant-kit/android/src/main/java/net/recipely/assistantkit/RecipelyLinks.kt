package net.recipely.assistantkit

import android.content.Context

/**
 * Every deep link the native side opens, built in one place.
 *
 * The tile and the widget each carried their own copy of the same path, which
 * is two chances to rename one of them. It also keeps the scheme adjacent to
 * the path in a single literal — `check:structure` rule W reads these strings
 * and refuses a link with no scheme, because a scheme-less `android:data`
 * matches `NO_MATCH_DATA` against every filter on the launcher activity and the
 * shortcut does nothing at all when tapped.
 */
internal object RecipelyLinks {
  /** Opens the assistant panel with no question, the way the tile and widget do. */
  fun assistant(context: Context): String =
    "${RecipelyAssistantConfig.scheme(context)}://assistant/run?id=askRecipely"

  /** Opens one recipe. */
  fun recipe(context: Context, encodedId: String): String =
    "${RecipelyAssistantConfig.scheme(context)}://assistant/run" +
      "?id=openRecipe&action=openRecipe&arg=$encodedId"
}
