import AppIntents

/// "Make me a recipe in Recipely" — then Siri asks what for.
///
/// - Note: **The prompt is asked for, not spoken in the phrase.** Siri will not
///   fill a freeform `String` from inside an App Shortcut phrase, so the phrase
///   carries no parameter and `requestValueDialog` makes Siri ask a second
///   question. That is the only way an arbitrary sentence reaches a custom
///   intent; `ShowInAppSearchResultsIntent` is the single-turn exception and it
///   is reserved for search.
@available(iOS 17.2, *)
struct RecipelyGenerateRecipeIntent: AppIntent {
  static let title: LocalizedStringResource = "Create a Recipe"
  static let description = IntentDescription("Creates a new recipe from what you describe.")
  static let openAppWhenRun = true

  @Parameter(
    title: "Description",
    requestValueDialog: IntentDialog(LocalizedStringResource("What would you like to cook?", table: "RecipelyIntents"))
  )
  var prompt: String

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "generateRecipe", action: "generateRecipe", arg: prompt)
    return .result()
  }
}
