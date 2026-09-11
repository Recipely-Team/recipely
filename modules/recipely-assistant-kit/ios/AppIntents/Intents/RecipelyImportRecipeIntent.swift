import AppIntents

/// "Import a recipe into Recipely" — then Siri asks for the link.
@available(iOS 17.2, *)
struct RecipelyImportRecipeIntent: AppIntent {
  static let title = LocalizedStringResource("Import a Recipe", table: "RecipelyIntents")
  static let description = IntentDescription(LocalizedStringResource("Imports a recipe from a link you share.", table: "RecipelyIntents"))
  static let openAppWhenRun = true

  @Parameter(
    title: LocalizedStringResource("Link", table: "RecipelyIntents"),
    requestValueDialog: IntentDialog(LocalizedStringResource("Which link should I import?", table: "RecipelyIntents"))
  )
  var link: String

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "importRecipe", action: "importRecipe", arg: link)
    return .result()
  }
}
