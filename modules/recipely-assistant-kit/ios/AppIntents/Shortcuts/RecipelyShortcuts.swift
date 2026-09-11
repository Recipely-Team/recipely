import AppIntents

/// The phrases Siri accepts without the user setting anything up.
///
/// - Note: **`applicationName` is required in every phrase, by Apple.** A phrase
///   without it is dropped silently at build time, which is the worst kind of
///   failure here: the intent exists, Shortcuts lists it, and only the spoken
///   route is missing.
/// - Note: **Ten phrases, not eleven.** `RecipelySearchIntent` conforms to
///   `ShowInAppSearchResultsIntent`, which the system phrases itself — declaring
///   one here would compete with Siri's own "search X in Recipely" handling.
/// - Note: **Nothing destructive is here, and nothing here is destructive.** The
///   five confirmed actions are absent from the catalogue entirely, so no phrase
///   can reach one; `check:structure` rule X is what keeps that true.
/// - Note: **These literals are lookup KEYS, not the phrases users say.** Apple
///   resolves each against `<lang>.lproj/AppShortcuts.strings`, which
///   `scripts/generate-app-shortcuts.mjs` writes for all fourteen shipped
///   languages from the i18n catalogue. The English here has to match
///   `en.osIntentPhrases` character for character — the generator refuses to
///   write anything when it does not — because a key that misses resolves to
///   itself and Siri quietly matches English on every device.
@available(iOS 17.2, *)
struct RecipelyShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: RecipelyAskIntent(),
      phrases: ["Ask \(.applicationName)"],
      shortTitle: LocalizedStringResource("Ask Recipely", table: "RecipelyIntents"),
      systemImageName: "bubble.left.and.text.bubble.right"
    )
    AppShortcut(
      intent: RecipelyOpenRecipeIntent(),
      phrases: ["Open a recipe in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Open Recipe", table: "RecipelyIntents"),
      systemImageName: "book"
    )
    AppShortcut(
      intent: RecipelySaveRecipeIntent(),
      phrases: ["Save a recipe in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Save Recipe", table: "RecipelyIntents"),
      systemImageName: "bookmark"
    )
    AppShortcut(
      intent: RecipelyLikeRecipeIntent(),
      phrases: ["Like a recipe in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Like Recipe", table: "RecipelyIntents"),
      systemImageName: "heart"
    )
    AppShortcut(
      intent: RecipelyReadIngredientsIntent(),
      phrases: ["Read the ingredients in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Read Ingredients", table: "RecipelyIntents"),
      systemImageName: "list.bullet"
    )
    AppShortcut(
      intent: RecipelyReadNextStepIntent(),
      phrases: ["What is the next step in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Next Step", table: "RecipelyIntents"),
      systemImageName: "arrow.right.circle"
    )
    AppShortcut(
      intent: RecipelyStartTimerIntent(),
      phrases: ["Start the timer in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Start Timer", table: "RecipelyIntents"),
      systemImageName: "timer"
    )
    AppShortcut(
      intent: RecipelyGenerateRecipeIntent(),
      phrases: ["Create a recipe in \(.applicationName)"],
      shortTitle: LocalizedStringResource("Create Recipe", table: "RecipelyIntents"),
      systemImageName: "wand.and.stars"
    )
    AppShortcut(
      intent: RecipelyImportRecipeIntent(),
      phrases: ["Import a recipe into \(.applicationName)"],
      shortTitle: LocalizedStringResource("Import Recipe", table: "RecipelyIntents"),
      systemImageName: "square.and.arrow.down"
    )
    AppShortcut(
      intent: RecipelyOpenMyRecipesIntent(),
      phrases: ["Open my recipes in \(.applicationName)"],
      shortTitle: LocalizedStringResource("My Recipes", table: "RecipelyIntents"),
      systemImageName: "square.grid.2x2"
    )
  }
}
