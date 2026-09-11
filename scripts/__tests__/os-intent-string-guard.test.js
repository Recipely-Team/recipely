const { findBareString } = require('../os-intent-string-guard.cjs');

/**
 * The guard that keeps every string an App Intent shows or says in the
 * `RecipelyIntents` table. It was proved once by hand; this is what keeps a
 * later edit from quietly dropping a form it used to refuse.
 */
describe('os-intent-string-guard — what reaches the user in English', () => {
  it.each([
    ['static let title: LocalizedStringResource = "Ask Recipely"'],
    ['static let description = IntentDescription("Asks anything.")'],
    ['static let description: IntentDescription = "Asks anything."'],
    ['static let typeDisplayRepresentation: TypeDisplayRepresentation = "Recipe"'],
    ['static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Recipe")'],
    ['@Parameter(title: "Recipe")'],
    ['@Parameter(title: LocalizedStringResource("Recipe", table: "RecipelyIntents"), description: "Which one")'],
    ['shortTitle: "Ask Recipely",'],
    ['requestValueDialog: "What would you like to ask?"'],
    ['return .result(dialog: "Done")'],
    ['IntentDialog("Done")'],
    ['IntentDialog(stringLiteral: "Done")'],
    ['LocalizedStringResource("Recipe")'],
    ['LocalizedStringResource("Recipe", table: "RecipelyIntent")'],
    ['LocalizedStringResource("Recipe", table: "Localizable")'],
    ['throw $recipe.needsValueError("Which recipe?")'],
    ['let v = try await $recipe.requestValue("Which recipe?")'],
    ['let s = String(localized: "Recipe")'],
    ['DisplayRepresentation(title: "\\(name) recipe")'],
    ['static var caseDisplayRepresentations: [Kind: DisplayRepresentation] = [.main: "Main course"]'],
  ])('refuses %s', (line) => {
    expect(findBareString(line)).not.toBeNull();
  });

  it.each([
    ['static let title = LocalizedStringResource("Ask Recipely", table: "RecipelyIntents")'],
    ['requestValueDialog: IntentDialog(LocalizedStringResource("What would you like to ask?", table: "RecipelyIntents"))'],
    ['return DisplayRepresentation(title: "\\(title)", subtitle: "\\(subtitle)")'],
    ['return .result(dialog: IntentDialog(stringLiteral: reply.text))'],
    ['return .result(dialog: "\\(answer)")'],
    ['/// requestValueDialog: "quoted in a doc comment"'],
    ['// title: "an inline comment"'],
    ['phrases: ["Ask \\(.applicationName)"]'],
  ])('allows %s', (line) => {
    expect(findBareString(line)).toBeNull();
  });
});
