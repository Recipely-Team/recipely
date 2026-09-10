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
/// - Note: **English only, so far.** The strings are literals rather than a
///   localized catalogue, so Siri matches them in English on any device. The
///   fourteen-language catalogue generated from `i18n` is the next step, and it
///   is a build-input change rather than a code one.
@available(iOS 17.2, *)
struct RecipelyShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: RecipelyAskIntent(),
      phrases: ["Ask \(.applicationName)"],
      shortTitle: "Ask Recipely",
      systemImageName: "bubble.left.and.text.bubble.right"
    )
    AppShortcut(
      intent: RecipelyOpenRecipeIntent(),
      phrases: ["Open a recipe in \(.applicationName)"],
      shortTitle: "Open Recipe",
      systemImageName: "book"
    )
    AppShortcut(
      intent: RecipelySaveRecipeIntent(),
      phrases: ["Save a recipe in \(.applicationName)"],
      shortTitle: "Save Recipe",
      systemImageName: "bookmark"
    )
    AppShortcut(
      intent: RecipelyLikeRecipeIntent(),
      phrases: ["Like a recipe in \(.applicationName)"],
      shortTitle: "Like Recipe",
      systemImageName: "heart"
    )
    AppShortcut(
      intent: RecipelyReadIngredientsIntent(),
      phrases: ["Read the ingredients in \(.applicationName)"],
      shortTitle: "Read Ingredients",
      systemImageName: "list.bullet"
    )
    AppShortcut(
      intent: RecipelyReadNextStepIntent(),
      phrases: ["What is the next step in \(.applicationName)"],
      shortTitle: "Next Step",
      systemImageName: "arrow.right.circle"
    )
    AppShortcut(
      intent: RecipelyStartTimerIntent(),
      phrases: ["Start the timer in \(.applicationName)"],
      shortTitle: "Start Timer",
      systemImageName: "timer"
    )
    AppShortcut(
      intent: RecipelyGenerateRecipeIntent(),
      phrases: ["Create a recipe in \(.applicationName)"],
      shortTitle: "Create Recipe",
      systemImageName: "wand.and.stars"
    )
    AppShortcut(
      intent: RecipelyImportRecipeIntent(),
      phrases: ["Import a recipe into \(.applicationName)"],
      shortTitle: "Import Recipe",
      systemImageName: "square.and.arrow.down"
    )
    AppShortcut(
      intent: RecipelyOpenMyRecipesIntent(),
      phrases: ["Open my recipes in \(.applicationName)"],
      shortTitle: "My Recipes",
      systemImageName: "square.grid.2x2"
    )
  }
}
